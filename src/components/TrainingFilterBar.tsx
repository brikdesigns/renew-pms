'use client';

import { useState, useMemo, type CSSProperties } from 'react';
import { Chip } from '@bds/components';
import { Menu } from '@bds/components';
import type { MenuItemData } from '@bds/components';
import { gap } from '@/lib/tokens';
import { useDepartments } from '@/hooks/useDepartments';

// ─── Types ───────────────────────────────────────────────────────────────────

export type EmployeeTypeFilter = 'new' | 'maturing' | 'proficient';

interface TrainingFilterBarProps {
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
  activeTypes: Set<EmployeeTypeFilter>;
  onToggleType: (type: EmployeeTypeFilter) => void;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const barStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: gap.md,
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
  activeTypes,
  onToggleType,
}: TrainingFilterBarProps) {
  const { departments } = useDepartments();
  const departmentOptions = useMemo(
    () => ['All Departments', ...departments.filter((d) => d.is_active).map((d) => d.name)],
    [departments]
  );

  return (
    <div style={barStyle}>
      <Chip
        label="New Hire"
        variant={activeTypes.has('new') ? 'primary' : 'secondary'}
        appearance={activeTypes.has('new') ? 'solid' : 'light'}
        onChipClick={() => onToggleType('new')}
      />
      <Chip
        label="Maturing"
        variant={activeTypes.has('maturing') ? 'primary' : 'secondary'}
        appearance={activeTypes.has('maturing') ? 'solid' : 'light'}
        onChipClick={() => onToggleType('maturing')}
      />
      <Chip
        label="Proficient"
        variant={activeTypes.has('proficient') ? 'primary' : 'secondary'}
        appearance={activeTypes.has('proficient') ? 'solid' : 'light'}
        onChipClick={() => onToggleType('proficient')}
      />
      <ChipFilter
        options={departmentOptions}
        selected={selectedDepartment}
        onChange={onDepartmentChange}
      />
    </div>
  );
}
