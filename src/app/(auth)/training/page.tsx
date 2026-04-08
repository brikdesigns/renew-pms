'use client';

import { useState, useCallback, useMemo } from 'react';
import { TrainingCard, type TrainingMember } from '@/components/TrainingCard';
import { TrainingFilterBar, type EmployeeTypeFilter } from '@/components/TrainingFilterBar';
import { useMembers } from '@/hooks/useMembers';
import { color, font, space, gap, border } from '@/lib/tokens';

// ─── Styles ──────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.lg,
};

// Matches DepartmentsTable subHeaderStyle
const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${space.md} 0`,
};

const headerLeftStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: space.sm,
};

const titleStyle: React.CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.md,
  fontWeight: font.weight.semibold,
  color: color.text.primary,
  margin: 0,
};

const countBadgeStyle: React.CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.body.xs,
  fontWeight: font.weight.medium,
  color: color.text.secondary,
  backgroundColor: color.surface.secondary,
  padding: `2px ${gap.md}`,
  borderRadius: border.radius.sm,
};

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.md,
  paddingBottom: space.lg,
};

const emptyStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: color.text.muted,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function TrainingPage() {
  const { members, loading } = useMembers();
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [activeTypes, setActiveTypes] = useState<Set<EmployeeTypeFilter>>(new Set());

  const toggleType = useCallback((type: EmployeeTypeFilter) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const trainingMembers = useMemo((): TrainingMember[] =>
    members
      .filter((m) => m.is_active)
      .map((m) => ({
        id:               m.id,
        name:             `${m.first_name} ${m.last_name}`.trim(),
        role:             m.practice_role,
        department:       m.department,
        departmentColor:  m.department_color,
        employeeType:     (m.employee_type as EmployeeTypeFilter) ?? 'proficient',
        progress:         0,
        totalModules:     0,
        completedModules: 0,
        hasTrainingDue:   false,
      })),
    [members],
  );

  const filtered = trainingMembers
    .filter((m) => {
      if (activeTypes.size > 0 && !activeTypes.has(m.employeeType)) return false;
      if (selectedDepartment !== 'All Departments' && m.department !== selectedDepartment) return false;
      return true;
    })
    .sort((a, b) => {
      const order = { new: 0, maturing: 1, proficient: 2 };
      const diff = order[a.employeeType] - order[b.employeeType];
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });

  const isEmpty = !loading && filtered.length === 0;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div style={headerLeftStyle}>
          <h3 style={titleStyle}>Team Members</h3>
          <span style={countBadgeStyle}>{loading ? '–' : filtered.length}</span>
        </div>
        <TrainingFilterBar
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          activeTypes={activeTypes}
          onToggleType={toggleType}
        />
      </div>
      <div style={listStyle}>
        {filtered.map((member) => (
          <TrainingCard key={member.id} member={member} />
        ))}
        {isEmpty && (
          <div style={emptyStyle}>
            {members.length === 0
              ? 'No team members have been added yet.'
              : 'No team members match the current filters.'}
          </div>
        )}
      </div>
    </div>
  );
}
