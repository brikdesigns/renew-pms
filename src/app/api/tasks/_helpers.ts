import type { SupabaseClient } from '@supabase/supabase-js';
import { buildAssignedScopeOr, buildPoolScopeOr, type TaskScope } from '@/lib/task-scope';

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
type TaskTemplateJoin = { name: string; display_mode: string };
type RoomJoin = { name: string };
type EquipmentJoin = { name: string };
type SupplyCategoryJoin = { name: string };

export interface RawTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  frequency: string | null;
  due_date: string | null;
  template_id: string | null;
  assigned_to: string;
  assigned_role_id: string | null;
  assigned_department: string | null;
  task_type_id: string | null;
  room_id: string | null;
  equipment_id: string | null;
  supply_category_id: string | null;
  task_types: TaskTypeJoin | TaskTypeJoin[] | null;
  task_templates: TaskTemplateJoin | TaskTemplateJoin[] | null;
  rooms: RoomJoin | RoomJoin[] | null;
  equipment: EquipmentJoin | EquipmentJoin[] | null;
  supply_categories: SupplyCategoryJoin | SupplyCategoryJoin[] | null;
  departments: DepartmentJoin | DepartmentJoin[] | null;
  practice_members: MemberJoin | MemberJoin[] | null;
}

function first<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export function flattenTask(t: RawTask) {
  const member = first(t.practice_members);
  const profile = member ? first(member.profiles) : null;
  const role = member ? first(member.practice_role_types) : null;
  const roleDept = role ? first(role.departments) : null;
  const taskDept = first(t.departments);
  const taskType = first(t.task_types);
  const parentTemplate = first(t.task_templates);
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
    template_id: t.template_id,
    parent_template_name: parentTemplate?.name ?? null,
    display_mode: parentTemplate?.display_mode ?? null,
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

export const TASK_SELECT = `
  id, title, description, status, priority, frequency, due_date, template_id,
  assigned_to, assigned_role_id, assigned_department,
  task_type_id, room_id, equipment_id, supply_category_id,
  task_types(name),
  task_templates(name, display_mode),
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

export type TaskRow = ReturnType<typeof flattenTask> & {
  checklist_total: number;
  checklist_completed: number;
};

/**
 * Loads tasks for a practice + date, scoped to the caller's visibility.
 *
 * - `options.pool = false`           → individually-assigned tasks the caller can see
 * - `options.pool = true`            → unassigned (pool) tasks the caller can pick up
 * - `options.includeResolved = true` → also surface completed/skipped rows that
 *                                      would otherwise drop out the moment they
 *                                      resolve (overdue→completed, recurring-stale→
 *                                      completed). Required for the "Show resolved"
 *                                      toggle to actually expose resolved work, and
 *                                      so a just-completed row stays in view long
 *                                      enough for the optimistic check on the client
 *                                      to reconcile cleanly on refetch.
 *
 * Same logic the GET /api/tasks handler runs; extracted so the page-level
 * server loader can run it in parallel with departments/members without
 * paying the cold-start + auth-prelude cost of a separate API call.
 */
export async function loadTasks(
  admin: SupabaseClient,
  practiceId: string,
  scope: TaskScope,
  dateValue: string,
  options: { pool: boolean; includeResolved?: boolean },
): Promise<TaskRow[]> {
  const includeResolved = options.includeResolved ?? false;

  let query = admin
    .from('tasks')
    .select(TASK_SELECT)
    .eq('practice_id', practiceId);

  // All generator-owned frequencies. `custom` is excluded — no generator supports it.
  const RECURRING_FREQS = 'daily,per_shift,weekly,bi_weekly,monthly,quarterly,semi_annually,annually';

  // Visibility OR — rows that "should be on the board today": due today,
  // currently overdue, or recurring-stale. When includeResolved is on we also
  // accept completed/skipped variants of those shapes (resolved-overdue,
  // resolved-recurring-stale). Today's completed rows already match the
  // unconditional due_date.eq clause.
  const orClauses: string[] = [
    `due_date.eq.${dateValue}`,
    `status.eq.overdue`,
    `and(frequency.in.(${RECURRING_FREQS}),due_date.lte.${dateValue},status.neq.completed,status.neq.skipped)`,
  ];
  if (options.pool) {
    orClauses.push(
      `and(frequency.in.(${RECURRING_FREQS}),due_date.is.null,status.neq.completed,status.neq.skipped)`,
    );
  }
  if (includeResolved) {
    orClauses.push(`and(due_date.lt.${dateValue},status.in.(completed,skipped))`);
    orClauses.push(
      `and(frequency.in.(${RECURRING_FREQS}),due_date.lte.${dateValue},status.in.(completed,skipped))`,
    );
    if (options.pool) {
      orClauses.push(
        `and(frequency.in.(${RECURRING_FREQS}),due_date.is.null,status.in.(completed,skipped))`,
      );
    }
  }
  const visibilityOr = orClauses.join(',');

  if (options.pool) {
    query = query
      .is('assigned_to', null)
      .or(visibilityOr)
      .order('status', { ascending: true })
      .order('created_at', { ascending: true });
    const poolScope = buildPoolScopeOr(scope);
    if (poolScope !== null) query = query.or(poolScope);
  } else {
    query = query
      .not('assigned_to', 'is', null)
      .or(visibilityOr)
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: true });
    const assignedScope = buildAssignedScopeOr(scope);
    if (assignedScope !== null) query = query.or(assignedScope);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Deduplicate — a task may match multiple OR conditions
  const seen = new Set<string>();
  const unique = (data ?? []).filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  const flatTasks = unique.map(flattenTask);

  if (flatTasks.length === 0) {
    return flatTasks.map((t) => ({ ...t, checklist_total: 0, checklist_completed: 0 }));
  }

  // One batched query for all task checklist counts
  const taskIds = flatTasks.map((t) => t.id);
  const { data: checklistCounts, error: checklistErr } = await admin
    .from('task_checklist_items')
    .select('task_id, is_completed')
    .in('task_id', taskIds);
  if (checklistErr) {
    console.warn('[loadTasks] checklist counts unavailable:', checklistErr.message);
  }

  const countMap = new Map<string, { total: number; completed: number }>();
  for (const item of checklistCounts ?? []) {
    const entry = countMap.get(item.task_id) ?? { total: 0, completed: 0 };
    entry.total++;
    if (item.is_completed) entry.completed++;
    countMap.set(item.task_id, entry);
  }

  // Hide spurious expanded-mode parent tasks (#299). A task with an expanded
  // parent template should be one item-as-task, never a parent with copied
  // task_checklist_items. The two known sources are POST /api/tasks
  // ignoring display_mode (now fixed in the same change) and stale rows from
  // a nested → expanded template flip. Direct fetch by id (GET /api/tasks/:id)
  // is unaffected, so deep-links still resolve.
  return flatTasks
    .map((t) => {
      const counts = countMap.get(t.id);
      return {
        ...t,
        checklist_total: counts?.total ?? 0,
        checklist_completed: counts?.completed ?? 0,
      };
    })
    .filter((t) => !(t.display_mode === 'expanded' && t.checklist_total > 0));
}
