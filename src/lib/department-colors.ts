/**
 * Department color helpers.
 *
 * Color keys ('blue', 'green', etc.) are stored on the `departments.color`
 * DB column — seeded by seed_practice_defaults + migration 00006.
 *
 * PREFERRED USAGE: Read `department.color` from the DB row, pass to departmentColor():
 *
 *   import { departmentColor } from '@/lib/tokens';
 *   const colors = departmentColor(department.color); // { base, light, text }
 *
 * DO NOT add new calls to getDepartmentColors(). It's a name-based fallback for
 * components not yet reading the DB color key. Replace usages by passing
 * department.color (the DB-stored key) to departmentColor() directly.
 */

import { departmentColor } from './tokens';

export { departmentColor };
export type { DepartmentColorKey } from './tokens';

const DEPARTMENT_COLOR_MAP: Record<string, string> = {
  'Clinical':         'blue',
  'Front Desk':       'green',
  'Maintenance':      'purple',
  'HR':               'pink',
  'Administration':   'gold',
  'Sterilization':    'red',
  'All Departments':  'teal',
  'Global':           'teal',
};

/** @deprecated Read department.color from the DB row and call departmentColor(colorKey) directly. */
export function getDepartmentColors(deptName: string) {
  const key = DEPARTMENT_COLOR_MAP[deptName] ?? 'blue';
  return departmentColor(key);
}
