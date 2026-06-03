'use client';

import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Sheet, Button, TextInput, TextArea, Select } from '@brikdesigns/bds';
import { useToast } from '@/components/ToastProvider';
import { useRooms } from '@/hooks/useRooms';
import { useEquipment } from '@/hooks/useEquipment';
import { gap } from '@/lib/tokens';
import {
  sheetBodyStyle,
  sheetSectionTitle,
  sheetFormGroup,
} from '@/app/(auth)/settings/_sheetStyles';

// ─── Types ──────────────────────────────────────────────────────────────────

interface RequestFormData {
  title: string;
  description: string;
  category: string;
  urgency: string;
  room_id: string;
  equipment_id: string;
  location_description: string;
  vendor_id: string;
  vendor_contact_id: string;
}

interface VendorOption {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

interface VendorContactOption {
  id: string;
  name: string;
  role: string | null;
}

export interface RequestEditData {
  id: string;
  title: string;
  description: string | null;
  category: string;
  urgency: string;
  room_id: string | null;
  equipment_id: string | null;
  location_description: string | null;
  vendor_id: string | null;
  vendor_contact_id: string | null;
}

interface SubmitRequestSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  defaultCategory?: string;
  /** Pass existing request data to open in edit mode */
  initialData?: RequestEditData | null;
}

// ─── Options ────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { label: 'Select category', value: '' },
  { label: 'Device Issue', value: 'device_issue' },
  { label: 'Equipment Issue', value: 'equipment_issue' },
  { label: 'Facility / Maintenance', value: 'facility_maintenance' },
];

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

const EMPTY_FORM: RequestFormData = {
  title: '',
  description: '',
  category: '',
  urgency: 'medium',
  room_id: '',
  equipment_id: '',
  location_description: '',
  vendor_id: '',
  vendor_contact_id: '',
};

const formRowStyle: React.CSSProperties = { display: 'flex', gap: gap.lg, width: '100%' };
const formRowHalf: React.CSSProperties = { flex: 1, minWidth: 0 };

// ─── Component ──────────────────────────────────────────────────────────────

export function SubmitRequestSheet({ isOpen, onClose, onSaved, defaultCategory, initialData }: SubmitRequestSheetProps) {
  const { showToast } = useToast();
  const { rooms } = useRooms();
  const { equipment } = useEquipment();
  const [form, setForm] = useState<RequestFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [vendorContacts, setVendorContacts] = useState<VendorContactOption[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  const isEdit = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          title: initialData.title,
          description: initialData.description ?? '',
          category: initialData.category,
          urgency: initialData.urgency,
          room_id: initialData.room_id ?? '',
          equipment_id: initialData.equipment_id ?? '',
          location_description: initialData.location_description ?? '',
          vendor_id: initialData.vendor_id ?? '',
          vendor_contact_id: initialData.vendor_contact_id ?? '',
        });
      } else {
        setForm({ ...EMPTY_FORM, category: defaultCategory ?? '' });
      }
    }
    // `defaultCategory` is captured at sheet-open time only — re-running when
    // it changes would reset the user's category selection mid-edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData]);

  // Fetch vendors once
  useEffect(() => {
    fetch('/api/vendors')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setVendors(data); })
      .catch(err => console.error('[SubmitRequestSheet] failed to load vendors:', err));
  }, []);

  // Fetch contacts when vendor changes
  useEffect(() => {
    if (!form.vendor_id) { setVendorContacts([]); return; }
    setContactsLoading(true);
    fetch(`/api/vendors/${form.vendor_id}/contacts`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setVendorContacts(data); })
      .catch(err => console.error('[SubmitRequestSheet] failed to load contacts:', err))
      .finally(() => setContactsLoading(false));
  }, [form.vendor_id]);

  const showEquipment = form.category === 'device_issue' || form.category === 'equipment_issue';

  const roomOptions = useMemo(() => [
    { label: 'Select room', value: '' },
    ...rooms.filter(r => r.is_active).map(r => ({ label: r.name, value: r.id })),
  ], [rooms]);

  const equipmentOptions = useMemo(() => {
    const filtered = form.room_id
      ? equipment.filter(e => e.room_id === form.room_id || !e.room_id)
      : equipment;
    return [
      { label: 'Select equipment', value: '' },
      ...filtered.map(e => ({ label: e.name, value: e.id })),
    ];
  }, [equipment, form.room_id]);

  const vendorOptions = useMemo(() => [
    { label: 'Select vendor', value: '' },
    ...vendors.filter(v => v.is_active).map(v => ({ label: v.name, value: v.id })),
  ], [vendors]);

  const contactOptions = useMemo(() => [
    { label: contactsLoading ? 'Loading…' : 'Select contact', value: '' },
    ...vendorContacts.map(c => ({ label: c.role ? `${c.name} (${c.role})` : c.name, value: c.id })),
  ], [vendorContacts, contactsLoading]);

  const updateText = (field: keyof RequestFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const updateSelect = (field: keyof RequestFormData) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = { ...form, [field]: e.target.value };
    if (field === 'room_id') next.equipment_id = '';
    if (field === 'category' && e.target.value === 'facility_maintenance') next.equipment_id = '';
    if (field === 'vendor_id') next.vendor_contact_id = '';
    setForm(next);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.category) return;

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      urgency: form.urgency,
      room_id: form.room_id || null,
      equipment_id: form.equipment_id || null,
      location_description: form.location_description.trim() || null,
      vendor_id: form.vendor_id || null,
      vendor_contact_id: form.vendor_contact_id || null,
    };

    try {
      const url = isEdit && initialData ? `/api/requests/${initialData.id}` : '/api/requests';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `Failed to ${isEdit ? 'update' : 'submit'} request`);
      }

      showToast({
        title: isEdit ? 'Request updated' : 'Request submitted',
        description: isEdit
          ? `${form.title} has been updated.`
          : `${form.title} has been submitted for review.`,
        variant: 'success',
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      showToast({ title: 'Error', description: err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'submit'}`, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = !!form.title.trim() && !!form.category;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Request' : 'Submit Request'}
      width="600px"
      side="right"
      closeOnBackdrop={false}
      footer={<>
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" type="submit" form="submit-request-form" disabled={saving || !canSubmit}>
          {saving ? (isEdit ? 'Saving...' : 'Submitting...') : (isEdit ? 'Save Changes' : 'Submit Request')}
        </Button>
      </>}
    >
      <form id="submit-request-form" onSubmit={handleSubmit}>
        <div style={sheetBodyStyle}>
          <h3 style={sheetSectionTitle}>Issue Details</h3>
          <div style={sheetFormGroup}>
            <TextInput label="Title" size="sm" value={form.title} onChange={updateText('title')} placeholder="Brief description of the issue" fullWidth required />
            <div style={formRowStyle}>
              <div style={formRowHalf}>
                <Select label="Category" size="sm" options={CATEGORY_OPTIONS} value={form.category} onChange={updateSelect('category')} fullWidth required disabled={!!defaultCategory} />
              </div>
              <div style={formRowHalf}>
                <Select label="Priority" size="sm" options={PRIORITY_OPTIONS} value={form.urgency} onChange={updateSelect('urgency')} fullWidth />
              </div>
            </div>
            <TextArea label="Description" size="sm" value={form.description} onChange={updateText('description')} placeholder="Describe the issue in detail — what happened, when it started, any error messages" rows={4} fullWidth />
          </div>

          <h3 style={sheetSectionTitle}>Location & Equipment</h3>
          <div style={sheetFormGroup}>
            <div style={formRowStyle}>
              <div style={formRowHalf}>
                <Select label="Room" size="sm" options={roomOptions} value={form.room_id} onChange={updateSelect('room_id')} fullWidth />
              </div>
              {showEquipment && (
                <div style={formRowHalf}>
                  <Select label="Equipment" size="sm" options={equipmentOptions} value={form.equipment_id} onChange={updateSelect('equipment_id')} fullWidth />
                </div>
              )}
            </div>
            <TextInput label="Location Details" size="sm" value={form.location_description} onChange={updateText('location_description')} placeholder="e.g. Front desk printer, Operatory 3 chair" fullWidth />
          </div>

          <h3 style={sheetSectionTitle}>Vendor & Contact</h3>
          <div style={sheetFormGroup}>
            <div style={formRowStyle}>
              <div style={formRowHalf}>
                <Select label="Vendor" size="sm" options={vendorOptions} value={form.vendor_id} onChange={updateSelect('vendor_id')} fullWidth />
              </div>
              {form.vendor_id && (
                <div style={formRowHalf}>
                  <Select label="Contact" size="sm" options={contactOptions} value={form.vendor_contact_id} onChange={updateSelect('vendor_contact_id')} fullWidth disabled={contactsLoading} />
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </Sheet>
  );
}
