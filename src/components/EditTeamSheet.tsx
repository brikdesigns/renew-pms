'use client';

import { useState, useEffect, type FormEvent, type CSSProperties } from 'react';
import {
  Sheet, TextInput, Select,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bds/components';
import type { SheetTab } from '@bds/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '@/components/ToastProvider';
import {
  sheetBodyStyle,
  sheetSectionTitle,
  sheetFormGroup,
} from '@/app/(auth)/settings/_sheetStyles';
import { font, color, border } from '@/lib/tokens';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TeamFormData {
  name: string;
  department: string;
  shift: string;
  description: string;
  is_active: boolean;
}

interface EditTeamSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: TeamFormData | null;
  onSave: (data: TeamFormData) => void;
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

const ROLES_BY_TEAM: Record<string, AssociatedRole[]> = {
  'Morning Crew': [
    { id: '1', name: 'Owner', description: 'Practice owner / lead dentist' },
    { id: '3', name: 'Dental Hygienist', description: 'Patient cleanings, periodontal care' },
    { id: '4', name: 'Dental Assistant', description: 'Chairside assistance, sterilization' },
    { id: '5', name: 'Receptionist', description: 'Patient check-in, scheduling' },
  ],
  'Closing Crew': [
    { id: '3', name: 'Dental Hygienist', description: 'Patient cleanings, periodontal care' },
    { id: '4', name: 'Dental Assistant', description: 'Chairside assistance, sterilization' },
    { id: '5', name: 'Receptionist', description: 'Patient check-in, scheduling' },
  ],
  'Clinical Team A': [
    { id: '1', name: 'Owner', description: 'Practice owner / lead dentist' },
    { id: '3', name: 'Dental Hygienist', description: 'Patient cleanings, periodontal care' },
    { id: '4', name: 'Dental Assistant', description: 'Chairside assistance, sterilization' },
  ],
  'Front Desk Team': [
    { id: '5', name: 'Receptionist', description: 'Patient check-in, scheduling' },
    { id: '6', name: 'Treatment Coordinator', description: 'Treatment plan presentation' },
    { id: '7', name: 'Insurance Coordinator', description: 'Claims processing, billing' },
  ],
  'Sterilization Team': [
    { id: '4', name: 'Dental Assistant', description: 'Chairside assistance, sterilization' },
  ],
};

const USERS_BY_TEAM: Record<string, AssociatedUser[]> = {
  'Morning Crew': [
    { id: '1', name: 'Sarah Mitchell', role: 'Owner', email: 'sarah@renewdental.com' },
    { id: '3', name: 'Amanda Chen', role: 'Dental Hygienist', email: 'amanda@renewdental.com' },
    { id: '5', name: 'Emily Rivera', role: 'Dental Assistant', email: 'emily@renewdental.com' },
    { id: '7', name: 'Rachel Foster', role: 'Receptionist', email: 'rachel@renewdental.com' },
  ],
  'Closing Crew': [
    { id: '4', name: 'Marcus Williams', role: 'Dental Hygienist', email: 'marcus@renewdental.com' },
    { id: '6', name: 'Tyler Nguyen', role: 'Dental Assistant', email: 'tyler@renewdental.com' },
    { id: '7', name: 'Rachel Foster', role: 'Receptionist', email: 'rachel@renewdental.com' },
  ],
  'Clinical Team A': [
    { id: '1', name: 'Sarah Mitchell', role: 'Owner', email: 'sarah@renewdental.com' },
    { id: '3', name: 'Amanda Chen', role: 'Dental Hygienist', email: 'amanda@renewdental.com' },
    { id: '5', name: 'Emily Rivera', role: 'Dental Assistant', email: 'emily@renewdental.com' },
  ],
  'Front Desk Team': [
    { id: '7', name: 'Rachel Foster', role: 'Receptionist', email: 'rachel@renewdental.com' },
    { id: '8', name: 'David Park', role: 'Treatment Coordinator', email: 'david@renewdental.com' },
    { id: '9', name: 'Lisa Gomez', role: 'Insurance Coordinator', email: 'lisa@renewdental.com' },
  ],
  'Sterilization Team': [
    { id: '6', name: 'Tyler Nguyen', role: 'Dental Assistant', email: 'tyler@renewdental.com' },
    { id: '5', name: 'Emily Rivera', role: 'Dental Assistant', email: 'emily@renewdental.com' },
  ],
};

// ─── Options ─────────────────────────────────────────────────────────────────

const DEPARTMENT_OPTIONS = [
  { label: '— (Cross-department)', value: '' },
  { label: 'Clinical', value: 'Clinical' },
  { label: 'Front Desk', value: 'Front Desk' },
  { label: 'Engineering', value: 'Engineering' },
  { label: 'HR', value: 'HR' },
  { label: 'Administration', value: 'Administration' },
  { label: 'Sterilization', value: 'Sterilization' },
  { label: 'All Departments', value: 'All Departments' },
];

const SHIFT_OPTIONS = [
  { label: '— (No shift)', value: '' },
  { label: 'Opening', value: 'opening' },
  { label: 'Closing', value: 'closing' },
  { label: 'Evening', value: 'evening' },
  { label: 'Full Day', value: 'full_day' },
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

const EMPTY_FORM: TeamFormData = {
  name: '',
  department: '',
  shift: '',
  description: '',
  is_active: true,
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const removeBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  borderRadius: border.radius.sm,
  backgroundColor: 'transparent',
  color: color.system.red,
  border: `1px solid ${color.system.red}`,
  cursor: 'pointer',
  fontSize: font.size.body.xs,
};

const emptyState: CSSProperties = {
  padding: '24px 0',
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  color: color.text.secondary,
  textAlign: 'center',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function EditTeamSheet({ isOpen, onClose, initialData, onSave }: EditTeamSheetProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<TeamFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [removedRoleIds, setRemovedRoleIds] = useState<Set<string>>(new Set());
  const [removedUserIds, setRemovedUserIds] = useState<Set<string>>(new Set());

  const isEdit = initialData !== null;

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ?? EMPTY_FORM);
      setActiveTab('details');
      setRemovedRoleIds(new Set());
      setRemovedUserIds(new Set());
    }
  }, [isOpen, initialData]);

  const teamName = isEdit ? (initialData?.name ?? '') : form.name;
  const allRoles = ROLES_BY_TEAM[teamName] ?? [];
  const allUsers = USERS_BY_TEAM[teamName] ?? [];
  const roles = allRoles.filter((r) => !removedRoleIds.has(r.id));
  const users = allUsers.filter((u) => !removedUserIds.has(u.id));

  const handleRemoveRole = (id: string, name: string) => {
    setRemovedRoleIds((prev) => new Set(prev).add(id));
    showToast({ title: 'Role removed', description: `${name} removed from this team.`, variant: 'info' });
  };

  const handleRemoveUser = (id: string, name: string) => {
    setRemovedUserIds((prev) => new Set(prev).add(id));
    showToast({ title: 'User removed', description: `${name} removed from this team.`, variant: 'info' });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));

    onSave(form);
    setSaving(false);
    showToast({
      title: isEdit ? 'Team updated' : 'Team created',
      description: isEdit ? `${form.name} has been updated.` : `${form.name} has been created.`,
      variant: 'success',
    });
    onClose();
  };

  // ─── Tab content ─────────────────────────────────────────────────────────

  const detailsContent = (
    <form id="edit-team-form" onSubmit={handleSave}>
      <div style={sheetBodyStyle}>
        <h3 style={sheetSectionTitle}>Team Details</h3>
        <div style={sheetFormGroup}>
          <TextInput
            label="Name"
            size="sm"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Morning Crew, Clinical A-Team"
            fullWidth
            required
          />
          <TextInput
            label="Description"
            size="sm"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="What this team is responsible for"
            fullWidth
          />
          <Select
            label="Department"
            size="sm"
            options={DEPARTMENT_OPTIONS}
            value={form.department}
            onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
            fullWidth
          />
          <Select
            label="Shift"
            size="sm"
            options={SHIFT_OPTIONS}
            value={form.shift}
            onChange={(e) => setForm((prev) => ({ ...prev, shift: e.target.value }))}
            fullWidth
          />
          <Select
            label="Status"
            size="sm"
            options={STATUS_OPTIONS}
            value={String(form.is_active)}
            onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value === 'true' }))}
            fullWidth
          />
        </div>
      </div>
    </form>
  );

  const rolesContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Roles</h3>
      {roles.length === 0 ? (
        <p style={emptyState}>No roles assigned to this team.</p>
      ) : (
        <Table size="default">
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Description</TableHead>
              <TableHead style={{ width: '50px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <span style={{ fontWeight: 500, color: color.text.primary }}>{r.name}</span>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: font.size.body.sm, color: color.text.secondary }}>{r.description}</span>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    style={removeBtn}
                    onClick={() => handleRemoveRole(r.id, r.name)}
                    aria-label={`Remove ${r.name} from team`}
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Hidden form so the save button still works from this tab */}
      <form id="edit-team-form" onSubmit={handleSave} style={{ display: 'none' }} />
    </div>
  );

  const usersContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Users</h3>
      {users.length === 0 ? (
        <p style={emptyState}>No users assigned to this team.</p>
      ) : (
        <Table size="default">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead style={{ width: '50px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <span style={{ fontWeight: 500, color: color.text.primary }}>{u.name}</span>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: font.size.body.sm, color: color.text.secondary }}>{u.role}</span>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: font.size.body.sm, color: color.text.secondary }}>{u.email}</span>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    style={removeBtn}
                    onClick={() => handleRemoveUser(u.id, u.name)}
                    aria-label={`Remove ${u.name} from team`}
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Hidden form so the save button still works from this tab */}
      <form id="edit-team-form" onSubmit={handleSave} style={{ display: 'none' }} />
    </div>
  );

  // ─── Build tabs (only in edit mode) ──────────────────────────────────────

  const sheetTabs: SheetTab[] | undefined = isEdit
    ? [
        { id: 'details', label: 'Details', content: detailsContent },
        { id: 'roles', label: 'Roles', content: rolesContent },
        { id: 'users', label: 'Users', content: usersContent },
      ]
    : undefined;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Team' : 'Add Team'}
      width="600px"
      side="right"
      tabs={sheetTabs}
      activeTab={isEdit ? activeTab : undefined}
      onTabChange={isEdit ? setActiveTab : undefined}
      footer={<>
        <button type="button" className="renew-btn renew-btn--ghost" onClick={onClose}>Cancel</button>
        <button type="submit" form="edit-team-form" className="renew-btn renew-btn--primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </>}
    >
      {/* children only used in add mode (no tabs) */}
      {!isEdit && detailsContent}
    </Sheet>
  );
}
