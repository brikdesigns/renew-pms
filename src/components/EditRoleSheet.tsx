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
import { font, color, space, border } from '@/lib/tokens';
import { useDepartments } from '@/hooks/useDepartments';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RoleFormData {
  name: string;
  department_id: string | null;
  description: string;
  is_active: boolean;
}

interface EditRoleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: RoleFormData | null;
  onSave: (data: RoleFormData) => void | Promise<void>;
}

// ─── Options ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

const EMPTY_FORM: RoleFormData = {
  name: '',
  department_id: null,
  description: '',
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

export function EditRoleSheet({ isOpen, onClose, initialData, onSave }: EditRoleSheetProps) {
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

  const placeholderContent = (
    <div style={sheetBodyStyle}>
      <p style={emptyState}>Members in this role will appear here once users are wired.</p>
      <form id="edit-role-form" onSubmit={handleSave} style={{ display: 'none' }} />
    </div>
  );

  // ─── Build tabs (only in edit mode) ──────────────────────────────────────

  const sheetTabs: SheetTab[] | undefined = isEdit
    ? [
        { id: 'details', label: 'Details', content: detailsContent },
        { id: 'users', label: 'Users', content: placeholderContent },
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
