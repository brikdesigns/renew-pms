'use client';

import { useState, useEffect, type FormEvent, type CSSProperties } from 'react';
import {
  Sheet, TextInput, Select,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bds/components';
import type { SheetTab } from '@bds/components';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { useToast } from '@/components/ToastProvider';
import {
  sheetBodyStyle,
  sheetSectionTitle,
  sheetFormGroup,
} from '@/app/(auth)/settings/_sheetStyles';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DepartmentFormData {
  name: string;
  color: string;
  is_active: boolean;
}

interface EditDepartmentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: DepartmentFormData | null;
  onSave: (data: DepartmentFormData) => void | Promise<void>;
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

// ─── Options ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

const COLOR_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'Blue', value: 'blue' },
  { label: 'Green', value: 'green' },
  { label: 'Red', value: 'red' },
  { label: 'Purple', value: 'purple' },
  { label: 'Gold', value: 'gold' },
  { label: 'Teal', value: 'teal' },
  { label: 'Pink', value: 'pink' },
];

const EMPTY_FORM: DepartmentFormData = {
  name: '',
  color: '',
  is_active: true,
};

// ─── Tokens ──────────────────────────────────────────────────────────────────

import { font, color, gap, space, border } from '@/lib/tokens';

const TEXT_PRIMARY = color.text.primary;
const TEXT_SECONDARY = color.text.secondary;

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
  padding: `${space.lg} 0`,
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  color: TEXT_SECONDARY,
  textAlign: 'center',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function EditDepartmentSheet({ isOpen, onClose, initialData, onSave }: EditDepartmentSheetProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<DepartmentFormData>(EMPTY_FORM);
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

  const deptName = isEdit ? (initialData?.name ?? '') : form.name;
  const allRoles = ROLES_BY_DEPT[deptName] ?? [];
  const allUsers = USERS_BY_DEPT[deptName] ?? [];
  const roles = allRoles.filter((r) => !removedRoleIds.has(r.id));
  const users = allUsers.filter((u) => !removedUserIds.has(u.id));

  const handleRemoveRole = (id: string, name: string) => {
    setRemovedRoleIds((prev) => new Set(prev).add(id));
    showToast({ title: 'Role removed', description: `${name} removed from this department.`, variant: 'info' });
  };

  const handleRemoveUser = (id: string, name: string) => {
    setRemovedUserIds((prev) => new Set(prev).add(id));
    showToast({ title: 'User removed', description: `${name} removed from this department.`, variant: 'info' });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    await onSave(form);
    setSaving(false);
    showToast({
      title: isEdit ? 'Department updated' : 'Department created',
      description: isEdit
        ? `${form.name} has been updated.`
        : `${form.name} has been created.`,
      variant: 'success',
    });
    onClose();
  };

  // ─── Tab content ─────────────────────────────────────────────────────────

  const detailsContent = (
    <form id="edit-dept-form" onSubmit={handleSave}>
      <div style={sheetBodyStyle}>
        <h3 style={sheetSectionTitle}>Department Details</h3>
        <div style={sheetFormGroup}>
          <TextInput
            label="Name"
            size="sm"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Clinical, Front Desk"
            fullWidth
            required
          />
          <Select
            label="Color Tag"
            size="sm"
            options={COLOR_OPTIONS}
            value={form.color}
            onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
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
        <p style={emptyState}>No roles assigned to this department.</p>
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
                  <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: TEXT_PRIMARY }}>{r.name}</span>
                </TableCell>
                <TableCell>
                  <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: TEXT_SECONDARY }}>{r.description}</span>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    style={removeBtn}
                    onClick={() => handleRemoveRole(r.id, r.name)}
                    aria-label={`Remove ${r.name} from department`}
                  >
                    <Icon icon={icon.close} />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Hidden form so the save button still works from this tab */}
      <form id="edit-dept-form" onSubmit={handleSave} style={{ display: 'none' }} />
    </div>
  );

  const usersContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Users</h3>
      {users.length === 0 ? (
        <p style={emptyState}>No users assigned to this department.</p>
      ) : (
        <Table size="default">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead style={{ width: '50px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: TEXT_PRIMARY }}>{u.name}</span>
                </TableCell>
                <TableCell>
                  <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: TEXT_SECONDARY }}>{u.role}</span>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    style={removeBtn}
                    onClick={() => handleRemoveUser(u.id, u.name)}
                    aria-label={`Remove ${u.name} from department`}
                  >
                    <Icon icon={icon.close} />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Hidden form so the save button still works from this tab */}
      <form id="edit-dept-form" onSubmit={handleSave} style={{ display: 'none' }} />
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
      title={isEdit ? 'Edit Department' : 'Add Department'}
      width="600px"
      side="right"
      tabs={sheetTabs}
      activeTab={isEdit ? activeTab : undefined}
      onTabChange={isEdit ? setActiveTab : undefined}
      footer={<>
        <button type="button" className="renew-btn renew-btn--ghost" onClick={onClose}>Cancel</button>
        <button type="submit" form="edit-dept-form" className="renew-btn renew-btn--primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </>}
    >
      {/* children only used in add mode (no tabs) */}
      {!isEdit && detailsContent}
    </Sheet>
  );
}
