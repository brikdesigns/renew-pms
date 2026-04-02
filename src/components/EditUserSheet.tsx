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

export interface UserFormData {
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
}

interface EditUserSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: UserFormData | null;
  onSave: (data: UserFormData) => void;
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

// ─── Options ─────────────────────────────────────────────────────────────────

const SYSTEM_ROLE_OPTIONS = [
  { label: 'Staff', value: 'staff' },
  { label: 'Practice Admin', value: 'practice_admin' },
  { label: 'Platform Admin', value: 'platform_admin' },
];

const PRACTICE_ROLE_OPTIONS = [
  { label: '— (Unassigned)', value: '' },
  { label: 'Owner', value: 'Owner' },
  { label: 'Office Manager', value: 'Office Manager' },
  { label: 'Dental Hygienist', value: 'Dental Hygienist' },
  { label: 'Dental Assistant', value: 'Dental Assistant' },
  { label: 'Receptionist', value: 'Receptionist' },
  { label: 'Treatment Coordinator', value: 'Treatment Coordinator' },
  { label: 'Insurance Coordinator', value: 'Insurance Coordinator' },
  { label: 'Engineer', value: 'Engineer' },
  { label: 'Inventory Manager', value: 'Inventory Manager' },
  { label: 'Manager', value: 'Manager' },
  { label: 'Admin', value: 'Admin' },
  { label: 'Staff', value: 'Staff' },
];

const DEPARTMENT_OPTIONS = [
  { label: '— (Unassigned)', value: '' },
  { label: 'Clinical', value: 'Clinical' },
  { label: 'Front Desk', value: 'Front Desk' },
  { label: 'Engineering', value: 'Engineering' },
  { label: 'HR', value: 'HR' },
  { label: 'Administration', value: 'Administration' },
  { label: 'Sterilization', value: 'Sterilization' },
  { label: 'All Departments', value: 'All Departments' },
];

const EMPLOYEE_TYPE_OPTIONS = [
  { label: 'New', value: 'new' },
  { label: 'Maturing', value: 'maturing' },
  { label: 'Active', value: 'active' },
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

const EMPTY_FORM: UserFormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  system_role: 'staff',
  practice_role: '',
  department: '',
  employee_type: 'new',
  shift: '',
  is_active: true,
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const formRowStyle: CSSProperties = { display: 'flex', gap: '16px', width: '100%' };
const formRowHalf: CSSProperties = { flex: 1, minWidth: 0 };

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

export function EditUserSheet({ isOpen, onClose, initialData, onSave }: EditUserSheetProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<UserFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [removedRoleIds, setRemovedRoleIds] = useState<Set<string>>(new Set());
  const [removedDeptIds, setRemovedDeptIds] = useState<Set<string>>(new Set());

  const isEdit = initialData !== null;

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ?? EMPTY_FORM);
      setActiveTab('details');
      setRemovedRoleIds(new Set());
      setRemovedDeptIds(new Set());
    }
  }, [isOpen, initialData]);

  const updateText = (field: keyof UserFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const updateSelect = (field: keyof UserFormData) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.email.trim()) return;

    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));

    onSave(form);
    setSaving(false);
    const name = `${form.first_name} ${form.last_name}`.trim();
    showToast({
      title: isEdit ? 'User updated' : 'User invited',
      description: isEdit ? `${name} has been updated.` : `${name} has been invited.`,
      variant: 'success',
    });
    onClose();
  };

  // ─── Associated data (edit mode only) ───────────────────────────────────

  const userName = isEdit ? `${initialData?.first_name ?? ''} ${initialData?.last_name ?? ''}`.trim() : '';
  const allRoles = ROLES_BY_USER[userName] ?? [];
  const allDepts = DEPARTMENTS_BY_USER[userName] ?? [];
  const roles = allRoles.filter((r) => !removedRoleIds.has(r.id));
  const departments = allDepts.filter((d) => !removedDeptIds.has(d.id));

  const handleRemoveRole = (id: string, name: string) => {
    setRemovedRoleIds((prev) => new Set(prev).add(id));
    showToast({ title: 'Role removed', description: `${name} removed from this user.`, variant: 'info' });
  };

  const handleRemoveDept = (id: string, name: string) => {
    setRemovedDeptIds((prev) => new Set(prev).add(id));
    showToast({ title: 'Department removed', description: `${name} removed from this user.`, variant: 'info' });
  };

  // ─── Tab content ────────────────────────────────────────────────────────

  const detailsContent = (
    <form id="edit-user-form" onSubmit={handleSave}>
      <div style={sheetBodyStyle}>
        {/* Personal Info */}
        <h3 style={sheetSectionTitle}>Personal Information</h3>
        <div style={sheetFormGroup}>
          <div style={formRowStyle}>
            <div style={formRowHalf}>
              <TextInput label="First Name" size="sm" value={form.first_name} onChange={updateText('first_name')} placeholder="First name" fullWidth required />
            </div>
            <div style={formRowHalf}>
              <TextInput label="Last Name" size="sm" value={form.last_name} onChange={updateText('last_name')} placeholder="Last name" fullWidth />
            </div>
          </div>
          <div style={formRowStyle}>
            <div style={formRowHalf}>
              <TextInput label="Email" size="sm" type="email" value={form.email} onChange={updateText('email')} placeholder="user@practice.com" fullWidth required />
            </div>
            <div style={formRowHalf}>
              <TextInput label="Phone" size="sm" type="tel" value={form.phone} onChange={updateText('phone')} placeholder="(XXX) XXX-XXXX" fullWidth />
            </div>
          </div>
        </div>

        {/* Role & Assignment */}
        <h3 style={sheetSectionTitle}>Role & Assignment</h3>
        <div style={sheetFormGroup}>
          <div style={formRowStyle}>
            <div style={formRowHalf}>
              <Select label="System Role" size="sm" options={SYSTEM_ROLE_OPTIONS} value={form.system_role} onChange={updateSelect('system_role')} fullWidth />
            </div>
            <div style={formRowHalf}>
              <Select label="Practice Role" size="sm" options={PRACTICE_ROLE_OPTIONS} value={form.practice_role} onChange={updateSelect('practice_role')} fullWidth />
            </div>
          </div>
          <div style={formRowStyle}>
            <div style={formRowHalf}>
              <Select label="Department" size="sm" options={DEPARTMENT_OPTIONS} value={form.department} onChange={updateSelect('department')} fullWidth />
            </div>
            <div style={formRowHalf}>
              <Select label="Shift" size="sm" options={SHIFT_OPTIONS} value={form.shift} onChange={updateSelect('shift')} fullWidth />
            </div>
          </div>
        </div>

        {/* Status */}
        <h3 style={sheetSectionTitle}>Status</h3>
        <div style={sheetFormGroup}>
          <div style={formRowStyle}>
            <div style={formRowHalf}>
              <Select label="Employee Type" size="sm" options={EMPLOYEE_TYPE_OPTIONS} value={form.employee_type} onChange={updateSelect('employee_type')} fullWidth />
            </div>
            <div style={formRowHalf}>
              <Select label="Account Status" size="sm" options={STATUS_OPTIONS} value={String(form.is_active)} onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value === 'true' }))} fullWidth />
            </div>
          </div>
        </div>
      </div>
    </form>
  );

  const rolesContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Roles</h3>
      {roles.length === 0 ? (
        <p style={emptyState}>No roles assigned to this user.</p>
      ) : (
        <Table size="default">
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead style={{ width: '50px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <span style={{ fontWeight: 500, color: color.text.primary }}>{r.role}</span>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: font.size.body.sm, color: color.text.secondary }}>{r.department}</span>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    style={removeBtn}
                    onClick={() => handleRemoveRole(r.id, r.role)}
                    aria-label={`Remove ${r.role} from user`}
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
      <form id="edit-user-form" onSubmit={handleSave} style={{ display: 'none' }} />
    </div>
  );

  const departmentsContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Departments</h3>
      {departments.length === 0 ? (
        <p style={emptyState}>No departments assigned to this user.</p>
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
                  <span style={{ fontWeight: 500, color: color.text.primary }}>{d.department}</span>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    style={removeBtn}
                    onClick={() => handleRemoveDept(d.id, d.department)}
                    aria-label={`Remove ${d.department} from user`}
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
      <form id="edit-user-form" onSubmit={handleSave} style={{ display: 'none' }} />
    </div>
  );

  // ─── Build tabs (only in edit mode) ──────────────────────────────────────

  const sheetTabs: SheetTab[] | undefined = isEdit
    ? [
        { id: 'details', label: 'Details', content: detailsContent },
        { id: 'roles', label: 'Roles', content: rolesContent },
        { id: 'departments', label: 'Departments', content: departmentsContent },
      ]
    : undefined;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit User' : 'Invite User'}
      width="600px"
      side="right"
      tabs={sheetTabs}
      activeTab={isEdit ? activeTab : undefined}
      onTabChange={isEdit ? setActiveTab : undefined}
      footer={<>
        <button type="button" className="renew-btn renew-btn--ghost" onClick={onClose}>Cancel</button>
        <button type="submit" form="edit-user-form" className="renew-btn renew-btn--primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </>}
    >
      {/* children only used in add mode (no tabs) */}
      {!isEdit && detailsContent}
    </Sheet>
  );
}
