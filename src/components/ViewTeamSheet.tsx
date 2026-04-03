'use client';

import { useState, type CSSProperties } from 'react';
import { Sheet, Button } from '@bds/components';
import { Badge } from '@bds/components';
import type { SheetTab } from '@bds/components';
import { sheetBodyStyle, sheetSectionTitle } from '@/app/(auth)/settings/_sheetStyles';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import { ProfileCard, profileCardGrid } from '@/components/ProfileCard';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TeamViewData {
  id: string;
  name: string;
  department: string;
  shift: string;
  description: string;
  is_active: boolean;
  member_count: number;
}

interface ViewTeamSheetProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamViewData | null;
  onEdit?: () => void;
}

// ─── Mock associated data ────────────────────────────────────────────────────

interface AssociatedRole {
  id: string;
  name: string;
  description: string;
  department: string;
  departmentColor: string;
}

interface AssociatedUser {
  id: string;
  name: string;
  role: string;
  email: string;
  department: string;
  departmentColor: string;
}

const ROLES_BY_TEAM: Record<string, AssociatedRole[]> = {
  'Morning Crew': [
    { id: '1', name: 'Owner', description: 'Practice owner / lead dentist', department: 'Clinical', departmentColor: 'blue' },
    { id: '3', name: 'Dental Hygienist', description: 'Patient cleanings, periodontal care', department: 'Clinical', departmentColor: 'blue' },
    { id: '4', name: 'Dental Assistant', description: 'Chairside assistance, sterilization', department: 'Clinical', departmentColor: 'blue' },
    { id: '5', name: 'Receptionist', description: 'Patient check-in, scheduling', department: 'Front Desk', departmentColor: 'green' },
  ],
  'Closing Crew': [
    { id: '3', name: 'Dental Hygienist', description: 'Patient cleanings, periodontal care', department: 'Clinical', departmentColor: 'blue' },
    { id: '4', name: 'Dental Assistant', description: 'Chairside assistance, sterilization', department: 'Clinical', departmentColor: 'blue' },
    { id: '5', name: 'Receptionist', description: 'Patient check-in, scheduling', department: 'Front Desk', departmentColor: 'green' },
  ],
  'Clinical Team A': [
    { id: '1', name: 'Owner', description: 'Practice owner / lead dentist', department: 'Clinical', departmentColor: 'blue' },
    { id: '3', name: 'Dental Hygienist', description: 'Patient cleanings, periodontal care', department: 'Clinical', departmentColor: 'blue' },
    { id: '4', name: 'Dental Assistant', description: 'Chairside assistance, sterilization', department: 'Clinical', departmentColor: 'blue' },
  ],
  'Front Desk Team': [
    { id: '5', name: 'Receptionist', description: 'Patient check-in, scheduling', department: 'Front Desk', departmentColor: 'green' },
    { id: '6', name: 'Treatment Coordinator', description: 'Treatment plan presentation', department: 'Front Desk', departmentColor: 'green' },
    { id: '7', name: 'Insurance Coordinator', description: 'Claims processing, billing', department: 'Front Desk', departmentColor: 'green' },
  ],
  'Sterilization Team': [
    { id: '4', name: 'Dental Assistant', description: 'Chairside assistance, sterilization', department: 'Clinical', departmentColor: 'blue' },
  ],
};

const USERS_BY_TEAM: Record<string, AssociatedUser[]> = {
  'Morning Crew': [
    { id: '1', name: 'Sarah Mitchell', role: 'Owner', email: 'sarah@renewdental.com', department: 'Clinical', departmentColor: 'blue' },
    { id: '3', name: 'Amanda Chen', role: 'Dental Hygienist', email: 'amanda@renewdental.com', department: 'Clinical', departmentColor: 'blue' },
    { id: '5', name: 'Emily Rivera', role: 'Dental Assistant', email: 'emily@renewdental.com', department: 'Clinical', departmentColor: 'blue' },
    { id: '7', name: 'Rachel Foster', role: 'Receptionist', email: 'rachel@renewdental.com', department: 'Front Desk', departmentColor: 'green' },
  ],
  'Closing Crew': [
    { id: '4', name: 'Marcus Williams', role: 'Dental Hygienist', email: 'marcus@renewdental.com', department: 'Clinical', departmentColor: 'blue' },
    { id: '6', name: 'Tyler Nguyen', role: 'Dental Assistant', email: 'tyler@renewdental.com', department: 'Sterilization', departmentColor: 'red' },
    { id: '7', name: 'Rachel Foster', role: 'Receptionist', email: 'rachel@renewdental.com', department: 'Front Desk', departmentColor: 'green' },
  ],
  'Clinical Team A': [
    { id: '1', name: 'Sarah Mitchell', role: 'Owner', email: 'sarah@renewdental.com', department: 'Clinical', departmentColor: 'blue' },
    { id: '3', name: 'Amanda Chen', role: 'Dental Hygienist', email: 'amanda@renewdental.com', department: 'Clinical', departmentColor: 'blue' },
    { id: '5', name: 'Emily Rivera', role: 'Dental Assistant', email: 'emily@renewdental.com', department: 'Clinical', departmentColor: 'blue' },
  ],
  'Front Desk Team': [
    { id: '7', name: 'Rachel Foster', role: 'Receptionist', email: 'rachel@renewdental.com', department: 'Front Desk', departmentColor: 'green' },
    { id: '8', name: 'David Park', role: 'Treatment Coordinator', email: 'david@renewdental.com', department: 'Front Desk', departmentColor: 'green' },
    { id: '9', name: 'Lisa Gomez', role: 'Insurance Coordinator', email: 'lisa@renewdental.com', department: 'Front Desk', departmentColor: 'green' },
  ],
  'Sterilization Team': [
    { id: '6', name: 'Tyler Nguyen', role: 'Dental Assistant', email: 'tyler@renewdental.com', department: 'Sterilization', departmentColor: 'red' },
    { id: '5', name: 'Emily Rivera', role: 'Dental Assistant', email: 'emily@renewdental.com', department: 'Clinical', departmentColor: 'blue' },
  ],
};

// ─── Shift label lookup ─────────────────────────────────────────────────────

const SHIFT_LABELS: Record<string, string> = {
  opening: 'Opening',
  closing: 'Closing',
  evening: 'Evening',
  full_day: 'Full Day',
};

// ─── Tokens ──────────────────────────────────────────────────────────────────

import { font, color, gap, space, departmentColor } from '@/lib/tokens';

const TEXT_PRIMARY = color.text.primary;
const TEXT_SECONDARY = color.text.secondary;

// ─── Styles ──────────────────────────────────────────────────────────────────

const emptyState: CSSProperties = {
  padding: `${space.lg} 0`,
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: TEXT_SECONDARY,
  textAlign: 'center',
};


// ─── Component ───────────────────────────────────────────────────────────────

export function ViewTeamSheet({ isOpen, onClose, team, onEdit }: ViewTeamSheetProps) {
  const [activeTab, setActiveTab] = useState('details');

  if (!team) return null;

  const roles = ROLES_BY_TEAM[team.name] ?? [];
  const users = USERS_BY_TEAM[team.name] ?? [];

  const detailsContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Team Details</h3>
      <ReadOnlyField label="Name" value={team.name} />
      <ReadOnlyField label="Description" value={team.description || null} />
      <ReadOnlyField label="Department" value={team.department || 'Cross-department'} />
      <ReadOnlyField label="Shift" value={team.shift ? (SHIFT_LABELS[team.shift] ?? team.shift) : null} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
        <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: TEXT_PRIMARY }}>
          Status
        </span>
        <div style={{ display: 'inline-flex' }}>
          <Badge status={team.is_active ? 'positive' : 'error'} size="sm">
            {team.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
      <ReadOnlyField label="Members" value={String(team.member_count)} />
    </div>
  );

  const rolesContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Roles</h3>
      {roles.length === 0 ? (
        <p style={emptyState}>No roles assigned to this team.</p>
      ) : (
        <div style={profileCardGrid}>
          {roles.map((r) => (
            <ProfileCard
              key={r.id}
              variant="role"
              name={r.name}
              subtitle={r.description}
              departmentBg={departmentColor(r.departmentColor).light}
              departmentText={departmentColor(r.departmentColor).text}
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
        <p style={emptyState}>No users assigned to this team.</p>
      ) : (
        <div style={profileCardGrid}>
          {users.map((u) => (
            <ProfileCard
              key={u.id}
              variant="user"
              name={u.name}
              subtitle={u.email}
              role={u.role}
              department={u.department}
              departmentBg={departmentColor(u.departmentColor).light}
              departmentText={departmentColor(u.departmentColor).text}
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
      title={team.name}
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
