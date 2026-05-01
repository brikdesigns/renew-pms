'use client';

import { useState, useEffect, useMemo, type FormEvent, type CSSProperties } from 'react';
import {
  Sheet, Button, TextInput, Select,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  SheetSection, EmptyState, SheetFieldLabel,
} from '@brikdesigns/bds';
import type { SheetTab } from '@brikdesigns/bds';
import { useToast } from '@/components/ToastProvider';
import { font, color, gap } from '@/lib/tokens';
import { useDepartments } from '@/hooks/useDepartments';
import { useRoles } from '@/hooks/useRoles';
import { DaysOfWeekPicker } from '@/components/DaysOfWeekPicker';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  system_role: string;
  practice_role_id: string | null;
  practice_role: string;
  department: string;
  employee_type: string;
  shift: string;
  office_days: string[];
  is_active: boolean;
}

interface EditUserSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: UserFormData | null;
  onSave: (data: UserFormData) => void | Promise<void>;
}

// ─── Options ─────────────────────────────────────────────────────────────────

const SYSTEM_ROLE_OPTIONS = [
  { label: 'Staff', value: 'staff' },
  { label: 'Practice Admin', value: 'admin' },
  { label: 'Platform Admin', value: 'brik_admin' },
];

const EMPLOYEE_TYPE_OPTIONS = [
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
  practice_role_id: null,
  practice_role: '',
  department: '',
  employee_type: 'new',
  shift: '',
  office_days: [],
  is_active: true,
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const formRowStyle: CSSProperties = { display: 'flex', gap: gap.lg, width: '100%' };
const formRowHalf: CSSProperties = { flex: 1, minWidth: 0 };

const dayPickerGroupStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: gap.sm };

// TODO(bds-migration): body-cell bg is a local patch. Promote to BDS Table.css
// (.bds-table-cell { background-color: var(--background-primary) }) once the
// in-flight BDS session is reconciled, then remove this.
const bodyCellStyle: CSSProperties = { backgroundColor: color.background.primary };

// ─── Component ───────────────────────────────────────────────────────────────

export function EditUserSheet({ isOpen, onClose, initialData, onSave }: EditUserSheetProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<UserFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const { departments } = useDepartments();
  const { roles } = useRoles();

  const practiceRoleOptions = useMemo(() => [
    { label: 'Select role', value: '' },
    ...roles.filter((r) => r.is_active).map((r) => ({ label: r.name, value: r.id })),
  ], [roles]);

  // Department is derived from the selected practice role, not independently editable
  const selectedRoleDepartment = useMemo(() => {
    if (!form.practice_role_id) return '';
    const role = roles.find((r) => r.id === form.practice_role_id);
    return role?.department ?? '';
  }, [form.practice_role_id, roles]);

  const departmentOptions = useMemo(() => [
    { label: 'Select department', value: '' },
    ...departments.filter((d) => d.is_active).map((d) => ({ label: d.name, value: d.name })),
  ], [departments]);

  const isEdit = initialData !== null;

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ?? EMPTY_FORM);
      setActiveTab('details');
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
    try {
      await onSave(form);
      const name = `${form.first_name} ${form.last_name}`.trim();
      showToast({
        title: isEdit ? 'User updated' : 'User invited',
        description: isEdit ? `${name} has been updated.` : `${name} has been invited.`,
        variant: 'success',
      });
      onClose();
    } catch {
      // Error toast is shown by the caller — just reset saving state
    } finally {
      setSaving(false);
    }
  };

  // ─── Associated data (edit mode only) ───────────────────────────────────

  // Current role/dept derived from initialData (single assignment per member)
  const assocRole = initialData?.practice_role
    ? { id: initialData.practice_role_id ?? 'role', role: initialData.practice_role, department: initialData.department }
    : null;
  const assocDept = initialData?.department
    ? { id: initialData.practice_role_id ?? 'dept', department: initialData.department }
    : null;

  // ─── Tab content ────────────────────────────────────────────────────────

  const detailsContent = (
    <form id="edit-user-form" onSubmit={handleSave}>
      <SheetSection heading="Personal Information">
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
            <TextInput label="Email" size="sm" type="email" value={form.email} onChange={updateText('email')} placeholder="user@practice.com" fullWidth required disabled={isEdit} />
          </div>
          <div style={formRowHalf}>
            <TextInput label="Phone" size="sm" type="tel" value={form.phone} onChange={updateText('phone')} placeholder="(XXX) XXX-XXXX" fullWidth />
          </div>
        </div>
      </SheetSection>

      <SheetSection heading="Role & Assignment">
        <div style={formRowStyle}>
          <div style={formRowHalf}>
            <Select label="System Role" size="sm" options={SYSTEM_ROLE_OPTIONS} value={form.system_role} onChange={updateSelect('system_role')} fullWidth />
          </div>
          <div style={formRowHalf}>
            <Select label="Practice Role" size="sm" options={practiceRoleOptions} value={form.practice_role_id ?? ''} onChange={(e) => {
              const roleId = e.target.value || null;
              const role = roles.find((r) => r.id === roleId);
              setForm((prev) => ({ ...prev, practice_role_id: roleId, department: role?.department ?? '' }));
            }} fullWidth />
          </div>
        </div>
        <div style={formRowStyle}>
          <div style={formRowHalf}>
            <Select label="Department" size="sm" options={departmentOptions} value={selectedRoleDepartment} disabled fullWidth />
          </div>
          <div style={formRowHalf}>
            <Select label="Shift" size="sm" options={SHIFT_OPTIONS} value={form.shift} onChange={updateSelect('shift')} fullWidth />
          </div>
        </div>
        <div style={dayPickerGroupStyle}>
          <SheetFieldLabel>Days in Office</SheetFieldLabel>
          <DaysOfWeekPicker
            value={form.office_days}
            onChange={(days) => setForm((prev) => ({ ...prev, office_days: days }))}
          />
        </div>
      </SheetSection>

      <SheetSection heading="Status">
        <div style={formRowStyle}>
          <div style={formRowHalf}>
            <Select label="Employee Type" size="sm" options={EMPLOYEE_TYPE_OPTIONS} value={form.employee_type} onChange={updateSelect('employee_type')} fullWidth />
          </div>
          <div style={formRowHalf}>
            <Select label="Account Status" size="sm" options={STATUS_OPTIONS} value={String(form.is_active)} onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value === 'true' }))} fullWidth />
          </div>
        </div>
      </SheetSection>
    </form>
  );

  const rolesContent = (
    <SheetSection heading="Roles">
      {!assocRole ? (
        <EmptyState title="No role" description="No role assigned to this user." />
      ) : (
        <Table size="default">
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow key={assocRole.id}>
              <TableCell style={bodyCellStyle}>
                <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: color.text.primary }}>{assocRole.role}</span>
              </TableCell>
              <TableCell style={bodyCellStyle}>
                <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary }}>{assocRole.department}</span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}

      {/* Hidden form so the save button still works from this tab */}
      <form id="edit-user-form" onSubmit={handleSave} style={{ display: 'none' }} />
    </SheetSection>
  );

  const departmentsContent = (
    <SheetSection heading="Departments">
      {!assocDept ? (
        <EmptyState title="No department" description="No department assigned to this user." />
      ) : (
        <Table size="default">
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow key={assocDept.id}>
              <TableCell style={bodyCellStyle}>
                <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: color.text.primary }}>{assocDept.department}</span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}

      {/* Hidden form so the save button still works from this tab */}
      <form id="edit-user-form" onSubmit={handleSave} style={{ display: 'none' }} />
    </SheetSection>
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
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" type="submit" form="edit-user-form" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </>}
    >
      {/* children only used in add mode (no tabs) */}
      {!isEdit && detailsContent}
    </Sheet>
  );
}
