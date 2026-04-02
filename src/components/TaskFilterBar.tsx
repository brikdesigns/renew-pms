'use client';

import { useState, type CSSProperties } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Chip } from '@bds/components';
import { Menu } from '@bds/components';
import type { MenuItemData } from '@bds/components';
import { color, font, space, gap, border } from '@/lib/tokens';

// ─── Filter options (match schema enums + seed defaults) ─────────────────────

const DEPARTMENTS = [
  'All Departments',
  'Clinical',
  'Front Desk',
  'Engineering',
  'HR',
  'Administration',
  'Sterilization',
] as const;

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
  'Request',
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────

interface TaskFilterBarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
  selectedFrequency: string;
  onFrequencyChange: (freq: string) => void;
  selectedPriority: string;
  onPriorityChange: (priority: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedTemplate: string;
  onTemplateChange: (template: string) => void;
  templates: string[];
  showResolved: boolean;
  onShowResolvedChange: (show: boolean) => void;
  showOverdue: boolean;
  onShowOverdueChange: (show: boolean) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function shiftDate(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const barStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${space.md} 0`,
  minHeight: 0,
};

const chipGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
};

const datePickerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.lg,
};

const iconButtonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: border.radius.pill,
  backgroundColor: color.background.accent,
  border: 'none',
  cursor: 'pointer',
  color: color.text.primary,
  fontSize: font.size.icon.lg,
};

const dateLabelStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.lg,
  fontWeight: font.weight.bold,
  color: color.text.primary,
  whiteSpace: 'nowrap',
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
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
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
  selectedDate,
  onDateChange,
  selectedDepartment,
  onDepartmentChange,
  selectedFrequency,
  onFrequencyChange,
  selectedPriority,
  onPriorityChange,
  selectedType,
  onTypeChange,
  selectedTemplate,
  onTemplateChange,
  templates,
  showResolved,
  onShowResolvedChange,
  showOverdue,
  onShowOverdueChange,
}: TaskFilterBarProps) {
  const handlePrev = () => onDateChange(shiftDate(selectedDate, -1));
  const handleNext = () => onDateChange(shiftDate(selectedDate, 1));

  return (
    <div style={barStyle}>
      {/* Date navigation */}
      <div style={datePickerStyle}>
        <button
          type="button"
          style={iconButtonStyle}
          onClick={handlePrev}
          aria-label="Previous day"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <span style={dateLabelStyle}>{formatDate(selectedDate)}</span>
        <button
          type="button"
          style={iconButtonStyle}
          onClick={handleNext}
          aria-label="Next day"
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>

      {/* Filter chips */}
      <div style={chipGroupStyle}>
        <ChipFilter
          label="Type"
          options={TEMPLATE_TYPES}
          selected={selectedType}
          onChange={onTypeChange}
        />
        <ChipFilter
          label="Department"
          options={DEPARTMENTS}
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
        <ChipFilter
          label="Template"
          options={['All Templates', ...templates]}
          selected={selectedTemplate}
          onChange={onTemplateChange}
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
    </div>
  );
}
