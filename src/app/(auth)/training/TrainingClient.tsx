'use client';

import { useState, useCallback, useMemo } from 'react';
import { useSheetStack } from '@bds/components';
import { TrainingCard, type TrainingMember } from '@/components/TrainingCard';
import { TrainingFilterBar, type EmployeeTypeFilter } from '@/components/TrainingFilterBar';
import { useMembers } from '@/hooks/useMembers';
import type { SystemRole } from '@/lib/auth';
import { color, font, space, gap, border } from '@/lib/tokens';

// ─── Styles ──────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.lg,
};

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

interface TrainingClientProps {
  systemRole: SystemRole;
  currentMemberId: string | null;
  userDepartment: string | null;
}

export default function TrainingClient({ systemRole, currentMemberId, userDepartment }: TrainingClientProps) {
  const { members, loading } = useMembers();
  const { openSheet } = useSheetStack();
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [activeTypes, setActiveTypes] = useState<Set<EmployeeTypeFilter>>(new Set());

  const isAdmin = systemRole === 'brik_admin' || systemRole === 'admin';
  const isManager = systemRole === 'manager';

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

  // Scope by role: staff sees only self, managers see their department, admins see all
  const scopedMembers = useMemo(() => {
    if (isAdmin) return trainingMembers;
    if (isManager && userDepartment) return trainingMembers.filter((m) => m.department === userDepartment);
    // Staff: only their own card
    return trainingMembers.filter((m) => m.id === currentMemberId);
  }, [trainingMembers, isAdmin, isManager, userDepartment, currentMemberId]);

  const filtered = scopedMembers
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

  const handleViewDetails = useCallback((memberId: string) => {
    const m = filtered.find((f) => f.id === memberId);
    openSheet('user', { id: memberId }, { title: m?.name ?? 'User Profile' });
  }, [filtered, openSheet]);

  const isEmpty = !loading && filtered.length === 0;

  const heading = isAdmin
    ? 'Team Members'
    : isManager
      ? 'Department Training'
      : 'My Training';

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div style={headerLeftStyle}>
          <h3 style={titleStyle}>{heading}</h3>
          <span style={countBadgeStyle}>{loading ? '–' : filtered.length}</span>
        </div>
        {/* Only show filters for admin/manager — staff sees a single card */}
        {!(!isAdmin && !isManager) && (
          <TrainingFilterBar
            selectedDepartment={selectedDepartment}
            onDepartmentChange={setSelectedDepartment}
            activeTypes={activeTypes}
            onToggleType={toggleType}
          />
        )}
      </div>
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
