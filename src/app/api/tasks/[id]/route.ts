import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, isAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';
import { resolveTaskScope, taskInScope } from '@/lib/task-scope';

/**
 * GET /api/tasks/[id]
 * Fetch a single task with joined context (matches TaskViewData shape).
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
    .from('tasks')
    .select(`
      id, title, status, priority, frequency, due_date,
      assigned_to, assigned_department, assigned_role_id,
      task_types(name),
      departments!tasks_assigned_department_fkey(name, color),
      rooms(name),
      equipment(name),
      assigned_member:practice_members!tasks_assigned_to_fkey(
        id,
        profiles(first_name, last_name),
        practice_role_types(name)
      ),
      assigned_role:practice_role_types!tasks_assigned_role_id_fkey(name),
      task_checklist_items(id)
    `)
    .eq('id', id)
    .eq('practice_id', practiceId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Authorize visibility — return 404 (not 403) so we don't leak existence.
  const scope = await resolveTaskScope(admin, authUser, practiceId);
  if (!taskInScope(scope, {
    assigned_to: data.assigned_to,
    assigned_department: data.assigned_department,
    assigned_role_id: data.assigned_role_id,
  })) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const first = <T,>(v: T | T[] | null): T | null => Array.isArray(v) ? (v[0] ?? null) : v;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const taskType = first(data.task_types as any) as { name: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dept = first(data.departments as any) as { name: string; color: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const room = first(data.rooms as any) as { name: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const equip = first(data.equipment as any) as { name: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const member = first(data.assigned_member as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberProfile = member ? first((member as any).profiles) as { first_name: string; last_name: string } | null : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberRole = member ? first((member as any).practice_role_types) as { name: string } | null : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignedRole = first(data.assigned_role as any) as { name: string } | null;
  const checklistItems = Array.isArray(data.task_checklist_items) ? data.task_checklist_items : [];

  // Mirror TasksClient.toMockTask: discriminate by which FK is set, since tasks
  // have no assignment_mode column. Order: individual > role > department > pool.
  let assignmentType: 'individual' | 'role' | 'department' | 'pool';
  let assignmentValue: string;
  if (data.assigned_to) {
    assignmentType = 'individual';
    assignmentValue = memberProfile
      ? `${memberProfile.first_name} ${memberProfile.last_name}`.trim()
      : '';
  } else if (assignedRole) {
    assignmentType = 'role';
    assignmentValue = assignedRole.name;
  } else if (dept) {
    assignmentType = 'department';
    assignmentValue = dept.name;
  } else {
    assignmentType = 'pool';
    assignmentValue = '';
  }

  return NextResponse.json({
    id: data.id,
    title: data.title,
    templateName: taskType?.name ?? 'Task',
    taskType: (taskType?.name ?? 'checklist').toLowerCase().replace(/\s+/g, '_'),
    due: data.due_date ? 'Due today' : 'Due today',
    dept: dept?.name ?? '',
    deptColor: dept?.color ?? 'blue',
    freq: data.frequency ?? 'Daily',
    priority: data.priority,
    assignee: memberProfile ? `${memberProfile.first_name} ${memberProfile.last_name}`.trim() : 'Unassigned',
    assigneeRole: memberRole?.name ?? '',
    checked: data.status === 'completed',
    assignmentType,
    assignmentValue,
    room: room?.name,
    equipment: equip?.name,
    checklistTotal: checklistItems.length,
    checklistCompleted: 0,
  });
}

const ALLOWED_FIELDS = [
  'title', 'description', 'task_type_id', 'room_id', 'equipment_id',
  'supply_category_id', 'assigned_to', 'assigned_department',
  'status', 'priority', 'frequency', 'due_date',
] as const;

// Fields that constitute reassignment — admin-only (launch-checklist 0.7).
// Non-admins can update other allowed fields (e.g. status), but never
// change who a task is assigned to.
const ASSIGNMENT_FIELDS = ['assigned_to', 'assigned_department'] as const;

/**
 * PATCH /api/tasks/[id]
 * Update a task's fields.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const body = await request.json();

  // Reassignment (changing assigned_to / assigned_department) is admin-only.
  // Non-admins changing only other fields (status etc.) is fine.
  if (!isAdmin(authUser.profile.system_role)) {
    for (const key of ASSIGNMENT_FIELDS) {
      if (key in body) {
        return NextResponse.json(
          { error: 'Only admins can reassign tasks' },
          { status: 403 },
        );
      }
    }
  }

  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // Handle completed_at when status changes to completed
  if (updates.status === 'completed') {
    updates.completed_at = new Date().toISOString();
  } else if (updates.status && updates.status !== 'completed') {
    updates.completed_at = null;
  }

  const admin = createAdminClient();

  // Authorize: callers can only PATCH tasks they're allowed to see.
  const { data: existing, error: existingErr } = await admin
    .from('tasks')
    .select('id, assigned_to, assigned_department, assigned_role_id')
    .eq('id', id)
    .eq('practice_id', practiceId)
    .maybeSingle();
  if (existingErr) return NextResponse.json({ error: existingErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  const scope = await resolveTaskScope(admin, authUser, practiceId);
  if (!taskInScope(scope, {
    assigned_to: existing.assigned_to,
    assigned_department: existing.assigned_department,
    assigned_role_id: existing.assigned_role_id,
  })) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const { data, error } = await admin
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('practice_id', practiceId)
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  return NextResponse.json({ id: data.id });
}
