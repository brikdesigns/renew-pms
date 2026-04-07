import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

async function getPracticeId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('practice_members')
    .select('practice_id')
    .eq('user_id', userId)
    .limit(1)
    .single();
  return data?.practice_id ?? null;
}

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
  practice_members: MemberJoin | MemberJoin[] | null;
}

function first<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function flattenTask(t: RawTask) {
  const member = first(t.practice_members);
  const profile = member ? first(member.profiles) : null;
  const role = member ? first(member.practice_role_types) : null;
  const dept = role ? first(role.departments) : null;
  const taskType = first(t.task_types);
  const room = first(t.rooms);
  const equipment = first(t.equipment);
  const supplyCategory = first(t.supply_categories);

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

  const practiceId = await getPracticeId(supabase, authUser.profile.id);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  const dateValue = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('practice_id', practiceId)
    .not('assigned_to', 'is', null)
    .or(`due_date.eq.${dateValue},status.eq.overdue`)
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).map(flattenTask));
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

  const practiceId = await getPracticeId(supabase, authUser.profile.id);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const body = await request.json();

  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      practice_id: practiceId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      task_type_id: body.task_type_id || null,
      room_id: body.room_id || null,
      equipment_id: body.equipment_id || null,
      supply_category_id: body.supply_category_id || null,
      assigned_to: body.assigned_to || null,
      assigned_department: body.assigned_department || null,
      status: body.status || 'not_started',
      priority: body.priority || 'medium',
      frequency: body.frequency || null,
      due_date: body.due_date || null,
      created_by: authUser.profile.id,
    })
    .select(TASK_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(flattenTask(data), { status: 201 });
}
