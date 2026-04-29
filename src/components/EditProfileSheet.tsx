'use client';

import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { gap } from '@/lib/tokens';
import { useDepartments } from '@/hooks/useDepartments';
import { useRoles } from '@/hooks/useRoles';
import { Sheet, Button, TextInput, Select } from '@brikdesigns/bds';
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
  practice_role_id: string;
  department: string;
  team: string;
  organization: string;
  start_date: string;
  employee_type: string;
  shift: string;
  /** Read-only on this surface — only admins can edit via /settings/users. */
  office_days: string[];
}

interface EditProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ProfileFormData;
  memberId: string | null;
  isAdmin: boolean;
  onSaved?: (updated: ProfileFormData) => void;
}

// ─── Options ─────────────────────────────────────────────────────────────────

const SYSTEM_ROLE_OPTIONS = [
  { label: 'Staff', value: 'staff' },
  { label: 'Practice Admin', value: 'admin' },
  { label: 'Platform Admin', value: 'brik_admin' },
];


const EMPLOYEE_TYPE_OPTIONS = [
  { label: 'Select type', value: '' },
  { label: 'New', value: 'new' },
  { label: 'Maturing', value: 'maturing' },
  { label: 'Proficient', value: 'proficient' },
];

const SHIFT_OPTIONS = [
  { label: 'Select shift', value: '' },
  { label: 'Opening', value: 'opening' },
  { label: 'Closing', value: 'closing' },
  { label: 'Evening', value: 'evening' },
  { label: 'Full Day', value: 'full_day' },
];

const formRowStyle: React.CSSProperties = { display: 'flex', gap: gap.lg, width: '100%' };
const formRowHalf: React.CSSProperties = { flex: 1, minWidth: 0 };

// ─── Component ───────────────────────────────────────────────────────────────

export function EditProfileSheet({ isOpen, onClose, initialData, memberId, isAdmin, onSaved }: EditProfileSheetProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<ProfileFormData>(initialData);
  const [saving, setSaving] = useState(false);

  const { departments } = useDepartments();
  const { roles } = useRoles();

  const practiceRoleOptions = useMemo(() => [
    { label: 'Select role', value: '' },
    ...roles.filter((r) => r.is_active).map((r) => ({ label: r.name, value: r.id })),
  ], [roles]);

  const departmentOptions = useMemo(() => [
    { label: 'Select department', value: '' },
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
    if (!memberId) {
      showToast({ title: 'Error', description: 'No membership found — cannot save.', variant: 'error' });
      return;
    }
    setSaving(true);

    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone || null,
          system_role: form.system_role,
          practice_role_id: form.practice_role_id || null,
          employee_type: form.employee_type || 'new',
          shift: form.shift || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to save');
      }

      const updated = await res.json();
      // Map API response back to ProfileFormData shape
      const updatedProfile: ProfileFormData = {
        ...form,
        first_name: updated.first_name ?? form.first_name,
        last_name: updated.last_name ?? form.last_name,
        phone: updated.phone ?? '',
        system_role: updated.system_role ?? form.system_role,
        practice_role: updated.practice_role ?? '',
        practice_role_id: updated.practice_role_id ?? '',
        department: updated.department ?? '',
        employee_type: updated.employee_type ?? '',
        shift: updated.shift ?? '',
        office_days: updated.office_days ?? form.office_days,
      };

      onSaved?.(updatedProfile);
      showToast({ title: 'Profile updated', description: 'Your changes have been saved.', variant: 'success' });
      onClose();
    } catch (err: unknown) {
      showToast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to save', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen} onClose={onClose} title="Edit Profile" width="600px" side="right"
      footer={<>
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" type="submit" form="edit-profile-form" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
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
                  value={form.practice_role_id}
                  onChange={updateSelect('practice_role_id')}
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
                <Select
                  label="Team"
                  size="sm"
                  options={[{ label: 'Select team', value: '' }]}
                  value={form.team}
                  onChange={updateSelect('team')}
                  fullWidth
                  disabled
                />
              </div>
            </div>
            <TextInput
              label="Start Date"
              size="sm"
              type="date"
              value={form.start_date}
              onChange={updateText('start_date')}
              fullWidth
              disabled={!isAdmin}
            />
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
