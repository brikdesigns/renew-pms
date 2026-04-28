import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';
import { resolveTaskScope } from '@/lib/task-scope';
import { TASK_SELECT, flattenTask, loadTasks } from './_helpers';

/**
 * GET /api/tasks?date=YYYY-MM-DD
 * Returns tasks with assigned_to set, for the given date (default: today).
 * Includes tasks due on that date OR with status = 'overdue'.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  const dateValue = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : new Date().toISOString().slice(0, 10);
  const pool = searchParams.get('pool') === 'true';

  const admin = createAdminClient();
  const scope = await resolveTaskScope(admin, authUser, practiceId);

  try {
    const flatTasks = await loadTasks(admin, practiceId, scope, dateValue, { pool });
    return NextResponse.json(flatTasks);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load tasks';
    console.error('[GET /api/tasks] failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/tasks
 * Create a new task.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  // Only admins (and brik_admin) can create tasks. Managers/staff use the
  // existing pool/assignment flows; bulk task authorship is an admin tool.
  const role = authUser.profile.system_role;
  if (role !== 'brik_admin' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();

  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('tasks')
    .insert({
      practice_id: practiceId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      template_id: body.template_id || null,
      task_type_id: body.task_type_id || null,
      room_id: body.room_id || null,
      equipment_id: body.equipment_id || null,
      supply_category_id: body.supply_category_id || null,
      assigned_to: body.assigned_to || null,
      assigned_department: body.assigned_department || null,
      assigned_role_id: body.assigned_role_id || null,
      status: body.status || 'not_started',
      priority: body.priority || 'medium',
      frequency: body.frequency || null,
      due_date: body.due_date || null,
      created_by: authUser.profile.id,
    })
    .select(TASK_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If created from a template, copy its checklist items into task_checklist_items
  if (body.template_id && data) {
    const { data: templateItems } = await admin
      .from('checklist_items')
      .select('label, sort_order, room_id, equipment_id, supply_category_id')
      .eq('template_id', body.template_id)
      .order('sort_order');

    if (templateItems && templateItems.length > 0) {
      await admin.from('task_checklist_items').insert(
        templateItems.map((item) => ({
          task_id: data.id,
          practice_id: practiceId,
          label: item.label,
          sort_order: item.sort_order,
          room_id: item.room_id,
          equipment_id: item.equipment_id,
          supply_category_id: item.supply_category_id,
        }))
      );
    }
  }

  return NextResponse.json(flattenTask(data), { status: 201 });
}
