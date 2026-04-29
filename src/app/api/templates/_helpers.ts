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
