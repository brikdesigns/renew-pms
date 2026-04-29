'use client';

import { type CSSProperties } from 'react';
import { Select } from '@brikdesigns/bds';
import { gap } from '@/lib/tokens';
import type { Member } from '@/hooks/useMembers';
import type { Role } from '@/hooks/useRoles';
import type { Department } from '@/hooks/useDepartments';

export type AssignmentMode = 'individual' | 'role' | 'department' | 'pool';

export interface AssignmentValue {
  mode: AssignmentMode;
  /** practice_members.id of the assignee. Mirrors tasks.assigned_to so the
   *  generator can copy this directly onto spawned tasks without translation. */
  memberId: string;
  roleId: string;
  departmentId: string;
}

interface AssignmentPickerProps {
  value: AssignmentValue;
  onChange: (next: AssignmentValue) => void;
  members: Member[];
  roles: Role[];
  departments: Department[];
}

const MODE_OPTIONS: { label: string; value: AssignmentMode }[] = [
  { label: 'Individual (specific person)', value: 'individual' },
  { label: 'Role (anyone in role)',         value: 'role' },
  { label: 'Department (anyone in dept)',   value: 'department' },
  { label: 'Pool (everyone)',               value: 'pool' },
];

const rowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.lg,
  width: '100%',
};

function memberDisplayName(m: Member): string {
  return `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim();
}

/**
 * Build labels for a member list, appending the email parenthetically only
 * when two or more active members share the same display name. Keeps the
 * common case clean ("Jessica Torres") and disambiguates duplicates
 * ("Jessica Torres (nick+manager@brikdesigns.com)") without the picker
 * silently steering the admin to the wrong record.
 *
 * Surfaced 2026-04-29: two seeded test users with the persona "Jessica
 * Torres" appeared as identical options; the admin picked one but the
 * spawned task ended up assigned to the other Jessica's member_id, hidden
 * from the admin's My Tasks board.
 */
export function buildMemberOptions(members: Member[]): { label: string; value: string }[] {
  const active = members.filter((m) => m.is_active);
  const nameCounts = new Map<string, number>();
  for (const m of active) {
    const name = memberDisplayName(m);
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
  }

  return active.map((m) => {
    const name = memberDisplayName(m);
    const fallback = name || m.email || 'Unnamed member';
    const isDuplicate = name !== '' && (nameCounts.get(name) ?? 0) > 1;
    const label = isDuplicate && m.email ? `${name} (${m.email})` : fallback;
    return { label, value: m.id };
  });
}

/**
 * AssignmentPicker — encapsulates the mode-conditional assignment UI for a
 * task template. The picker owns the rule that switching modes clears
 * non-applicable IDs, so callers only consume `value` and don't need to
 * track which fields are "live" for a given mode.
 *
 * Designed to extend to per-item assignment without API changes: the same
 * value shape applies to checklist_items once that lands.
 */
export function AssignmentPicker({
  value,
  onChange,
  members,
  roles,
  departments,
}: AssignmentPickerProps) {
  const setMode = (mode: AssignmentMode) => {
    // Clear any IDs that don't apply to the new mode so the saved row reflects
    // user intent (no orphan FKs from a prior mode).
    onChange({
      mode,
      memberId: mode === 'individual' ? value.memberId : '',
      roleId: mode === 'role' ? value.roleId : '',
      departmentId: mode === 'department' ? value.departmentId : '',
    });
  };

  const memberOptions = [
    { label: 'Select person', value: '' },
    ...buildMemberOptions(members),
  ];

  const roleOptions = [
    { label: 'Select role', value: '' },
    ...roles.map((r) => ({ label: r.name, value: r.id })),
  ];

  const departmentOptions = [
    { label: 'Select department', value: '' },
    ...departments.map((d) => ({ label: d.name, value: d.id })),
  ];

  return (
    <div style={rowStyle}>
      <Select
        label="Assignment Mode"
        size="sm"
        options={MODE_OPTIONS}
        value={value.mode}
        onChange={(e) => setMode(e.target.value as AssignmentMode)}
        fullWidth
      />

      {value.mode === 'individual' && (
        <Select
          label="Assigned To"
          size="sm"
          options={memberOptions}
          value={value.memberId}
          onChange={(e) => onChange({ ...value, memberId: e.target.value })}
          fullWidth
        />
      )}

      {value.mode === 'role' && (
        <Select
          label="Assigned Role"
          size="sm"
          options={roleOptions}
          value={value.roleId}
          onChange={(e) => onChange({ ...value, roleId: e.target.value })}
          fullWidth
        />
      )}

      {value.mode === 'department' && (
        <Select
          label="Department"
          size="sm"
          options={departmentOptions}
          value={value.departmentId}
          onChange={(e) => onChange({ ...value, departmentId: e.target.value })}
          fullWidth
        />
      )}
    </div>
  );
}
