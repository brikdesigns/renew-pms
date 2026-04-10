import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

// ─── Join types ─────────────────────────────────────────────────────────────

type ProfileJoin = { first_name: string; last_name: string };
type DepartmentJoin = { name: string; color: string };
type RoleJoin = { name: string; departments: DepartmentJoin | DepartmentJoin[] | null };
type MemberJoin = {
  id: string;
  profiles: ProfileJoin | ProfileJoin[] | null;
  practice_role_types: RoleJoin | RoleJoin[] | null;
};
type TaskTypeJoin = { name: string };
type RoomJoin = { name: string };
type EquipmentJoin = { name: string };
type SupplyCategoryJoin = { name: string };

interface RawTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  frequency: string | null;
  due_date: string | null;
  assigned_to: string;
  assigned_role_id: string | null;
  assigned_department: string | null;
  task_type_id: string | null;
  room_id: string | null;
  equipment_id: string | null;
  supply_category_id: string | null;
  task_types: TaskTypeJoin | TaskTypeJoin[] | null;
  rooms: RoomJoin | RoomJoin[] | null;
  equipment: EquipmentJoin | EquipmentJoin[] | null;
  supply_categories: SupplyCategoryJoin | SupplyCategoryJoin[] | null;
  departments: DepartmentJoin | DepartmentJoin[] | null;
  practice_members: MemberJoin | MemberJoin[] | null;
}

function first<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function flattenTask(t: RawTask) {
  const member = first(t.practice_members);
  const profile = member ? first(member.profiles) : null;
  const role = member ? first(member.practice_role_types) : null;
  const roleDept = role ? first(role.departments) : null;
  const taskDept = first(t.departments);
  const taskType = first(t.task_types);
  const room = first(t.rooms);
  const equipment = first(t.equipment);
  const supplyCategory = first(t.supply_categories);

  // Task's assigned department takes priority over the member's role department
  const dept = taskDept ?? roleDept;

  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    frequency: t.frequency,
    due_date: t.due_date,
    type_name: taskType?.name ?? null,
    task_type_id: t.task_type_id,
    room_name: room?.name ?? null,
    room_id: t.room_id,
    equipment_name: equipment?.name ?? null,
    equipment_id: t.equipment_id,
    supply_category_name: supplyCategory?.name ?? null,
    supply_category_id: t.supply_category_id,
    assigned_to: t.assigned_to,
    assigned_role_id: t.assigned_role_id,
    assigned_department: t.assigned_department,
    member_first_name: profile?.first_name ?? '',
    member_last_name: profile?.last_name ?? '',
    member_role: role?.name ?? '',
    member_department: dept?.name ?? '',
    member_department_color: dept?.color ?? '',
  };
}

const TASK_SELECT = `
  id, title, description, status, priority, frequency, due_date,
  assigned_to, assigned_role_id, assigned_department,
  task_type_id, room_id, equipment_id, supply_category_id,
  task_types(name),
  rooms(name),
  equipment(name),
  supply_categories(name),
  departments(name, color),
  practice_members(
    id,
    profiles(first_name, last_name),
    practice_role_types(name, departments(name, color))
  )
`;

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

  // Build query based on view mode:
  // - pool=false (default): individually assigned tasks for the selected date
  // - pool=true: unassigned pool tasks (opening/closing office, shared checklists)
  let query = admin
    .from('tasks')
    .select(TASK_SELECT)
    .eq('practice_id', practiceId);

  if (pool) {
    // Pool tasks: unassigned tasks that are active for this date.
    // Includes: exact date match, overdue, recurring daily/per_shift (with due_date <= today OR null due_date),
    // and any not_started tasks with no due_date (e.g. newly created pool tasks).
    query = query
      .is('assigned_to', null)
      .or(`due_date.eq.${dateValue},status.eq.overdue,and(frequency.in.(daily,per_shift),due_date.lte.${dateValue},status.neq.completed,status.neq.skipped),and(frequency.in.(daily,per_shift),due_date.is.null,status.neq.completed,status.neq.skipped)`)
      .order('status', { ascending: true })
      .order('created_at', { ascending: true });
  } else {
    // Assigned tasks: individually assigned, for the selected date
    query = query
      .not('assigned_to', 'is', null)
      .or(`due_date.eq.${dateValue},status.eq.overdue,and(frequency.in.(daily,per_shift),due_date.lte.${dateValue},status.neq.completed,status.neq.skipped)`)
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: true });
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Deduplicate — a task may match multiple OR conditions
  const seen = new Set<string>();
  const unique = (data ?? []).filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  const flatTasks = unique.map(flattenTask);

  // Fetch checklist progress counts for all tasks in one query
  const taskIds = flatTasks.map((t) => t.id);
  if (taskIds.length > 0) {
    const { data: checklistCounts } = await admin
      .from('task_checklist_items')
      .select('task_id, is_completed')
      .in('task_id', taskIds);

    if (checklistCounts) {
      const countMap = new Map<string, { total: number; completed: number }>();
      for (const item of checklistCounts) {
        const entry = countMap.get(item.task_id) ?? { total: 0, completed: 0 };
        entry.total++;
        if (item.is_completed) entry.completed++;
        countMap.set(item.task_id, entry);
      }
      for (const task of flatTasks) {
        const counts = countMap.get(task.id);
        (task as Record<string, unknown>).checklist_total = counts?.total ?? 0;
        (task as Record<string, unknown>).checklist_completed = counts?.completed ?? 0;
      }
    }
  }

  return NextResponse.json(flatTasks);
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
