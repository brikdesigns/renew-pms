'use client';

import { useState, type CSSProperties } from 'react';
import { Sheet, Button } from '@bds/components';
import { Badge } from '@bds/components';
import type { SheetTab } from '@bds/components';
import { sheetBodyStyle, sheetSectionTitle } from '@/app/(auth)/settings/_sheetStyles';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import { ProfileCard, profileCardGrid } from '@/components/ProfileCard';
import { getDepartmentColors } from '@/lib/department-colors';
import { color, font, gap, space } from '@/lib/tokens';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RoleViewData {
  id: string;
  name: string;
  department: string;
  description: string;
  is_default: boolean;
  is_active: boolean;
  member_count: number;
}

interface ViewRoleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleViewData | null;
  onEdit?: () => void;
}

// ─── Mock associated data ────────────────────────────────────────────────────

interface AssociatedUser {
  id: string;
  name: string;
  email: string;
  department: string;
}

interface AssociatedDepartment {
  id: string;
  name: string;
}

const USERS_BY_ROLE: Record<string, AssociatedUser[]> = {
  Owner: [
    { id: '1', name: 'Sarah Mitchell', email: 'sarah@renewdental.com', department: 'Clinical' },
  ],
  'Office Manager': [
    { id: '2', name: 'Jessica Torres', email: 'jessica@renewdental.com', department: 'Administration' },
  ],
  'Dental Hygienist': [
    { id: '3', name: 'Amanda Chen', email: 'amanda@renewdental.com', department: 'Clinical' },
    { id: '4', name: 'Marcus Williams', email: 'marcus@renewdental.com', department: 'Clinical' },
  ],
  'Dental Assistant': [
    { id: '5', name: 'Emily Rivera', email: 'emily@renewdental.com', department: 'Clinical' },
    { id: '6', name: 'Tyler Nguyen', email: 'tyler@renewdental.com', department: 'Sterilization' },
  ],
  Receptionist: [
    { id: '7', name: 'Rachel Foster', email: 'rachel@renewdental.com', department: 'Front Desk' },
  ],
  'Treatment Coordinator': [
    { id: '8', name: 'David Park', email: 'david@renewdental.com', department: 'Front Desk' },
  ],
  'Insurance Coordinator': [
    { id: '9', name: 'Lisa Gomez', email: 'lisa@renewdental.com', department: 'Front Desk' },
  ],
  'Inventory Manager': [
    { id: '10', name: 'Jordan Hayes', email: 'jordan@renewdental.com', department: 'Maintenance' },
  ],
  Engineer: [],
  Manager: [],
  Admin: [],
  Staff: [],
};

const DEPARTMENTS_BY_ROLE: Record<string, AssociatedDepartment[]> = {
  Owner: [{ id: '1', name: 'Clinical' }],
  'Office Manager': [{ id: '5', name: 'Administration' }],
  'Dental Hygienist': [{ id: '1', name: 'Clinical' }],
  'Dental Assistant': [
    { id: '1', name: 'Clinical' },
    { id: '6', name: 'Sterilization' },
  ],
  Receptionist: [{ id: '2', name: 'Front Desk' }],
  'Treatment Coordinator': [{ id: '2', name: 'Front Desk' }],
  'Insurance Coordinator': [{ id: '2', name: 'Front Desk' }],
  Engineer: [{ id: '3', name: 'Maintenance' }],
  'Inventory Manager': [{ id: '3', name: 'Maintenance' }],
  Manager: [{ id: '7', name: 'All Departments' }],
  Admin: [{ id: '7', name: 'All Departments' }],
  Staff: [{ id: '7', name: 'All Departments' }],
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const emptyState: CSSProperties = {
  padding: `${space.lg} 0`,
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: color.text.secondary,
  textAlign: 'center',
};


// ─── Component ───────────────────────────────────────────────────────────────

export function ViewRoleSheet({ isOpen, onClose, role, onEdit }: ViewRoleSheetProps) {
  const [activeTab, setActiveTab] = useState('details');

  if (!role) return null;

  const users = USERS_BY_ROLE[role.name] ?? [];
  const departments = DEPARTMENTS_BY_ROLE[role.name] ?? [];

  const detailsContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Role Details</h3>
      <ReadOnlyField label="Name" value={role.name} />
      <ReadOnlyField label="Department" value={role.department} />
      <ReadOnlyField label="Description" value={role.description} />
      <ReadOnlyField label="Source" value={role.is_default ? 'Default' : 'Custom'} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
        <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: color.text.primary }}>
          Status
        </span>
        <div style={{ display: 'inline-flex' }}>
          <Badge status={role.is_active ? 'positive' : 'error'} size="sm">
            {role.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
    </div>
  );

  const usersContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Users</h3>
      {users.length === 0 ? (
        <p style={emptyState}>No users assigned to this role.</p>
      ) : (
        <div style={profileCardGrid}>
          {users.map((u) => (
            <ProfileCard
              key={u.id}
              variant="user"
              name={u.name}
              subtitle={u.email}
              role={role.name}
              department={u.department}
              departmentBg={getDepartmentColors(u.department).light}
              departmentText={getDepartmentColors(u.department).text}
            />
          ))}
        </div>
      )}
    </div>
  );

  const departmentsContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Departments</h3>
      {departments.length === 0 ? (
        <p style={emptyState}>No departments assigned to this role.</p>
      ) : (
        <div style={profileCardGrid}>
          {departments.map((d) => (
            <ProfileCard
              key={d.id}
              variant="department"
              name={d.name}
              dotColor={getDepartmentColors(d.name).light}
            />
          ))}
        </div>
      )}
    </div>
  );

  const sheetTabs: SheetTab[] = [
    { id: 'details', label: 'Details', content: detailsContent },
    { id: 'users', label: 'Users', content: usersContent },
    { id: 'departments', label: 'Departments', content: departmentsContent },
  ];

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={role.name}
      width="600px"
      side="right"
      tabs={sheetTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      footer={
        <div style={{ display: 'flex', alignItems: 'center', gap: gap.md, justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="md" type="button" onClick={onClose}>Close</Button>
          {onEdit && (
            <Button variant="primary" size="md" type="button" onClick={onEdit}>Edit</Button>
          )}
        </div>
      }
    />
  );
}
