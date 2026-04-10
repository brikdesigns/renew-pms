import type { SupabaseClient } from '@supabase/supabase-js';
import { SECONDARY_DEPTS } from '@/lib/secondary-departments';

type DeptRow = { id: string; name: string };

/**
 * Computes member counts per department, including secondary department
 * assignments for roles that span multiple departments.
 * Returns a map of department id → member count.
 */
export async function getDeptMemberCounts(
  supabase: SupabaseClient,
  practiceId: string,
  departments: DeptRow[],
): Promise<Record<string, number>> {
  const { data: memberRoles } = await supabase
    .from('practice_members')
    .select('practice_role_types!inner(name, department_id)')
    .eq('practice_id', practiceId);

  const deptNameToId = new Map(departments.map((d) => [d.name, d.id]));

  const counts: Record<string, number> = {};
  for (const m of memberRoles ?? []) {
    const roleRaw = m.practice_role_types as
      | { name: string; department_id: string }
      | { name: string; department_id: string }[]
      | null;
    const role = Array.isArray(roleRaw) ? (roleRaw[0] ?? null) : roleRaw;
    if (!role) continue;

    if (role.department_id) {
      counts[role.department_id] = (counts[role.department_id] ?? 0) + 1;
    }

    const extras = SECONDARY_DEPTS[role.name];
    if (extras) {
      for (const deptName of extras) {
        const deptId = deptNameToId.get(deptName);
        if (deptId) counts[deptId] = (counts[deptId] ?? 0) + 1;
      }
    }
  }

  return counts;
}
