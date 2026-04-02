'use client';

import { useState, type CSSProperties } from 'react';
import { Sheet } from '@bds/components';
import type { SheetTab } from '@bds/components';
import { Badge } from '@bds/components';
import { Tag } from '@bds/components';
import { ProfileCard, profileCardGrid } from '@/components/ProfileCard';
import { getDepartmentColors } from '@/lib/department-colors';
import { sheetBodyStyle, sheetSectionTitle } from '@/app/(auth)/settings/_sheetStyles';
import { ReadOnlyField } from '@/components/ReadOnlyField';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserViewData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  system_role: string;
  practice_role: string;
  department: string;
  employee_type: string;
  shift: string;
  is_active: boolean;
  joined_at: string;
}

interface ViewUserSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserViewData | null;
  onEdit?: () => void;
}

// ─── Mock associated data ────────────────────────────────────────────────────

interface AssociatedRole {
  id: string;
  role: string;
  department: string;
}

interface AssociatedDepartment {
  id: string;
  department: string;
}

const ROLES_BY_USER: Record<string, AssociatedRole[]> = {
  'Sarah Mitchell': [
    { id: '1', role: 'Owner', department: 'Clinical' },
  ],
  'Jessica Torres': [
    { id: '2', role: 'Office Manager', department: 'Administration' },
  ],
  'Amanda Chen': [
    { id: '3', role: 'Dental Hygienist', department: 'Clinical' },
  ],
  'Marcus Williams': [
    { id: '4', role: 'Dental Hygienist', department: 'Clinical' },
  ],
  'Emily Rivera': [
    { id: '5', role: 'Dental Assistant', department: 'Clinical' },
  ],
  'Tyler Nguyen': [
    { id: '6', role: 'Dental Assistant', department: 'Sterilization' },
  ],
  'Rachel Foster': [
    { id: '7', role: 'Receptionist', department: 'Front Desk' },
  ],
  'David Park': [
    { id: '8', role: 'Treatment Coordinator', department: 'Front Desk' },
  ],
  'Lisa Gomez': [
    { id: '9', role: 'Insurance Coordinator', department: 'Front Desk' },
  ],
  'Jordan Hayes': [
    { id: '10', role: 'Inventory Manager', department: 'Engineering' },
  ],
};

const DEPARTMENTS_BY_USER: Record<string, AssociatedDepartment[]> = {
  'Sarah Mitchell': [{ id: '1', department: 'Clinical' }],
  'Jessica Torres': [{ id: '2', department: 'Administration' }],
  'Amanda Chen': [{ id: '3', department: 'Clinical' }],
  'Marcus Williams': [{ id: '4', department: 'Clinical' }],
  'Emily Rivera': [{ id: '5', department: 'Clinical' }],
  'Tyler Nguyen': [{ id: '6', department: 'Sterilization' }],
  'Rachel Foster': [{ id: '7', department: 'Front Desk' }],
  'David Park': [{ id: '8', department: 'Front Desk' }],
  'Lisa Gomez': [{ id: '9', department: 'Front Desk' }],
  'Jordan Hayes': [{ id: '10', department: 'Engineering' }],
};

// ─── Label lookups ──────────────────────────────────────────────────────────

const SYSTEM_ROLE_LABELS: Record<string, string> = {
  platform_admin: 'Platform Admin',
  practice_admin: 'Practice Admin',
  staff: 'Staff',
};

const SHIFT_LABELS: Record<string, string> = {
  opening: 'Opening',
  closing: 'Closing',
  evening: 'Evening',
  full_day: 'Full Day',
};

const EMPLOYEE_TYPE_TAG: Record<string, { bg: string; color: string; label: string }> = {
  new:      { bg: color.department.blue.base,  color: color.text.onColorDark, label: 'New Hire' },
  maturing: { bg: color.department.gold.base,  color: color.text.onColorDark, label: 'Maturing' },
  active:   { bg: color.department.green.base, color: color.text.onColorDark, label: 'Active' },
};

// ─── Tokens ──────────────────────────────────────────────────────────────────

import { font, color, gap, space, border } from '@/lib/tokens';

const TEXT_PRIMARY = color.text.primary;
const TEXT_SECONDARY = color.text.secondary;

// ─── Styles ──────────────────────────────────────────────────────────────────

const fieldRow: CSSProperties = { display: 'flex', gap: gap.lg };
const fieldHalf: CSSProperties = { flex: 1, minWidth: 0 };

const emptyState: CSSProperties = {
  padding: `${space.lg} 0`,
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  color: TEXT_SECONDARY,
  textAlign: 'center',
};


// ─── Component ───────────────────────────────────────────────────────────────

export function ViewUserSheet({ isOpen, onClose, user, onEdit }: ViewUserSheetProps) {
  const [activeTab, setActiveTab] = useState('details');

  if (!user) return null;

  const fullName = `${user.first_name} ${user.last_name}`.trim();
  const roles = ROLES_BY_USER[fullName] ?? [];
  const departments = DEPARTMENTS_BY_USER[fullName] ?? [];

  const detailsContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>User Details</h3>
      <div style={fieldRow}>
        <div style={fieldHalf}>
          <ReadOnlyField label="First Name" value={user.first_name} />
        </div>
        <div style={fieldHalf}>
          <ReadOnlyField label="Last Name" value={user.last_name} />
        </div>
      </div>
      <div style={fieldRow}>
        <div style={fieldHalf}>
          <ReadOnlyField label="Email" value={user.email} />
        </div>
        <div style={fieldHalf}>
          <ReadOnlyField label="Phone" value={user.phone || null} />
        </div>
      </div>
      <div style={fieldRow}>
        <div style={fieldHalf}>
          <ReadOnlyField label="System Role" value={SYSTEM_ROLE_LABELS[user.system_role] ?? user.system_role} />
        </div>
        <div style={fieldHalf}>
          <ReadOnlyField label="Practice Role" value={user.practice_role || null} />
        </div>
      </div>
      <div style={fieldRow}>
        <div style={fieldHalf}>
          <ReadOnlyField label="Department" value={user.department || null} />
        </div>
        <div style={fieldHalf}>
          <ReadOnlyField label="Shift" value={user.shift ? (SHIFT_LABELS[user.shift] ?? user.shift) : null} />
        </div>
      </div>
      <div style={fieldRow}>
        <div style={fieldHalf}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontFamily: font.family.label, fontSize: font.size.body.sm, fontWeight: 500, color: TEXT_PRIMARY }}>
              Employee Type
            </span>
            <div style={{ display: 'inline-flex' }}>
              <Tag size="sm" style={{ backgroundColor: (EMPLOYEE_TYPE_TAG[user.employee_type] ?? EMPLOYEE_TYPE_TAG.active).bg, color: (EMPLOYEE_TYPE_TAG[user.employee_type] ?? EMPLOYEE_TYPE_TAG.active).color }}>
                {(EMPLOYEE_TYPE_TAG[user.employee_type] ?? EMPLOYEE_TYPE_TAG.active).label}
              </Tag>
            </div>
          </div>
        </div>
        <div style={fieldHalf}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontFamily: font.family.label, fontSize: font.size.body.sm, fontWeight: 500, color: TEXT_PRIMARY }}>
              Account Status
            </span>
            <div style={{ display: 'inline-flex' }}>
              <Badge status={user.is_active ? 'positive' : 'error'} size="sm">
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const rolesContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Roles</h3>
      {roles.length === 0 ? (
        <p style={emptyState}>No roles assigned to this user.</p>
      ) : (
        <div style={profileCardGrid}>
          {roles.map((r) => (
            <ProfileCard
              key={r.id}
              variant="role"
              name={r.role}
              subtitle={r.department}
              departmentBg={getDepartmentColors(r.department).light}
              departmentText={getDepartmentColors(r.department).text}
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
        <p style={emptyState}>No departments assigned to this user.</p>
      ) : (
        <div style={profileCardGrid}>
          {departments.map((d) => (
            <ProfileCard
              key={d.id}
              variant="department"
              name={d.department}
              dotColor={getDepartmentColors(d.department).light}
            />
          ))}
        </div>
      )}
    </div>
  );

  const sheetTabs: SheetTab[] = [
    { id: 'details', label: 'Details', content: detailsContent },
    { id: 'roles', label: 'Roles', content: rolesContent },
    { id: 'departments', label: 'Departments', content: departmentsContent },
  ];

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={fullName}
      width="600px"
      side="right"
      tabs={sheetTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      footer={
        <div style={{ display: 'flex', alignItems: 'center', gap: gap.md, justifyContent: 'flex-end' }}>
          <button type="button" className="renew-btn renew-btn--ghost" onClick={onClose}>Close</button>
          {onEdit && (
            <button type="button" className="renew-btn renew-btn--primary" onClick={onEdit}>Edit</button>
          )}
        </div>
      }
    />
  );
}
