import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';
import { normalizeAssignmentFKs, spawnTodayForTemplate } from '../_helpers';

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
      assignment_mode, display_mode,
      created_at, updated_at,
      checklist_items (
        id, label, sort_order,
        room_id, equipment_id, supply_category_id
      )
    `)
    .eq('id', id)
    .eq('practice_id', practiceId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('practice_id', practiceId)
    .select('id, name, description, type, frequency, priority, status, requires_approval, estimated_duration, is_default, task_category_id, compliance_type_id, room_id, assigned_member_id, assigned_role_id, department_id, assignment_mode, display_mode, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

  // Spawn today's instance if this update flipped the template into a state
  // that should be running (e.g. draft → active, or assignment FK filled in).
  // Idempotent at the SQL layer.
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
