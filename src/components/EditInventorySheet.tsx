'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Sheet, TextInput, Select } from '@bds/components';
import { useToast } from '@/components/ToastProvider';
import {
  sheetBodyStyle,
  sheetSectionTitle,
  sheetFormGroup,
} from '@/app/(auth)/settings/_sheetStyles';
import { ROOM_OPTIONS } from '@/lib/seed-rooms';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InventoryFormData {
  name: string;
  status: string;
  department: string;
  description: string;
  type: string;
  company: string;
  team: string;
  room: string;
}

interface EditInventorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: InventoryFormData | null;
  onSave: (data: InventoryFormData) => void;
}

// ─── Options ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: 'Active', value: 'Active' },
  { label: 'Renew Review', value: 'Renew Review' },
  { label: 'Need to Cancel/Replace', value: 'Need to Cancel/Replace' },
];

const TYPE_OPTIONS = [
  { label: 'Clinical Equipment', value: 'Clinical Equipment' },
  { label: 'Facility Equipment', value: 'Facility Equipment' },
  { label: 'Software', value: 'Software' },
];

const DEPARTMENT_OPTIONS = [
  { label: 'Clinical', value: 'Clinical' },
  { label: 'Front Desk', value: 'Front Desk' },
  { label: 'Business Admin', value: 'Business Admin' },
  { label: 'Everyone', value: 'Everyone' },
  { label: 'Management', value: 'Management' },
];

const EMPTY_FORM: InventoryFormData = {
  name: '',
  status: 'Active',
  department: 'Clinical',
  description: '',
  type: 'Clinical Equipment',
  company: '',
  team: '',
  room: '',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function EditInventorySheet({ isOpen, onClose, initialData, onSave }: EditInventorySheetProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<InventoryFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

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

    // TODO: Wire to Supabase insert/update on equipment table
    await new Promise((r) => setTimeout(r, 500));

    onSave(form);
    setSaving(false);
    showToast({
      title: isEdit ? 'Item updated' : 'Item added',
      description: isEdit
        ? `${form.name} has been updated.`
        : `${form.name} has been added to inventory.`,
      variant: 'success',
    });
    onClose();
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Inventory Item' : 'Add Inventory Item'}
      width="600px"
      side="right"
      footer={<>
        <button type="button" className="renew-btn renew-btn--ghost" onClick={onClose}>Cancel</button>
        <button type="submit" form="edit-inventory-form" className="renew-btn renew-btn--primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
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
              options={DEPARTMENT_OPTIONS}
              value={form.department}
              onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
              fullWidth
            />
            <TextInput
              label="Description"
              size="sm"
              value={form.description}
              onChange={updateText('description')}
              placeholder="Notes about this item (optional)"
              fullWidth
            />
            <TextInput
              label="Third-Party Company"
              size="sm"
              value={form.company}
              onChange={updateText('company')}
              placeholder="e.g. Planmeca, Henry Schein"
              fullWidth
            />
            <TextInput
              label="Team"
              size="sm"
              value={form.team}
              onChange={updateText('team')}
              placeholder="e.g. Hygiene, Lab"
              fullWidth
            />
            <Select
              label="Room"
              size="sm"
              options={ROOM_OPTIONS}
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
