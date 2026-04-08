'use client';

import { useState, type CSSProperties } from 'react';
import { Sheet, Button } from '@bds/components';
import { Badge } from '@bds/components';
import type { SheetTab } from '@bds/components';
import { sheetBodyStyle, sheetSectionTitle } from '@/app/(auth)/settings/_sheetStyles';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import { departmentColor, color, font, gap, space, border } from '@/lib/tokens';
import { ProfileCard, profileCardGrid } from '@/components/ProfileCard';
import type { Role } from '@/hooks/useRoles';
import type { Member } from '@/hooks/useMembers';

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
  /** All practice roles — filtered to this dept inside the component */
  roles: Role[];
  /** All practice members — filtered to this dept inside the component */
  members: Member[];
}

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
  gap: gap.md,
};

const colorDot: CSSProperties = {
  width: '12px',
  height: '12px',
  borderRadius: border.radius.circle,
  display: 'inline-block',
  flexShrink: 0,
};

const emptyState: CSSProperties = {
  padding: `${space.lg} 0`,
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: color.text.secondary,
  textAlign: 'center',
};


// ─── Component ───────────────────────────────────────────────────────────────

export function ViewDepartmentSheet({ isOpen, onClose, department, onEdit, roles: allRoles, members: allMembers }: ViewDepartmentSheetProps) {
  const [activeTab, setActiveTab] = useState('details');

  if (!department) return null;

  const secondaryRoles: Record<string, string[]> = {
    'Office Manager':        ['IT (Information Technology)', 'Marketing', 'Finance', 'Facilities'],
    'Clinical Manager':      ['(M) Management'],
    'Insurance Coordinator': ['Finance'],
    'Third Party':           ['Finance', 'Marketing', 'Facilities'],
  };

  const roles = allRoles.filter(
    (r) => r.department_id === department.id || (secondaryRoles[r.name]?.includes(department.name) ?? false),
  );
  const roleNames = new Set(roles.map((r) => r.name));
  const users = allMembers.filter(
    (m) => m.department_id === department.id || roleNames.has(m.practice_role),
  );
  const colorLabel = COLOR_LABELS[department.color] ?? department.color;

  const detailsContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Department Details</h3>
      <ReadOnlyField label="Name" value={department.name} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
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
              name={`${u.first_name} ${u.last_name}`.trim()}
              subtitle={u.email}
              role={u.practice_role}
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
