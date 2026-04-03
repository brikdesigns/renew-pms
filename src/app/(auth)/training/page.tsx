'use client';

import { useState, useCallback } from 'react';
import { TrainingCard, type TrainingMember } from '@/components/TrainingCard';
import { TrainingFilterBar, type EmployeeTypeFilter } from '@/components/TrainingFilterBar';
import { color, font, space, gap } from '@/lib/tokens';

// ─── Mock data (uses seed users from Settings > Users) ───────────────────────

const MOCK_MEMBERS: TrainingMember[] = [
  // ── New hires (active onboarding) ──
  {
    id: 'pm-jordan',
    name: 'Jordan Hayes',
    role: 'Inventory Manager',
    department: 'Maintenance',
    departmentColor: 'purple',
    employeeType: 'new',
    progress: 12,
    totalModules: 6,
    completedModules: 1,
    hasTrainingDue: true,
  },
  {
    id: 'pm-tyler',
    name: 'Tyler Nguyen',
    role: 'Dental Assistant',
    department: 'Sterilization',
    departmentColor: 'red',
    employeeType: 'new',
    progress: 25,
    totalModules: 8,
    completedModules: 2,
    hasTrainingDue: true,
  },

  // ── Maturing (finishing onboarding, transitioning) ──
  {
    id: 'pm-rachel',
    name: 'Rachel Foster',
    role: 'Receptionist',
    department: 'Front Desk',
    departmentColor: 'green',
    employeeType: 'maturing',
    progress: 60,
    totalModules: 5,
    completedModules: 3,
    hasTrainingDue: true,
  },
  {
    id: 'pm-emily',
    name: 'Emily Rivera',
    role: 'Dental Assistant',
    department: 'Clinical',
    departmentColor: 'blue',
    employeeType: 'maturing',
    progress: 75,
    totalModules: 8,
    completedModules: 6,
    hasTrainingDue: true,
  },

  // ── Active (periodic training — only those with training due) ──
  {
    id: 'pm-jessica',
    name: 'Jessica Torres',
    role: 'Office Manager',
    department: 'Administration',
    departmentColor: 'gold',
    employeeType: 'active',
    progress: 0,
    totalModules: 2,
    completedModules: 0,
    hasTrainingDue: true,
  },
  {
    id: 'pm-sarah',
    name: 'Sarah Mitchell',
    role: 'Owner',
    department: 'Clinical',
    departmentColor: 'blue',
    employeeType: 'active',
    progress: 33,
    totalModules: 3,
    completedModules: 1,
    hasTrainingDue: true,
  },
  {
    id: 'pm-amanda',
    name: 'Amanda Chen',
    role: 'Dental Hygienist',
    department: 'Clinical',
    departmentColor: 'blue',
    employeeType: 'active',
    progress: 50,
    totalModules: 2,
    completedModules: 1,
    hasTrainingDue: true,
  },
];

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

// ─── Component ───────────────────────────────────────────────────────────────

export default function TrainingPage() {
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

  const filtered = MOCK_MEMBERS
    .filter((m) => {
      if (activeTypes.size > 0 && !activeTypes.has(m.employeeType)) return false;
      if (selectedDepartment !== 'All Departments' && m.department !== selectedDepartment) return false;
      return true;
    })
    // Sort: new → maturing → active, then by progress ascending
    .sort((a, b) => {
      const order = { new: 0, maturing: 1, active: 2 };
      const diff = order[a.employeeType] - order[b.employeeType];
      if (diff !== 0) return diff;
      return a.progress - b.progress;
    });

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
        {filtered.length === 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            fontFamily: font.family.body,
            fontSize: font.size.body.md,
            color: color.text.muted,
          }}>
            No team members match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
