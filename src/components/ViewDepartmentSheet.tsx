'use client';

import { useState, type CSSProperties } from 'react';
import { Sheet } from '@bds/components';
import { Badge } from '@bds/components';
import type { SheetTab } from '@bds/components';
import { sheetBodyStyle, sheetSectionTitle } from '@/app/(auth)/settings/_sheetStyles';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import { departmentColor, color, font } from '@/lib/tokens';
import { ProfileCard, profileCardGrid } from '@/components/ProfileCard';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DepartmentViewData {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  is_default: boolean;
  member_count: number;
}

interface ViewDepartmentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  department: DepartmentViewData | null;
  onEdit?: () => void;
}

// ─── Mock associated data ────────────────────────────────────────────────────

interface AssociatedRole {
  id: string;
  name: string;
  description: string;
}

interface AssociatedUser {
  id: string;
  name: string;
  role: string;
  email: string;
}

const ROLES_BY_DEPT: Record<string, AssociatedRole[]> = {
  Clinical: [
    { id: '1', name: 'Owner', description: 'Practice owner / lead dentist' },
    { id: '3', name: 'Dental Hygienist', description: 'Patient cleanings, periodontal care' },
    { id: '4', name: 'Dental Assistant', description: 'Chairside assistance, sterilization' },
  ],
  'Front Desk': [
    { id: '5', name: 'Receptionist', description: 'Patient check-in, scheduling' },
    { id: '6', name: 'Treatment Coordinator', description: 'Treatment plan presentation' },
    { id: '7', name: 'Insurance Coordinator', description: 'Claims processing, billing' },
  ],
  Maintenance: [
    { id: '8', name: 'Engineer', description: 'Equipment maintenance, IT systems' },
    { id: '9', name: 'Inventory Manager', description: 'Supply ordering, stock tracking' },
  ],
  HR: [],
  Administration: [
    { id: '2', name: 'Office Manager', description: 'Daily operations and staff coordination' },
  ],
  Sterilization: [],
  'All Departments': [
    { id: '10', name: 'Manager', description: 'Cross-department management and oversight' },
    { id: '11', name: 'Admin', description: 'Administrative access across the practice' },
    { id: '12', name: 'Staff', description: 'General staff member' },
  ],
};

const USERS_BY_DEPT: Record<string, AssociatedUser[]> = {
  Clinical: [
    { id: '1', name: 'Sarah Mitchell', role: 'Owner', email: 'sarah@renewdental.com' },
    { id: '3', name: 'Amanda Chen', role: 'Dental Hygienist', email: 'amanda@renewdental.com' },
    { id: '4', name: 'Marcus Williams', role: 'Dental Hygienist', email: 'marcus@renewdental.com' },
    { id: '5', name: 'Emily Rivera', role: 'Dental Assistant', email: 'emily@renewdental.com' },
  ],
  'Front Desk': [
    { id: '7', name: 'Rachel Foster', role: 'Receptionist', email: 'rachel@renewdental.com' },
    { id: '8', name: 'David Park', role: 'Treatment Coordinator', email: 'david@renewdental.com' },
    { id: '9', name: 'Lisa Gomez', role: 'Insurance Coordinator', email: 'lisa@renewdental.com' },
  ],
  Maintenance: [
    { id: '10', name: 'Jordan Hayes', role: 'Inventory Manager', email: 'jordan@renewdental.com' },
  ],
  HR: [
    { id: '2', name: 'Jessica Torres', role: 'Office Manager', email: 'jessica@renewdental.com' },
  ],
  Administration: [
    { id: '2', name: 'Jessica Torres', role: 'Office Manager', email: 'jessica@renewdental.com' },
    { id: '1', name: 'Sarah Mitchell', role: 'Owner', email: 'sarah@renewdental.com' },
  ],
  Sterilization: [
    { id: '6', name: 'Tyler Nguyen', role: 'Dental Assistant', email: 'tyler@renewdental.com' },
    { id: '5', name: 'Emily Rivera', role: 'Dental Assistant', email: 'emily@renewdental.com' },
  ],
  'All Departments': [],
};

// ─── Color label lookup ──────────────────────────────────────────────────────

const COLOR_LABELS: Record<string, string> = {
  blue: 'Blue',
  green: 'Green',
  red: 'Red',
  purple: 'Purple',
  gold: 'Gold',
  teal: 'Teal',
  pink: 'Pink',
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const colorSwatchRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const colorDot: CSSProperties = {
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  display: 'inline-block',
  flexShrink: 0,
};

const dotBase: CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  display: 'inline-block',
  flexShrink: 0,
};

const statusWrap: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontFamily: font.family.label,
  fontSize: font.size.label.md,
  fontWeight: font.weight.medium,
};

const emptyState: CSSProperties = {
  padding: '24px 0',
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: color.text.secondary,
  textAlign: 'center',
};


// ─── Component ───────────────────────────────────────────────────────────────

export function ViewDepartmentSheet({ isOpen, onClose, department, onEdit }: ViewDepartmentSheetProps) {
  const [activeTab, setActiveTab] = useState('details');

  if (!department) return null;

  const roles = ROLES_BY_DEPT[department.name] ?? [];
  const users = USERS_BY_DEPT[department.name] ?? [];
  const colorLabel = COLOR_LABELS[department.color] ?? department.color;

  const detailsContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Department Details</h3>
      <ReadOnlyField label="Name" value={department.name} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: color.text.primary }}>
          Color Tag
        </span>
        {department.color ? (
          <span style={colorSwatchRow}>
            <span style={{ ...colorDot, backgroundColor: departmentColor(department.color).base }} />
            <span style={{ fontFamily: font.family.body, fontSize: font.size.body.md, color: color.text.secondary }}>
              {colorLabel}
            </span>
          </span>
        ) : (
          <span style={{ fontFamily: font.family.body, fontSize: font.size.body.md, color: color.text.secondary }}>None</span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: color.text.primary }}>
          Status
        </span>
        <div style={{ display: 'inline-flex' }}>
          <Badge status={department.is_active ? 'positive' : 'error'} size="sm">
            {department.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
      <ReadOnlyField label="Source" value={department.is_default ? 'Default' : 'Custom'} />
      <ReadOnlyField label="Members" value={String(department.member_count)} />
    </div>
  );

  const rolesContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Roles</h3>
      {roles.length === 0 ? (
        <p style={emptyState}>No roles assigned to this department.</p>
      ) : (
        <div style={profileCardGrid}>
          {roles.map((r) => (
            <ProfileCard
              key={r.id}
              variant="role"
              name={r.name}
              subtitle={r.description}
              departmentBg={departmentColor(department.color).light}
              departmentText={departmentColor(department.color).text}
            />
          ))}
        </div>
      )}
    </div>
  );

  const usersContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Users</h3>
      {users.length === 0 ? (
        <p style={emptyState}>No users assigned to this department.</p>
      ) : (
        <div style={profileCardGrid}>
          {users.map((u) => (
            <ProfileCard
              key={u.id}
              variant="user"
              name={u.name}
              subtitle={u.email}
              role={u.role}
              department={department.name}
              departmentBg={departmentColor(department.color).light}
              departmentText={departmentColor(department.color).text}
            />
          ))}
        </div>
      )}
    </div>
  );

  const sheetTabs: SheetTab[] = [
    { id: 'details', label: 'Details', content: detailsContent },
    { id: 'roles', label: 'Roles', content: rolesContent },
    { id: 'users', label: 'Users', content: usersContent },
  ];

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={department.name}
      width="600px"
      side="right"
      tabs={sheetTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      footer={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" className="renew-btn renew-btn--ghost" onClick={onClose}>Close</button>
          {onEdit && (
            <button type="button" className="renew-btn renew-btn--primary" onClick={onEdit}>Edit</button>
          )}
        </div>
      }
    />
  );
}
