'use client';

import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { gap } from '@/lib/tokens';
import { useDepartments } from '@/hooks/useDepartments';
import { useRoles } from '@/hooks/useRoles';
import { Sheet, TextInput, Select } from '@bds/components';
import { useToast } from '@/components/ToastProvider';
import {
  sheetBodyStyle,
  sheetSectionTitle,
  sheetFormGroup,
} from '@/app/(auth)/settings/_sheetStyles';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  system_role: string;
  practice_role: string;
  department: string;
  team: string;
  organization: string;
  start_date: string;
  employee_type: string;
  shift: string;
}

interface EditProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ProfileFormData;
  isAdmin: boolean;
}

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
  { label: 'Maintenance', value: 'Maintenance' },
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

const formRowStyle: React.CSSProperties = { display: 'flex', gap: gap.lg, width: '100%' };
const formRowHalf: React.CSSProperties = { flex: 1, minWidth: 0 };

// ─── Component ───────────────────────────────────────────────────────────────

export function EditProfileSheet({ isOpen, onClose, initialData, isAdmin }: EditProfileSheetProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<ProfileFormData>(initialData);
  const [saving, setSaving] = useState(false);

  const { departments } = useDepartments();
  const { roles } = useRoles();

  const practiceRoleOptions = useMemo(() => [
    { label: '— (Unassigned)', value: '' },
    ...roles.filter((r) => r.is_active).map((r) => ({ label: r.name, value: r.name })),
  ], [roles]);

  const departmentOptions = useMemo(() => [
    { label: '— (Unassigned)', value: '' },
    ...departments.filter((d) => d.is_active).map((d) => ({ label: d.name, value: d.name })),
  ], [departments]);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData);
    }
  }, [isOpen, initialData]);

  const updateText = (field: keyof ProfileFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const updateSelect = (field: keyof ProfileFormData) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // TODO: Wire to Supabase update
    await new Promise((r) => setTimeout(r, 600));

    setSaving(false);
    showToast({ title: 'Profile updated', description: 'Your changes have been saved.', variant: 'success' });
    onClose();
  };

  return (
    <Sheet
      isOpen={isOpen} onClose={onClose} title="Edit Profile" width="600px" side="right"
      footer={<>
        <button type="button" className="renew-btn renew-btn--ghost" onClick={onClose}>Cancel</button>
        <button type="submit" form="edit-profile-form" className="renew-btn renew-btn--primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </>}
    >
      <form id="edit-profile-form" onSubmit={handleSave}>
        <div style={sheetBodyStyle}>
          {/* Contact Information — always editable */}
          <h3 style={sheetSectionTitle}>Contact Information</h3>
          <div style={sheetFormGroup}>
            <div style={formRowStyle}>
              <div style={formRowHalf}>
                <TextInput
                  label="First Name"
                  size="sm"
                  value={form.first_name}
                  onChange={updateText('first_name')}
                  placeholder="Enter first name"
                  fullWidth
                />
              </div>
              <div style={formRowHalf}>
                <TextInput
                  label="Last Name"
                  size="sm"
                  value={form.last_name}
                  onChange={updateText('last_name')}
                  placeholder="Enter last name"
                  fullWidth
                />
              </div>
            </div>
            <TextInput
              label="Email"
              size="sm"
              type="email"
              value={form.email}
              onChange={updateText('email')}
              placeholder="Enter email address"
              fullWidth
              helperText="Changing your email will require re-verification"
            />
            <TextInput
              label="Phone"
              size="sm"
              type="tel"
              value={form.phone}
              onChange={updateText('phone')}
              placeholder="Enter phone number"
              fullWidth
            />
          </div>

          {/* User Information — read-only for non-admins */}
          <h3 style={sheetSectionTitle}>User Information</h3>
          <div style={sheetFormGroup}>
            <div style={formRowStyle}>
              <div style={formRowHalf}>
                <Select
                  label="System Role"
                  size="sm"
                  options={SYSTEM_ROLE_OPTIONS}
                  value={form.system_role}
                  onChange={updateSelect('system_role')}
                  fullWidth
                  disabled={!isAdmin}
                />
              </div>
              <div style={formRowHalf}>
                <Select
                  label="Practice Role"
                  size="sm"
                  options={practiceRoleOptions}
                  value={form.practice_role}
                  onChange={updateSelect('practice_role')}
                  fullWidth
                  disabled={!isAdmin}
                />
              </div>
            </div>
            <div style={formRowStyle}>
              <div style={formRowHalf}>
                <Select
                  label="Department"
                  size="sm"
                  options={departmentOptions}
                  value={form.department}
                  onChange={updateSelect('department')}
                  fullWidth
                  disabled={!isAdmin}
                />
              </div>
              <div style={formRowHalf}>
                <TextInput
                  label="Team"
                  size="sm"
                  value={form.team}
                  onChange={updateText('team')}
                  placeholder="Team name"
                  fullWidth
                  disabled={!isAdmin}
                />
              </div>
            </div>
            <div style={formRowStyle}>
              <div style={formRowHalf}>
                <TextInput
                  label="Organization"
                  size="sm"
                  value={form.organization}
                  onChange={updateText('organization')}
                  placeholder="Organization name"
                  fullWidth
                  disabled={!isAdmin}
                />
              </div>
              <div style={formRowHalf}>
                <TextInput
                  label="Start Date"
                  size="sm"
                  value={form.start_date}
                  onChange={updateText('start_date')}
                  placeholder="YYYY-MM-DD"
                  fullWidth
                  disabled={!isAdmin}
                />
              </div>
            </div>
          </div>

          {/* Status — read-only for non-admins */}
          <h3 style={sheetSectionTitle}>Status</h3>
          <div style={sheetFormGroup}>
            <div style={formRowStyle}>
              <div style={formRowHalf}>
                <Select
                  label="Employee Type"
                  size="sm"
                  options={EMPLOYEE_TYPE_OPTIONS}
                  value={form.employee_type}
                  onChange={updateSelect('employee_type')}
                  fullWidth
                  disabled={!isAdmin}
                />
              </div>
              <div style={formRowHalf}>
                <Select
                  label="Shift"
                  size="sm"
                  options={SHIFT_OPTIONS}
                  value={form.shift}
                  onChange={updateSelect('shift')}
                  fullWidth
                  disabled={!isAdmin}
                />
              </div>
            </div>
          </div>
        </div>

      </form>
    </Sheet>
  );
}
