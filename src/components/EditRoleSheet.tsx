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

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RoleFormData {
  name: string;
  department: string;
  description: string;
  is_active: boolean;
}

interface EditRoleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: RoleFormData | null;
  onSave: (data: RoleFormData) => void;
}

// ─── Mock associated data ────────────────────────────────────────────────────

interface AssociatedUser {
  id: string;
  name: string;
  email: string;
}

interface AssociatedDepartment {
  id: string;
  name: string;
}

const USERS_BY_ROLE: Record<string, AssociatedUser[]> = {
  Owner: [
    { id: '1', name: 'Sarah Mitchell', email: 'sarah@renewdental.com' },
  ],
  'Office Manager': [
    { id: '2', name: 'Jessica Torres', email: 'jessica@renewdental.com' },
  ],
  'Dental Hygienist': [
    { id: '3', name: 'Amanda Chen', email: 'amanda@renewdental.com' },
    { id: '4', name: 'Marcus Williams', email: 'marcus@renewdental.com' },
  ],
  'Dental Assistant': [
    { id: '5', name: 'Emily Rivera', email: 'emily@renewdental.com' },
    { id: '6', name: 'Tyler Nguyen', email: 'tyler@renewdental.com' },
  ],
  Receptionist: [
    { id: '7', name: 'Rachel Foster', email: 'rachel@renewdental.com' },
  ],
  'Treatment Coordinator': [
    { id: '8', name: 'David Park', email: 'david@renewdental.com' },
  ],
  'Insurance Coordinator': [
    { id: '9', name: 'Lisa Gomez', email: 'lisa@renewdental.com' },
  ],
  'Inventory Manager': [
    { id: '10', name: 'Jordan Hayes', email: 'jordan@renewdental.com' },
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
  Engineer: [{ id: '3', name: 'Engineering' }],
  'Inventory Manager': [{ id: '3', name: 'Engineering' }],
  Manager: [{ id: '7', name: 'All Departments' }],
  Admin: [{ id: '7', name: 'All Departments' }],
  Staff: [{ id: '7', name: 'All Departments' }],
};

// ─── Options ─────────────────────────────────────────────────────────────────

const DEPARTMENT_OPTIONS = [
  { label: 'Clinical', value: 'Clinical' },
  { label: 'Front Desk', value: 'Front Desk' },
  { label: 'Engineering', value: 'Engineering' },
  { label: 'HR', value: 'HR' },
  { label: 'Administration', value: 'Administration' },
  { label: 'Sterilization', value: 'Sterilization' },
  { label: 'All Departments', value: 'All Departments' },
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

const EMPTY_FORM: RoleFormData = {
  name: '',
  department: 'Clinical',
  description: '',
  is_active: true,
};

// ─── Tokens ──────────────────────────────────────────────────────────────────

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_SECONDARY = 'var(--text-secondary)';

// ─── Styles ──────────────────────────────────────────────────────────────────

const removeBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  borderRadius: 'var(--border-radius-sm)',
  backgroundColor: 'transparent',
  color: 'var(--color-system-red)',
  border: '1px solid var(--color-system-red)',
  cursor: 'pointer',
  fontSize: '12px',
};

const emptyState: CSSProperties = {
  padding: '24px 0',
  fontFamily: 'var(--font-family-body)',
  fontSize: 'var(--body-sm)',
  color: TEXT_SECONDARY,
  textAlign: 'center',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function EditRoleSheet({ isOpen, onClose, initialData, onSave }: EditRoleSheetProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<RoleFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [removedUserIds, setRemovedUserIds] = useState<Set<string>>(new Set());
  const [removedDeptIds, setRemovedDeptIds] = useState<Set<string>>(new Set());

  const isEdit = initialData !== null;

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ?? EMPTY_FORM);
      setActiveTab('details');
      setRemovedUserIds(new Set());
      setRemovedDeptIds(new Set());
    }
  }, [isOpen, initialData]);

  const roleName = isEdit ? (initialData?.name ?? '') : form.name;
  const allUsers = USERS_BY_ROLE[roleName] ?? [];
  const allDepts = DEPARTMENTS_BY_ROLE[roleName] ?? [];
  const users = allUsers.filter((u) => !removedUserIds.has(u.id));
  const departments = allDepts.filter((d) => !removedDeptIds.has(d.id));

  const handleRemoveUser = (id: string, name: string) => {
    setRemovedUserIds((prev) => new Set(prev).add(id));
    showToast({ title: 'User removed', description: `${name} removed from this role.`, variant: 'info' });
  };

  const handleRemoveDept = (id: string, name: string) => {
    setRemovedDeptIds((prev) => new Set(prev).add(id));
    showToast({ title: 'Department removed', description: `${name} removed from this role.`, variant: 'info' });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));

    onSave(form);
    setSaving(false);
    showToast({
      title: isEdit ? 'Role updated' : 'Role created',
      description: isEdit ? `${form.name} has been updated.` : `${form.name} has been created.`,
      variant: 'success',
    });
    onClose();
  };

  // ─── Tab content ─────────────────────────────────────────────────────────

  const detailsContent = (
    <form id="edit-role-form" onSubmit={handleSave}>
      <div style={sheetBodyStyle}>
        <h3 style={sheetSectionTitle}>Role Details</h3>
        <div style={sheetFormGroup}>
          <TextInput
            label="Name"
            size="sm"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Dental Hygienist, Office Manager"
            fullWidth
            required
          />
          <Select
            label="Department"
            size="sm"
            options={DEPARTMENT_OPTIONS}
            value={form.department}
            onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
            fullWidth
          />
          <TextInput
            label="Description"
            size="sm"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of this role's responsibilities"
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

  const usersContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Users</h3>
      {users.length === 0 ? (
        <p style={emptyState}>No users assigned to this role.</p>
      ) : (
        <Table size="default">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead style={{ width: '50px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <span style={{ fontWeight: 500, color: TEXT_PRIMARY }}>{u.name}</span>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: 'var(--body-sm)', color: TEXT_SECONDARY }}>{u.email}</span>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    style={removeBtn}
                    onClick={() => handleRemoveUser(u.id, u.name)}
                    aria-label={`Remove ${u.name} from role`}
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
      <form id="edit-role-form" onSubmit={handleSave} style={{ display: 'none' }} />
    </div>
  );

  const departmentsContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Departments</h3>
      {departments.length === 0 ? (
        <p style={emptyState}>No departments assigned to this role.</p>
      ) : (
        <Table size="default">
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead style={{ width: '50px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <span style={{ fontWeight: 500, color: TEXT_PRIMARY }}>{d.name}</span>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    style={removeBtn}
                    onClick={() => handleRemoveDept(d.id, d.name)}
                    aria-label={`Remove ${d.name} from role`}
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
      <form id="edit-role-form" onSubmit={handleSave} style={{ display: 'none' }} />
    </div>
  );

  // ─── Build tabs (only in edit mode) ──────────────────────────────────────

  const sheetTabs: SheetTab[] | undefined = isEdit
    ? [
        { id: 'details', label: 'Details', content: detailsContent },
        { id: 'users', label: 'Users', content: usersContent },
        { id: 'departments', label: 'Departments', content: departmentsContent },
      ]
    : undefined;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Role' : 'Add Role'}
      width="600px"
      side="right"
      tabs={sheetTabs}
      activeTab={isEdit ? activeTab : undefined}
      onTabChange={isEdit ? setActiveTab : undefined}
      footer={<>
        <button type="button" className="renew-btn renew-btn--ghost" onClick={onClose}>Cancel</button>
        <button type="submit" form="edit-role-form" className="renew-btn renew-btn--primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </>}
    >
      {/* children only used in add mode (no tabs) */}
      {!isEdit && detailsContent}
    </Sheet>
  );
}
