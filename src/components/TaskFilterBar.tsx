'use client';

import { useState, useMemo, type CSSProperties } from 'react';
import { Chip } from '@brikdesigns/bds';
import { Menu } from '@brikdesigns/bds';
import type { MenuItemData } from '@brikdesigns/bds';
import { color, gap } from '@/lib/tokens';
import { useDepartments } from '@/hooks/useDepartments';

const FREQUENCIES = [
  'All Frequencies',
  'Daily',
  'Weekly',
  'Bi-Weekly',
  'Monthly',
  'Quarterly',
  'Annually',
  'Per Shift',
] as const;

const PRIORITIES = [
  'All Priorities',
  'Critical',
  'High',
  'Medium',
  'Low',
] as const;

const TEMPLATE_TYPES = [
  'All Types',
  'Checklist',
  'Procedure',
  'Compliance',
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────

interface TaskFilterBarProps {
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
  selectedFrequency: string;
  onFrequencyChange: (freq: string) => void;
  selectedPriority: string;
  onPriorityChange: (priority: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  showResolved: boolean;
  onShowResolvedChange: (show: boolean) => void;
  showOverdue: boolean;
  onShowOverdueChange: (show: boolean) => void;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const chipGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
  flexWrap: 'wrap',
  padding: `0 0`,
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

// ─── ChipFilter (reusable chip + menu combo) ────────────────────────────────

function ChipFilter({
  options,
  selected,
  onChange,
}: {
  label?: string;
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

export function TaskFilterBar({
  selectedDepartment,
  onDepartmentChange,
  selectedFrequency,
  onFrequencyChange,
  selectedPriority,
  onPriorityChange,
  selectedType,
  onTypeChange,
  showResolved,
  onShowResolvedChange,
  showOverdue,
  onShowOverdueChange,
}: TaskFilterBarProps) {
  const { departments } = useDepartments();
  const departmentOptions = useMemo(
    () => ['All Departments', ...departments.filter((d) => d.is_active && d.name !== 'All Departments').map((d) => d.name)],
    [departments]
  );

  return (
    <div style={chipGroupStyle}>
      <ChipFilter
        label="Type"
        options={TEMPLATE_TYPES}
        selected={selectedType}
        onChange={onTypeChange}
      />
      <ChipFilter
        label="Department"
        options={departmentOptions}
        selected={selectedDepartment}
        onChange={onDepartmentChange}
      />
      <ChipFilter
        label="Frequency"
        options={FREQUENCIES}
        selected={selectedFrequency}
        onChange={onFrequencyChange}
      />
      <ChipFilter
        label="Priority"
        options={PRIORITIES}
        selected={selectedPriority}
        onChange={onPriorityChange}
      />
      <Chip
        label="Show Overdue"
        variant={showOverdue ? 'primary' : 'secondary'}
        appearance={showOverdue ? 'solid' : 'light'}
        onChipClick={() => onShowOverdueChange(!showOverdue)}
      />
      <Chip
        label="Show Resolved"
        variant={showResolved ? 'primary' : 'secondary'}
        appearance={showResolved ? 'solid' : 'light'}
        onChipClick={() => onShowResolvedChange(!showResolved)}
      />
    </div>
  );
}
