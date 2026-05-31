import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';
import { normalizeAssignmentFKs, spawnTodayForTemplate, propagateAssignmentToTodaysTasks } from '../_helpers';

/**
 * GET /api/templates/[id]
 * Returns a single task template by ID with its checklist items.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('task_templates')
    .select(`
      id, name, description, type, frequency, priority, status,
      requires_approval, estimated_duration, is_default,
      task_category_id, compliance_type_id, room_id,
      assigned_member_id, assigned_role_id, department_id,
      assignment_mode, display_mode, task_reset_cadence,
      created_at, updated_at,
      checklist_items (
        id, label, sort_order,
        room_id, equipment_id, supply_category_id
      )
    `)
    .eq('id', id)
    .eq('practice_id', practiceId)
    .maybeSingle();

  if (error) return apiError(error);
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(data);
}

/**
 * PUT /api/templates/[id]
 * Updates a template's fields (not items — use /items for that).
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const body = await request.json() as {
    name?: string;
    description?: string;
    type?: string;
    task_category_id?: string | null;
    compliance_type_id?: string | null;
    room_id?: string | null;
    assigned_member_id?: string | null;
    assigned_role_id?: string | null;
    department_id?: string | null;
    frequency?: string | null;
    priority?: string;
    estimated_duration?: number | null;
    requires_approval?: boolean;
    status?: string;
    assignment_mode?: string;
    display_mode?: string;
    task_reset_cadence?: string | null;
  };

  // When the caller is touching assignment_mode in this request, normalize
  // the three assignment FKs together so non-mode FKs are forced to null.
  // Otherwise the existing row's invariant holds and we only patch the FKs
  // the caller explicitly sent.
  const assignmentPatch = body.assignment_mode !== undefined
    ? {
        assignment_mode: body.assignment_mode,
        ...normalizeAssignmentFKs(body.assignment_mode, {
          assigned_member_id: body.assigned_member_id,
          assigned_role_id: body.assigned_role_id,
          department_id: body.department_id,
        }),
      }
    : {
        ...(body.assigned_member_id !== undefined && { assigned_member_id: body.assigned_member_id || null }),
        ...(body.assigned_role_id !== undefined && { assigned_role_id: body.assigned_role_id || null }),
        ...(body.department_id !== undefined && { department_id: body.department_id || null }),
      };

  const admin = createAdminClient();

  // Read the prior display_mode so we can detect a flip after the update.
  // Tasks spawned under the old mode have the wrong shape for the new mode
  // (nested has one parent + task_checklist_items; expanded has one task per
  // item, no task_checklist_items). Without cleanup, the loadTasks render
  // filter hides the old shape and the generator's idempotency check refuses
  // to re-spawn — net result: nothing on the board.
  const { data: existing } = await admin
    .from('task_templates')
    .select('display_mode')
    .eq('id', id)
    .eq('practice_id', practiceId)
    .maybeSingle();

  const { data, error } = await admin
    .from('task_templates')
    .update({
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.task_category_id !== undefined && { task_category_id: body.task_category_id || null }),
      ...(body.compliance_type_id !== undefined && { compliance_type_id: body.compliance_type_id || null }),
      ...(body.room_id !== undefined && { room_id: body.room_id || null }),
      ...assignmentPatch,
      ...(body.frequency !== undefined && { frequency: body.frequency || null }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.estimated_duration !== undefined && { estimated_duration: body.estimated_duration }),
      ...(body.requires_approval !== undefined && { requires_approval: body.requires_approval }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.display_mode !== undefined && { display_mode: body.display_mode }),
      ...(body.task_reset_cadence !== undefined && { task_reset_cadence: body.task_reset_cadence }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('practice_id', practiceId)
    .select('id, name, description, type, frequency, priority, status, requires_approval, estimated_duration, is_default, task_category_id, compliance_type_id, room_id, assigned_member_id, assigned_role_id, department_id, assignment_mode, display_mode, task_reset_cadence, updated_at')
    .single();

  if (error) return apiError(error);
  if (!data) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

  // Display-mode flip — today's existing task(s) don't match the new shape,
  // so drop them. The generator call at the end of this handler will then
  // spawn fresh tasks in the new mode. Loses any in-progress completion on
  // today's old task, which is the right tradeoff: leaving a wrong-shape
  // task on the board (hidden by the loadTasks filter, with the generator's
  // idempotency check refusing to re-spawn) is a worse outcome.
  const modeFlipped =
    body.display_mode !== undefined &&
    existing != null &&
    existing.display_mode !== data.display_mode;

  if (modeFlipped) {
    const today = new Date().toISOString().slice(0, 10);
    await admin
      .from('tasks')
      .delete()
      .eq('template_id', id)
      .eq('due_date', today)
      .not('status', 'in', '(completed,skipped)');
  }

  // Mirror the new assignment onto today's existing un-completed task
  // instances. The daily generator is idempotent on (template_id, today),
  // so once today's task exists a re-spawn won't pick up the new assignee.
  // Only runs if this PATCH actually touched an assignment field. Skipped
  // when mode flipped — we just deleted those tasks and the spawn below
  // will pick up the new assignment from the template directly.
  const assignmentTouched =
    body.assignment_mode !== undefined ||
    body.assigned_member_id !== undefined ||
    body.assigned_role_id !== undefined ||
    body.department_id !== undefined;
  if (assignmentTouched && !modeFlipped) {
    await propagateAssignmentToTodaysTasks(admin, practiceId, id, data);
  }

  // Spawn today's instance if this update flipped the template into a state
  // that should be running (e.g. draft → active, or assignment FK filled in,
  // or display_mode flipped + tasks just dropped above). Idempotent at the
  // SQL layer.
  await spawnTodayForTemplate(admin, practiceId, data);

  return NextResponse.json(data);
}

/**
 * DELETE /api/templates/[id]
 * Deletes a template. Defaults (is_default=true) are deletable too — the flag
 * remains as a "this row was seeded" signal but no longer gates removal, so
 * admins can fully customize their template library.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const admin = createAdminClient();

  // .select() on a delete returns the deleted rows so we can disambiguate
  // "deleted nothing" (404) from "delete succeeded" (204) without a separate
  // precondition query.
  const { data: deleted, error } = await admin
    .from('task_templates')
    .delete()
    .eq('id', id)
    .eq('practice_id', practiceId)
    .select('id');

  if (error) return apiError(error);
  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
