'use client';

import { useState, type CSSProperties } from 'react';
import { Sheet, Button } from '@bds/components';
import { Badge } from '@bds/components';
import type { SheetTab } from '@bds/components';
import { sheetBodyStyle, sheetSectionTitle } from '@/app/(auth)/settings/_sheetStyles';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import { ProfileCard, profileCardGrid } from '@/components/ProfileCard';
import { color, font, gap, space, departmentColor } from '@/lib/tokens';
import type { Member } from '@/hooks/useMembers';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RoleViewData {
  id: string;
  name: string;
  department: string;
  department_color: string;
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
  /** All practice members — filtered to this role inside the component */
  members: Member[];
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const emptyState: CSSProperties = {
  padding: `${space.lg} 0`,
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: color.text.secondary,
  textAlign: 'center',
};


// ─── Component ───────────────────────────────────────────────────────────────

export function ViewRoleSheet({ isOpen, onClose, role, onEdit, members: allMembers }: ViewRoleSheetProps) {
  const [activeTab, setActiveTab] = useState('details');

  if (!role) return null;

  const users = allMembers.filter((m) => m.practice_role_id === role.id);
  const departments = role.department
    ? [{ id: role.id, name: role.department, departmentColor: role.department_color }]
    : [];

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
              name={`${u.first_name} ${u.last_name}`.trim()}
              subtitle={u.email}
              role={role.name}
              department={u.department}
              departmentBg={departmentColor(u.department_color).light}
              departmentText={departmentColor(u.department_color).text}
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
              dotColor={departmentColor(d.departmentColor).light}
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
