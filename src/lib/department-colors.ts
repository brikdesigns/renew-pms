import { departmentColor, type DepartmentColorKey } from './tokens';

/**
 * Department color assignments.
 *
 * The `departments` table stores a color key string (e.g. "blue", "green")
 * in the `color` column. This map resolves department names to color keys.
 *
 * When departments become DB-driven, this becomes a simple lookup
 * on the stored color key rather than a name-based map.
 */
export const DEPARTMENT_COLOR_MAP: Record<string, DepartmentColorKey> = {
  'Clinical':         'blue',
  'Front Desk':       'green',
  'Engineering':      'purple',
  'HR':               'pink',
  'Administration':   'gold',
  'Sterilization':    'red',
  'All Departments':  'teal',
};

/** Given a department name, return { base, light, text } token set */
export function getDepartmentColors(deptName: string) {
  const key = DEPARTMENT_COLOR_MAP[deptName] ?? 'blue';
  return departmentColor(key);
}
