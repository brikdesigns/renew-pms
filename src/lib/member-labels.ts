/**
 * Shared label/tag lookups for member-related UI.
 *
 * These constants were duplicated across 6+ files. Single source here,
 * import everywhere.
 */

import { color } from '@/lib/tokens';

// ─── Employee type → Tag appearance ─────────────────────────────────────────

export const EMPLOYEE_TYPE_TAG: Record<string, { bg: string; color: string; label: string }> = {
  new:        { bg: color.department.blue.base,  color: color.text.inverse, label: 'New Hire' },
  maturing:   { bg: color.department.gold.base,  color: color.text.inverse, label: 'Maturing' },
  proficient: { bg: color.department.green.base, color: color.text.inverse, label: 'Proficient' },
};

// ─── Shift DB value → display label ─────────────────────────────────────────

export const SHIFT_LABELS: Record<string, string> = {
  opening:  'Opening',
  closing:  'Closing',
  evening:  'Evening',
  full_day: 'Full Day',
};

// ─── System role → display label ─────────────────────────────────────────────

export const SYSTEM_ROLE_LABELS: Record<string, string> = {
  brik_admin: 'Platform Admin',
  admin:      'Practice Admin',
  manager:    'Manager',
  staff:      'Staff',
};
