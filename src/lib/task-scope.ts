import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthUser } from '@/lib/auth';

/**
 * Visibility scope for tasks, derived from the caller's system_role.
 *
 *  - `all`        → admin / brik_admin: see every task in the practice
 *  - `department` → manager: see tasks tied to their department via any of
 *                   `assigned_department`, `assigned_to ∈ memberIds`, or
 *                   `assigned_role_id ∈ roleIds`
 *  - `member`     → staff: see only `assigned_to = memberId`
 *
 * Pool tasks (assigned_to IS NULL) follow the same scope, except staff can
 * see all pool tasks regardless of department — see `applyPoolScope`.
 */
export type TaskScope =
  | { kind: 'all' }
  | { kind: 'department'; departmentId: string; memberIds: string[]; roleIds: string[] }
  | { kind: 'member'; memberId: string };

/**
 * Resolve the caller's task visibility scope. Uses the admin client because the
 * lookups (practice_role_types, practice_members) live behind RLS that we'd
 * otherwise have to permit reading from in a wider blast radius.
 */
export async function resolveTaskScope(
  admin: SupabaseClient,
  authUser: AuthUser,
  practiceId: string,
): Promise<TaskScope> {
  const role = authUser.profile.system_role;
  if (role === 'brik_admin' || role === 'admin') return { kind: 'all' };

  const memberId = authUser.membership?.memberId;
  if (!memberId) {
    // No membership yet — fail closed. An empty memberId filter returns no rows.
    return { kind: 'member', memberId: '' };
  }

  if (role === 'staff') return { kind: 'member', memberId };

  // role === 'manager' — expand to their full department
  const { data: memberRow, error: memberErr } = await admin
    .from('practice_members')
    .select('practice_role_types(department_id)')
    .eq('id', memberId)
    .maybeSingle();
  if (memberErr) {
    console.error('[resolveTaskScope] member lookup failed:', memberErr.message);
    throw memberErr;
  }

  const roleType = Array.isArray(memberRow?.practice_role_types)
    ? memberRow?.practice_role_types[0]
    : memberRow?.practice_role_types;
  const departmentId = (roleType as { department_id: string | null } | null)?.department_id ?? null;

  if (!departmentId) {
    // Manager with no department on their role — only see their own work.
    console.warn('[resolveTaskScope] manager has no department; scoping to self', { memberId });
    return { kind: 'member', memberId };
  }

  const { data: rolesInDept, error: rolesErr } = await admin
    .from('practice_role_types')
    .select('id')
    .eq('practice_id', practiceId)
    .eq('department_id', departmentId);
  if (rolesErr) {
    console.error('[resolveTaskScope] role lookup failed:', rolesErr.message);
    throw rolesErr;
  }
  const roleIds = (rolesInDept ?? []).map((r) => r.id as string);

  let memberIds: string[] = [];
  if (roleIds.length > 0) {
    const { data: membersInDept, error: membersErr } = await admin
      .from('practice_members')
      .select('id')
      .eq('practice_id', practiceId)
      .eq('is_active', true)
      .in('practice_role_id', roleIds);
    if (membersErr) {
      console.error('[resolveTaskScope] members lookup failed:', membersErr.message);
      throw membersErr;
    }
    memberIds = (membersInDept ?? []).map((m) => m.id as string);
  }

  return { kind: 'department', departmentId, memberIds, roleIds };
}

/**
 * Build the .or() clause body for assigned (non-pool) tasks under this scope.
 * Returns null when no scoping is needed (admin) — caller should skip the .or().
 * Returns an empty string when the scope is unsatisfiable; caller should treat
 * that as "no rows" rather than apply an empty filter.
 */
export function buildAssignedScopeOr(scope: TaskScope): string | null {
  if (scope.kind === 'all') return null;
  if (scope.kind === 'member') {
    // Single equality — caller can use .eq instead, but we expose it as an OR
    // so the same code path applies for member and department scopes.
    return `assigned_to.eq.${scope.memberId}`;
  }
  // department
  const parts: string[] = [`assigned_department.eq.${scope.departmentId}`];
  if (scope.memberIds.length > 0) parts.push(`assigned_to.in.(${scope.memberIds.join(',')})`);
  if (scope.roleIds.length > 0) parts.push(`assigned_role_id.in.(${scope.roleIds.join(',')})`);
  return parts.join(',');
}

/**
 * Build the .or() clause body for pool (unassigned) tasks under this scope.
 *
 *  - admin   → null (sees all pool tasks)
 *  - staff   → null (universal pool — every staff member can pick up any
 *              shared work, regardless of department)
 *  - manager → universal pool (no dept tag) + their department's pool (tagged
 *              with dept or with a role in their dept). Other depts' tagged
 *              pool tasks are excluded.
 *
 * Today's seed data has 0 pool tasks tagged with a dept, so manager output
 * matches universal-pool behavior. Once authoring flows start tagging pool
 * tasks, the dept clauses kick in automatically — no further code changes.
 */
export function buildPoolScopeOr(scope: TaskScope): string | null {
  if (scope.kind === 'all' || scope.kind === 'member') return null;
  // department
  const parts: string[] = [
    `assigned_department.is.null`,
    `assigned_department.eq.${scope.departmentId}`,
  ];
  if (scope.roleIds.length > 0) parts.push(`assigned_role_id.in.(${scope.roleIds.join(',')})`);
  return parts.join(',');
}

/**
 * Build the .or() clause body for any task the caller can see (assigned OR pool).
 * Used by views like the dashboard that mix both kinds (overdue, today's progress).
 *
 *  - admin   → null (no filter)
 *  - staff   → own assigned tasks + all pool tasks
 *  - manager → tasks tied to their department by any of dept/member/role
 */
export function buildVisibilityOr(scope: TaskScope): string | null {
  if (scope.kind === 'all') return null;
  if (scope.kind === 'member') {
    return `assigned_to.eq.${scope.memberId},assigned_to.is.null`;
  }
  // department — own dept's tasks (any of the 3 ways) + universal pool (no
  // dept tag). Other depts' tagged pool tasks are excluded.
  const parts: string[] = [
    `assigned_department.eq.${scope.departmentId}`,
    `and(assigned_to.is.null,assigned_department.is.null)`,
  ];
  if (scope.memberIds.length > 0) parts.push(`assigned_to.in.(${scope.memberIds.join(',')})`);
  if (scope.roleIds.length > 0) parts.push(`assigned_role_id.in.(${scope.roleIds.join(',')})`);
  return parts.join(',');
}

/**
 * Predicate for single-task authorization. Returns true if the caller's scope
 * permits read/update of this task. `assigned_*` fields are pulled from the
 * task row — caller must select them.
 */
export function taskInScope(
  scope: TaskScope,
  task: {
    assigned_to: string | null;
    assigned_department: string | null;
    assigned_role_id: string | null;
  },
): boolean {
  if (scope.kind === 'all') return true;

  if (scope.kind === 'member') {
    // Staff: own assigned + any pool task (universal pool).
    if (task.assigned_to === null) return true;
    return task.assigned_to === scope.memberId;
  }

  // department — manager
  if (task.assigned_department === scope.departmentId) return true;
  if (task.assigned_to && scope.memberIds.includes(task.assigned_to)) return true;
  if (task.assigned_role_id && scope.roleIds.includes(task.assigned_role_id)) return true;
  // Universal pool — pool task with no dept/role tag at all.
  if (
    task.assigned_to === null &&
    task.assigned_department === null &&
    task.assigned_role_id === null
  ) return true;
  return false;
}
