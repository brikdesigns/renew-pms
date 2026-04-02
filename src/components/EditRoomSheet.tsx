'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Sheet, TextInput, Select } from '@bds/components';
import { useToast } from '@/components/ToastProvider';
import {
  sheetBodyStyle,
  sheetSectionTitle,
  sheetFormGroup,
} from '@/app/(auth)/settings/_sheetStyles';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RoomFormData {
  name: string;
  room_type: string;
  is_active: boolean;
  description: string;
}

interface EditRoomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** null = Add mode, object = Edit mode */
  initialData: RoomFormData | null;
  onSave: (data: RoomFormData) => void;
}

// ─── Options ─────────────────────────────────────────────────────────────────

const ROOM_TYPE_OPTIONS = [
  { label: 'Lobby', value: 'lobby' },
  { label: 'Front Office', value: 'front_office' },
  { label: 'Waiting Area', value: 'waiting_area' },
  { label: 'Operatory', value: 'operatory' },
  { label: 'Sterilization Room', value: 'sterilization_room' },
  { label: 'X-Ray Room', value: 'xray_room' },
  { label: 'Lab', value: 'lab' },
  { label: 'Consultation Room', value: 'consultation_room' },
  { label: 'Supply / Storage', value: 'supply_storage' },
  { label: 'Break Room', value: 'break_room' },
  { label: 'Restroom', value: 'restroom' },
  { label: 'Other', value: 'other' },
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

const EMPTY_FORM: RoomFormData = {
  name: '',
  room_type: 'other',
  is_active: true,
  description: '',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function EditRoomSheet({ isOpen, onClose, initialData, onSave }: EditRoomSheetProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<RoomFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const isEdit = initialData !== null;

  // Reset form when sheet opens
  useEffect(() => {
    if (isOpen) {
      setForm(initialData ?? EMPTY_FORM);
    }
  }, [isOpen, initialData]);

  const updateText = (field: keyof RoomFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);

    // TODO: Wire to Supabase insert/update on rooms table
    await new Promise((r) => setTimeout(r, 500));

    onSave(form);
    setSaving(false);
    showToast({
      title: isEdit ? 'Room updated' : 'Room added',
      description: isEdit
        ? `${form.name} has been updated.`
        : `${form.name} has been added to the office.`,
      variant: 'success',
    });
    onClose();
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Room' : 'Add Room'}
      width="600px"
      side="right"
    
      footer={<>
        <button type="button" className="renew-btn renew-btn--ghost" onClick={onClose}>Cancel</button>
        <button type="submit" form="edit-room-form" className="renew-btn renew-btn--primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </>}
    >
      <form id="edit-room-form" onSubmit={handleSave}>
        <div style={sheetBodyStyle}>
          {/* Room Details */}
          <h3 style={sheetSectionTitle}>Room Details</h3>
          <div style={sheetFormGroup}>
            <TextInput
              label="Name"
              size="sm"
              value={form.name}
              onChange={updateText('name')}
              placeholder="e.g. Operatory 1, Break Room"
              fullWidth
              required
            />
            <Select
              label="Room Type"
              size="sm"
              options={ROOM_TYPE_OPTIONS}
              value={form.room_type}
              onChange={(e) => setForm((prev) => ({ ...prev, room_type: e.target.value }))}
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
            <TextInput
              label="Description"
              size="sm"
              value={form.description}
              onChange={updateText('description')}
              placeholder="Notes about this room (optional)"
              fullWidth
            />
          </div>
        </div>
      </form>
    </Sheet>
  );
}
