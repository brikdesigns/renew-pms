/**
 * Roles that span secondary departments beyond their primary FK assignment.
 * Single source of truth — used by department member counts (API) and
 * department/role filtering (UI).
 */
export const SECONDARY_DEPTS: Record<string, string[]> = {
  'Office Manager':        ['IT (Information Technology)', 'Marketing', 'Finance', 'Facilities'],
  'Clinical Manager':      ['(M) Management'],
  'Insurance Coordinator': ['Finance'],
  'Third Party':           ['Finance', 'Marketing', 'Facilities'],
};
