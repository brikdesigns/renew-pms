'use client';

import type { CSSProperties } from 'react';
import { Button } from '@brikdesigns/bds';
import { font, gap, border } from '@/lib/tokens';

// Canonical day codes match the practice_members.office_days CHECK constraint
// (see migration 00043). Order is Sunday-first per the design reference.
const DAYS = [
  { code: 'sun', label: 'S', name: 'Sunday' },
  { code: 'mon', label: 'M', name: 'Monday' },
  { code: 'tue', label: 'T', name: 'Tuesday' },
  { code: 'wed', label: 'W', name: 'Wednesday' },
  { code: 'thu', label: 'T', name: 'Thursday' },
  { code: 'fri', label: 'F', name: 'Friday' },
  { code: 'sat', label: 'S', name: 'Saturday' },
] as const;

const containerStyle: CSSProperties = {
  display: 'flex',
  gap: gap.sm,
  alignItems: 'center',
};

const buttonStyle: CSSProperties = {
  width: 32,
  height: 32,
  minWidth: 32,
  padding: 0,
  borderRadius: border.radius.circle,
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: font.weight.semibold,
};

interface DaysOfWeekPickerProps {
  /** Selected day codes (`sun`..`sat`). Order in the array is not significant. */
  value: string[];
  /** Called with the new array on toggle. Omit (or pass `readOnly`) to render a non-interactive view. */
  onChange?: (value: string[]) => void;
  /** Render only the selected days as filled chips; unselected days are hidden.
   *  Used for read-mode displays. The "show unselected as muted" treatment is
   *  deferred until the design system has a muted active/inactive token —
   *  see the BDS promotion memory note. */
  readOnly?: boolean;
}

// Local component — flagged for BDS promotion. The pattern is novel (no
// equivalent in @brikdesigns/bds at time of writing) and is a likely-reusable
// chip-toggle group, but the BDS-side abstraction belongs in its own session.
export function DaysOfWeekPicker({ value, onChange, readOnly = false }: DaysOfWeekPickerProps) {
  const handleToggle = (code: string) => {
    if (readOnly || !onChange) return;
    if (value.includes(code)) {
      onChange(value.filter((d) => d !== code));
    } else {
      onChange([...value, code]);
    }
  };

  // In read-mode, render only the selected days as filled chips (in canonical
  // Sun→Sat order, regardless of the input array's order).
  const visibleDays = readOnly
    ? DAYS.filter((d) => value.includes(d.code))
    : DAYS;

  return (
    <div style={containerStyle} role="group" aria-label="Days in office">
      {visibleDays.map((day) => {
        const isSelected = value.includes(day.code);
        return (
          <Button
            key={day.code}
            variant={isSelected ? 'primary' : 'secondary'}
            size="sm"
            type="button"
            onClick={() => handleToggle(day.code)}
            disabled={readOnly}
            aria-label={day.name}
            aria-pressed={isSelected}
            style={buttonStyle}
          >
            {day.label}
          </Button>
        );
      })}
    </div>
  );
}
