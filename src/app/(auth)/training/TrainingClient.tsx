'use client';

import { useState, useCallback, useMemo } from 'react';
import { useSheetStack } from '@bds/components';
import { TrainingCard, type TrainingMember } from '@/components/TrainingCard';
import { TrainingFilterBar, type EmployeeTypeFilter, type EmployeeTypeSegment } from '@/components/TrainingFilterBar';
import { useMembers } from '@/hooks/useMembers';
import type { SystemRole } from '@/lib/auth';
import { color, font, space, gap, border } from '@/lib/tokens';

// ─── Styles ──────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.lg,
};

const staffHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: space.sm,
  padding: `${space.sm} 0`,
};

const staffTitleStyle: React.CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.md,
  fontWeight: font.weight.semibold,
  color: color.text.primary,
  margin: 0,
};

const staffCountStyle: React.CSSProperties = {
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

interface TrainingClientProps {
  systemRole: SystemRole;
  currentMemberId: string | null;
  userDepartment: string | null;
}

export default function TrainingClient({ systemRole, currentMemberId, userDepartment }: TrainingClientProps) {
  const { members, loading } = useMembers();
  const { openSheet } = useSheetStack();
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [activeSegment, setActiveSegment] = useState<EmployeeTypeSegment>('all');

  const isAdmin = systemRole === 'brik_admin' || systemRole === 'admin';
  const isManager = systemRole === 'manager';

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

  // Scope by role: staff sees only self, managers see their department, admins see all
  const scopedMembers = useMemo(() => {
    if (isAdmin) return trainingMembers;
    if (isManager && userDepartment) return trainingMembers.filter((m) => m.department === userDepartment);
    // Staff: only their own card
    return trainingMembers.filter((m) => m.id === currentMemberId);
  }, [trainingMembers, isAdmin, isManager, userDepartment, currentMemberId]);

  const filtered = scopedMembers
    .filter((m) => {
      if (activeSegment !== 'all' && m.employeeType !== activeSegment) return false;
      if (selectedDepartment !== 'All Departments' && m.department !== selectedDepartment) return false;
      return true;
    })
    .sort((a, b) => {
      const order = { new: 0, maturing: 1, proficient: 2 };
      const diff = order[a.employeeType] - order[b.employeeType];
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });

  const handleViewDetails = useCallback((memberId: string) => {
    const m = filtered.find((f) => f.id === memberId);
    openSheet('user', { id: memberId }, { title: m?.name ?? 'User Profile' });
  }, [filtered, openSheet]);

  const isEmpty = !loading && filtered.length === 0;
  const showFilters = isAdmin || isManager;

  return (
    <div style={pageStyle}>
      {showFilters ? (
        <TrainingFilterBar
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          activeSegment={activeSegment}
          onSegmentChange={setActiveSegment}
          count={loading ? '–' : filtered.length}
        />
      ) : (
        <div style={staffHeaderStyle}>
          <h3 style={staffTitleStyle}>My Training</h3>
          <span style={staffCountStyle}>{loading ? '–' : filtered.length}</span>
        </div>
      )}
      <div style={listStyle}>
        {filtered.map((member) => (
          <TrainingCard key={member.id} member={member} onViewDetails={handleViewDetails} />
        ))}
        {isEmpty && (
          <div style={emptyStyle}>
            {scopedMembers.length === 0
              ? isAdmin
                ? 'No team members have been added yet.'
                : 'No training items assigned to you.'
              : 'No team members match the current filters.'}
          </div>
        )}
      </div>
    </div>
  );
}
