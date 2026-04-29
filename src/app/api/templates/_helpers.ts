import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Force-null any assignment FKs that don't apply to the chosen mode. Keeps
 * task_templates rows consistent at the DB layer regardless of UI state —
 * the AssignmentPicker clears non-mode FKs at mode-switch time, but stale
 * values can still leak through if the user only changes the assignee within
 * a mode (the picker spreads value through unchanged).
 *
 * `assignment_mode = undefined` means the caller isn't touching mode in this
 * request — leave the FKs alone (the existing row's invariant holds).
 */
export interface AssignmentFKs {
  assigned_member_id: string | null;
  assigned_role_id: string | null;
  department_id: string | null;
}

export function normalizeAssignmentFKs(
  mode: string | undefined,
  fks: { assigned_member_id?: string | null; assigned_role_id?: string | null; department_id?: string | null },
): Partial<AssignmentFKs> {
  if (mode === undefined) return {};

  const memberId = fks.assigned_member_id || null;
  const roleId = fks.assigned_role_id || null;
  const deptId = fks.department_id || null;

  switch (mode) {
    case 'individual':
      return { assigned_member_id: memberId, assigned_role_id: null, department_id: null };
    case 'role':
      return { assigned_member_id: null, assigned_role_id: roleId, department_id: null };
    case 'department':
      return { assigned_member_id: null, assigned_role_id: null, department_id: deptId };
    case 'pool':
    default:
      return { assigned_member_id: null, assigned_role_id: null, department_id: null };
  }
}

interface SpawnTemplate {
  status: string | null;
  frequency: string | null;
  assignment_mode: string | null;
  assigned_member_id: string | null;
  assigned_role_id: string | null;
  department_id: string | null;
}

/**
 * Mirrors the gate in generate_daily_tasks(): a template only spawns today's
 * task if it's active, recurs daily/per-shift, and has the FK that matches its
 * mode populated. Pool always qualifies once active+recurring.
 *
 * Centralized so we don't drift from the SQL-level predicate.
 */
export function templateShouldSpawnToday(t: SpawnTemplate): boolean {
  if (t.status !== 'active') return false;
  if (t.frequency !== 'daily' && t.frequency !== 'per_shift') return false;
  switch (t.assignment_mode) {
    case 'pool':       return true;
    case 'individual': return t.assigned_member_id !== null;
    case 'role':       return t.assigned_role_id   !== null;
    case 'department': return t.department_id      !== null;
    default:           return false;
  }
}

/**
 * Fire-and-forget today's-task spawn for a template the admin just saved.
 * The DB function is idempotent (checks for existing tasks for `template_id`
 * + today's date), so re-calling on save is safe — no risk of double-spawn.
 *
 * Returns the RPC error so callers can surface it on the save response. We
 * don't fail the save itself: the template row is already persisted, and a
 * generator failure should be diagnostic noise, not a "your save didn't work."
 */
export async function spawnTodayForTemplate(
  admin: SupabaseClient,
  practiceId: string,
  template: SpawnTemplate,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!templateShouldSpawnToday(template)) return { ok: true };

  const { error } = await admin.rpc('generate_daily_tasks', { p_practice_id: practiceId });
  if (error) {
    console.error('[templates] spawnTodayForTemplate failed:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
