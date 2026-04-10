'use client';

import { useState, useEffect, useMemo, type FormEvent, type CSSProperties } from 'react';
import {
  Sheet, Button, TextInput, Select,
} from '@bds/components';
import type { SheetTab } from '@bds/components';
import { useToast } from '@/components/ToastProvider';
import {
  sheetBodyStyle,
  sheetSectionTitle,
  sheetFormGroup,
} from '@/app/(auth)/settings/_sheetStyles';
import { font, color, space } from '@/lib/tokens';
import { departmentColor } from '@/lib/tokens';
import { useDepartments } from '@/hooks/useDepartments';
import { ProfileCard, profileCardGrid } from '@/components/ProfileCard';
import type { Member } from '@/hooks/useMembers';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RoleFormData {
  name: string;
  department_id: string | null;
  description: string;
  default_system_role: string;
  is_active: boolean;
}

interface EditRoleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: (RoleFormData & { id?: string }) | null;
  onSave: (data: RoleFormData) => void | Promise<void>;
  members?: Member[];
}

// ─── Options ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

const DEFAULT_SYSTEM_ROLE_OPTIONS = [
  { label: 'Staff', value: 'staff' },
  { label: 'Manager', value: 'manager' },
  { label: 'Practice Admin', value: 'admin' },
];

const EMPTY_FORM: RoleFormData = {
  name: '',
  department_id: null,
  description: '',
  default_system_role: 'staff',
  is_active: true,
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const emptyState: CSSProperties = {
  padding: `${space.lg} 0`,
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  color: color.text.secondary,
  textAlign: 'center',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function EditRoleSheet({ isOpen, onClose, initialData, onSave, members: allMembers = [] }: EditRoleSheetProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<RoleFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const { departments } = useDepartments();
  const departmentOptions = useMemo(() => [
    { label: 'None', value: '' },
    ...departments.filter((d) => d.is_active).map((d) => ({ label: d.name, value: d.id })),
  ], [departments]);

  const isEdit = initialData !== null;

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ?? EMPTY_FORM);
      setActiveTab('details');
    }
  }, [isOpen, initialData]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    await onSave({ ...form, department_id: form.department_id || null });
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
            options={departmentOptions}
            value={form.department_id ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, department_id: e.target.value || null }))}
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
            label="Default Permission Level"
            size="sm"
            options={DEFAULT_SYSTEM_ROLE_OPTIONS}
            value={form.default_system_role}
            onChange={(e) => setForm((prev) => ({ ...prev, default_system_role: e.target.value }))}
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

  const roleId = initialData?.id ?? '';
  const users = allMembers.filter((m) => m.practice_role_id === roleId);

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
              role={form.name}
              department={u.department}
              departmentBg={departmentColor(u.department_color).light}
              departmentText={departmentColor(u.department_color).text}
            />
          ))}
        </div>
      )}
      <form id="edit-role-form" onSubmit={handleSave} style={{ display: 'none' }} />
    </div>
  );

  // ─── Build tabs (only in edit mode) ──────────────────────────────────────

  const sheetTabs: SheetTab[] | undefined = isEdit
    ? [
        { id: 'details', label: 'Details', content: detailsContent },
        { id: 'users', label: 'Users', content: usersContent },
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
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" type="submit" form="edit-role-form" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </>}
    >
      {!isEdit && detailsContent}
    </Sheet>
  );
}
