'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Sheet, Button, TextInput, Select } from '@bds/components';
import { useToast } from '@/components/ToastProvider';
import { useMembers } from '@/hooks/useMembers';
import { gap } from '@/lib/tokens';
import {
  sheetBodyStyle,
  sheetSectionTitle,
  sheetFormGroup,
} from '@/app/(auth)/settings/_sheetStyles';

// ─── Types ──────────────────────────────────────────────────────────────────

interface EventFormData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  eventType: string;
  assignedTo: string;
}

interface AddEventSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Pre-fill date/time from calendar click */
  prefill?: { date?: string; startTime?: string; endTime?: string };
}

// ─── Options ────────────────────────────────────────────────────────────────

const EVENT_TYPE_OPTIONS = [
  { label: 'General', value: 'general' },
  { label: 'Training', value: 'training' },
  { label: 'Meeting', value: 'meeting' },
  { label: 'Shift', value: 'shift' },
  { label: 'Time Off', value: 'time_off' },
  { label: 'Holiday', value: 'holiday' },
  { label: 'Other', value: 'other' },
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const EMPTY_FORM: EventFormData = {
  title: '',
  description: '',
  date: todayStr(),
  startTime: '09:00',
  endTime: '10:00',
  eventType: 'general',
  assignedTo: '',
};

// ─── Component ──────────────────────────────────────────────────────────────

export function AddEventSheet({ isOpen, onClose, onSaved, prefill }: AddEventSheetProps) {
  const { showToast } = useToast();
  const { members } = useMembers();
  const [form, setForm] = useState<EventFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const staffOptions = members
    .filter(m => m.is_active)
    .map(m => ({ label: `${m.first_name} ${m.last_name}`, value: m.id }));

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...EMPTY_FORM,
        date: prefill?.date ?? todayStr(),
        startTime: prefill?.startTime ?? '09:00',
        endTime: prefill?.endTime ?? '10:00',
      });
    }
  }, [isOpen, prefill]);

  const updateText = (field: keyof EventFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSaving(true);
    try {
      const start = `${form.date}T${form.startTime}:00`;
      const end = `${form.date}T${form.endTime}:00`;

      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          start,
          end,
          eventType: form.eventType,
          assignedTo: form.assignedTo || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to create event');
      }

      showToast({
        title: 'Event created',
        description: `${form.title} has been added to the schedule.`,
        variant: 'success',
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create event',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Add Event"
      width="600px"
      side="right"
      footer={<>
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" type="submit" form="add-event-form" disabled={saving}>
          {saving ? 'Saving...' : 'Add Event'}
        </Button>
      </>}
    >
      <form id="add-event-form" onSubmit={handleSave}>
        <div style={sheetBodyStyle}>
          <h3 style={sheetSectionTitle}>Event Details</h3>
          <div style={sheetFormGroup}>
            <TextInput
              label="Title"
              size="sm"
              value={form.title}
              onChange={updateText('title')}
              placeholder="e.g. Staff Meeting, OSHA Training"
              fullWidth
              required
            />
            <TextInput
              label="Description"
              size="sm"
              value={form.description}
              onChange={updateText('description')}
              placeholder="Optional notes"
              fullWidth
            />
            <Select
              label="Event Type"
              size="sm"
              options={EVENT_TYPE_OPTIONS}
              value={form.eventType}
              onChange={(e) => setForm(prev => ({ ...prev, eventType: e.target.value }))}
              fullWidth
            />
          </div>

          <h3 style={sheetSectionTitle}>Schedule</h3>
          <div style={sheetFormGroup}>
            <TextInput
              label="Date"
              size="sm"
              type="date"
              value={form.date}
              onChange={updateText('date')}
              fullWidth
              required
            />
            <div style={{ display: 'flex', gap: gap.lg }}>
              <TextInput
                label="Start Time"
                size="sm"
                type="time"
                value={form.startTime}
                onChange={updateText('startTime')}
                fullWidth
                required
              />
              <TextInput
                label="End Time"
                size="sm"
                type="time"
                value={form.endTime}
                onChange={updateText('endTime')}
                fullWidth
                required
              />
            </div>
          </div>

          <h3 style={sheetSectionTitle}>Assignment</h3>
          <div style={sheetFormGroup}>
            <Select
              label="Assign To"
              size="sm"
              options={[{ label: 'Unassigned', value: '' }, ...staffOptions]}
              value={form.assignedTo}
              onChange={(e) => setForm(prev => ({ ...prev, assignedTo: e.target.value }))}
              fullWidth
            />
          </div>
        </div>
      </form>
    </Sheet>
  );
}
