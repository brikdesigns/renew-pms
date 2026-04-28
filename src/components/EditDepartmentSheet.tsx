'use client';

import { useState, useEffect, type FormEvent, type CSSProperties } from 'react';
import {
  Sheet, Button, TextInput, Select,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@brikdesigns/bds';
import type { SheetTab } from '@brikdesigns/bds';
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
  initialData: DepartmentFormData & { id?: string } | null;
  onSave: (data: DepartmentFormData) => void | Promise<void>;
  /** All practice roles — filtered to this dept inside the component */
  roles: Role[];
  /** All practice members — filtered to this dept inside the component */
  members: Member[];
}

// ─── Options ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

const COLOR_OPTIONS = [
  { label: 'Select color', value: '' },
  { label: 'Blue', value: 'blue' },
  { label: 'Green', value: 'green' },
  { label: 'Red', value: 'red' },
  { label: 'Purple', value: 'purple' },
  { label: 'Gold', value: 'gold' },
  { label: 'Taupe', value: 'taupe' },
  { label: 'Brown', value: 'brown' },
];

const EMPTY_FORM: DepartmentFormData = {
  name: '',
  color: '',
  is_active: true,
};

// ─── Tokens ──────────────────────────────────────────────────────────────────

import { font, color, space } from '@/lib/tokens';
import type { Role } from '@/hooks/useRoles';
import type { Member } from '@/hooks/useMembers';

const TEXT_PRIMARY = color.text.primary;
const TEXT_SECONDARY = color.text.secondary;

// ─── Styles ──────────────────────────────────────────────────────────────────

const emptyState: CSSProperties = {
  padding: `${space.lg} 0`,
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  color: TEXT_SECONDARY,
  textAlign: 'center',
};

// TODO(bds-migration): body-cell bg is a local patch. Promote to BDS Table.css
// (.bds-table-cell { background-color: var(--background-primary) }) once the
// in-flight BDS session is reconciled, then remove this.
const bodyCellStyle: CSSProperties = { backgroundColor: color.background.primary };

// ─── Component ───────────────────────────────────────────────────────────────

export function EditDepartmentSheet({ isOpen, onClose, initialData, onSave, roles: allRoles, members: allMembers }: EditDepartmentSheetProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<DepartmentFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const isEdit = initialData !== null;

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ?? EMPTY_FORM);
      setActiveTab('details');
    }
  }, [isOpen, initialData]);

  // Filter real data to this department by ID; fall back to empty when adding new
  const deptId = initialData?.id ?? '';
  const roles = allRoles.filter((r) => r.department_id === deptId);
  const users = allMembers.filter((m) => m.department_id === deptId);

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((r) => (
              <TableRow key={r.id}>
                <TableCell style={bodyCellStyle}>
                  <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: TEXT_PRIMARY }}>{r.name}</span>
                </TableCell>
                <TableCell style={bodyCellStyle}>
                  <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: TEXT_SECONDARY }}>{r.description}</span>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const fullName = `${u.first_name} ${u.last_name}`.trim();
              return (
                <TableRow key={u.id}>
                  <TableCell style={bodyCellStyle}>
                    <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: TEXT_PRIMARY }}>{fullName}</span>
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: TEXT_SECONDARY }}>{u.practice_role}</span>
                  </TableCell>
                </TableRow>
              );
            })}
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
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" type="submit" form="edit-dept-form" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </>}
    >
      {/* children only used in add mode (no tabs) */}
      {!isEdit && detailsContent}
    </Sheet>
  );
}
