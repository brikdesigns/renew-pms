'use client';

import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Sheet, Button, TextInput, Select } from '@brikdesigns/bds';
import { useToast } from '@/components/ToastProvider';
import {
  sheetBodyStyle,
  sheetSectionTitle,
  sheetFormGroup,
} from '@/app/(auth)/settings/_sheetStyles';
import { useRooms } from '@/hooks/useRooms';
import { useDepartments } from '@/hooks/useDepartments';
import { useTeams } from '@/hooks/useTeams';
import { useVendors } from '@/hooks/useVendors';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InventoryFormData {
  name: string;
  status: string;
  department: string;
  department_id: string;
  description: string;
  type: string;
  company: string;
  vendor_id: string;
  team: string;
  team_id: string;
  room: string;
}

interface EditInventorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: InventoryFormData | null;
  onSave: (data: InventoryFormData) => void | Promise<void>;
}

// ─── Options ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Needs Service', value: 'needs_service' },
  { label: 'Out of Service', value: 'out_of_service' },
];

const TYPE_OPTIONS = [
  { label: 'Clinical Equipment', value: 'Clinical Equipment' },
  { label: 'Facility Equipment', value: 'Facility Equipment' },
  { label: 'Software', value: 'Software' },
];

const EMPTY_FORM: InventoryFormData = {
  name: '',
  status: 'active',
  department: '',
  department_id: '',
  description: '',
  type: 'Clinical Equipment',
  company: '',
  vendor_id: '',
  team: '',
  team_id: '',
  room: '',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function EditInventorySheet({ isOpen, onClose, initialData, onSave }: EditInventorySheetProps) {
  const { showToast } = useToast();
  const { rooms } = useRooms();
  const { departments } = useDepartments();
  const { teams } = useTeams();
  const { vendors } = useVendors();

  const [form, setForm] = useState<InventoryFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const roomOptions = [{ label: 'Select room', value: '' }, ...rooms.filter((r) => r.is_active).map((r) => ({ label: r.name, value: r.id }))];

  const departmentOptions = useMemo(() => [
    { label: 'Select department', value: '' },
    ...departments.filter((d) => d.is_active && d.name !== '(G) All Departments').map((d) => ({ label: d.name, value: d.id })),
  ], [departments]);

  /** Teams filtered by selected department */
  const teamOptions = useMemo(() => {
    const filtered = form.department_id
      ? teams.filter((t) => t.is_active && t.department_id === form.department_id)
      : teams.filter((t) => t.is_active);
    return [
      { label: 'Select team', value: '' },
      ...filtered.map((t) => ({ label: t.name, value: t.id })),
    ];
  }, [teams, form.department_id]);

  const vendorOptions = useMemo(() => [
    { label: 'Select vendor', value: '' },
    ...vendors.filter((v) => v.is_active).map((v) => ({ label: v.name, value: v.id })),
  ], [vendors]);

  const isEdit = initialData !== null;

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ?? EMPTY_FORM);
    }
  }, [isOpen, initialData]);

  const updateText = (field: keyof InventoryFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    try {
      await onSave(form);
      showToast({
        title: isEdit ? 'Item updated' : 'Item added',
        description: isEdit
          ? `${form.name} has been updated.`
          : `${form.name} has been added to inventory.`,
        variant: 'success',
      });
      onClose();
    } catch (err) {
      showToast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to save', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Inventory Item' : 'Add Inventory Item'}
      width="600px"
      side="right"
      closeOnBackdrop={false}
      footer={<>
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" type="submit" form="edit-inventory-form" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </>}
    >
      <form id="edit-inventory-form" onSubmit={handleSave}>
        <div style={sheetBodyStyle}>
          <h3 style={sheetSectionTitle}>Item Details</h3>
          <div style={sheetFormGroup}>
            <TextInput
              label="Name"
              size="sm"
              value={form.name}
              onChange={updateText('name')}
              placeholder="e.g. Planmeca Promax 3D"
              fullWidth
              required
            />
            <Select
              label="Type"
              size="sm"
              options={TYPE_OPTIONS}
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              fullWidth
            />
            <Select
              label="Status"
              size="sm"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              fullWidth
            />
            <Select
              label="Department"
              size="sm"
              options={departmentOptions}
              value={form.department_id}
              onChange={(e) => {
                const deptId = e.target.value;
                const dept = departments.find((d) => d.id === deptId);
                setForm((prev) => ({ ...prev, department_id: deptId, department: dept?.name ?? '', team_id: '', team: '' }));
              }}
              fullWidth
            />
            <Select
              label="Team"
              size="sm"
              options={teamOptions}
              value={form.team_id}
              onChange={(e) => {
                const teamId = e.target.value;
                const team = teams.find((t) => t.id === teamId);
                setForm((prev) => ({ ...prev, team_id: teamId, team: team?.name ?? '' }));
              }}
              fullWidth
              disabled={!form.department_id}
            />
            <TextInput
              label="Description"
              size="sm"
              value={form.description}
              onChange={updateText('description')}
              placeholder="Notes about this item (optional)"
              fullWidth
            />
            <Select
              label="Vendor"
              size="sm"
              options={vendorOptions}
              value={form.vendor_id}
              onChange={(e) => {
                const vid = e.target.value;
                const vendor = vendors.find((v) => v.id === vid);
                setForm((prev) => ({ ...prev, vendor_id: vid, company: vendor?.name ?? '' }));
              }}
              fullWidth
            />
            <Select
              label="Room"
              size="sm"
              options={roomOptions}
              value={form.room}
              onChange={(e) => setForm((prev) => ({ ...prev, room: e.target.value }))}
              fullWidth
            />
          </div>
        </div>
      </form>
    </Sheet>
  );
}
