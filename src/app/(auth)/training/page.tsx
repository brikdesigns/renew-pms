'use client';

import { useState, useCallback, useMemo } from 'react';
import { TrainingCard, type TrainingMember } from '@/components/TrainingCard';
import { TrainingFilterBar, type EmployeeTypeFilter } from '@/components/TrainingFilterBar';
import { useMembers } from '@/hooks/useMembers';
import { color, font, space, gap } from '@/lib/tokens';

// ─── Styles ──────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.lg,
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
  // All type chips active by default — toggle individual types on/off
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

  // Map Member → TrainingMember.
  // Training progress (totalModules, completedModules) will come from Trainual
  // once that integration is connected. Placeholder 0 values for now.
  const trainingMembers = useMemo((): TrainingMember[] =>
    members
      .filter((m) => m.is_active)
      .map((m) => ({
        id:               m.id,
        name:             `${m.first_name} ${m.last_name}`.trim(),
        role:             m.practice_role,
        department:       m.department,
        departmentColor:  m.department_color,
        employeeType:     (m.employee_type as EmployeeTypeFilter) ?? 'active',
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
    // Sort: new → maturing → active, then alphabetically
    .sort((a, b) => {
      const order = { new: 0, maturing: 1, active: 2 };
      const diff = order[a.employeeType] - order[b.employeeType];
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });

  const isEmpty = !loading && filtered.length === 0;

  return (
    <div style={pageStyle}>
      <TrainingFilterBar
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
        activeTypes={activeTypes}
        onToggleType={toggleType}
      />
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
