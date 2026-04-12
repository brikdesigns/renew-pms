'use client';

import { useState, useMemo, type CSSProperties } from 'react';
import { Chip, SegmentedControl } from '@bds/components';
import { Menu } from '@bds/components';
import type { MenuItemData } from '@bds/components';
import { gap, space, font, color, border } from '@/lib/tokens';
import { useDepartments } from '@/hooks/useDepartments';

// ─── Types ───────────────────────────────────────────────────────────────────

export type EmployeeTypeFilter = 'new' | 'maturing' | 'proficient';
export type EmployeeTypeSegment = 'all' | EmployeeTypeFilter;

const MATURITY_SEGMENTS = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Maturing', value: 'maturing' },
  { label: 'Proficient', value: 'proficient' },
];

interface TrainingFilterBarProps {
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
  activeSegment: EmployeeTypeSegment;
  onSegmentChange: (segment: EmployeeTypeSegment) => void;
  count: number | string;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const barStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${space.sm} 0`,
  gap: gap.md,
};

const barLeftStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: space.sm,
};

const countBadgeStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.body.xs,
  fontWeight: font.weight.medium,
  color: color.text.secondary,
  backgroundColor: color.surface.secondary,
  padding: `2px ${gap.md}`,
  borderRadius: border.radius.sm,
};

const chipWrapperStyle: CSSProperties = {
  position: 'relative',
};

const menuStyle: CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  marginTop: 4,
  minWidth: 180,
  zIndex: 100,
};

// ─── ChipFilter ──────────────────────────────────────────────────────────────

function ChipFilter({
  options,
  selected,
  onChange,
}: {
  options: readonly string[];
  selected: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const items: MenuItemData[] = options.map((opt) => ({
    id: opt,
    label: opt,
    onClick: () => {
      onChange(opt);
      setOpen(false);
    },
  }));

  const isFiltered = selected !== options[0];

  return (
    <div style={chipWrapperStyle}>
      <Chip
        label={selected}
        variant={isFiltered ? 'primary' : 'secondary'}
        appearance={isFiltered ? 'solid' : 'light'}
        showDropdown
        onChipClick={() => setOpen((prev) => !prev)}
      />
      <Menu
        items={items}
        isOpen={open}
        onClose={() => setOpen(false)}
        activeId={selected}
        style={menuStyle}
      />
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TrainingFilterBar({
  selectedDepartment,
  onDepartmentChange,
  activeSegment,
  onSegmentChange,
  count,
}: TrainingFilterBarProps) {
  const { departments } = useDepartments();
  const departmentOptions = useMemo(
    () => ['All Departments', ...departments.filter((d) => d.is_active).map((d) => d.name)],
    [departments]
  );

  return (
    <div style={barStyle}>
      <div style={barLeftStyle}>
        <SegmentedControl
          items={MATURITY_SEGMENTS}
          value={activeSegment}
          onChange={(val) => onSegmentChange(val as EmployeeTypeSegment)}
          size="sm"
        />
        <span style={countBadgeStyle}>{count}</span>
      </div>
      <ChipFilter
        options={departmentOptions}
        selected={selectedDepartment}
        onChange={onDepartmentChange}
      />
    </div>
  );
}
