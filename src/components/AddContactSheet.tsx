'use client';

import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Sheet, Button, TextInput, Select, Switch } from '@bds/components';
import { useToast } from '@/components/ToastProvider';
import { gap } from '@/lib/tokens';
import {
  sheetBodyStyle,
  sheetSectionTitle,
  sheetFormGroup,
} from '@/app/(auth)/settings/_sheetStyles';

// ─── Types ──────────────────────────────────────────────────────────────────

interface VendorOption {
  id: string;
  name: string;
  type: string;
}

export interface ContactFormData {
  vendor_id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  is_primary: boolean;
}

export interface ContactEditData {
  id: string;
  vendor_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
}

interface AddContactSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (contact: ContactFormData & { id: string; vendor_name: string; vendor_type: string | null }) => void;
  /** When provided, the sheet opens in edit mode */
  initialData?: ContactEditData | null;
}

const EMPTY_FORM: ContactFormData = {
  vendor_id: '',
  name: '',
  role: '',
  phone: '',
  email: '',
  is_primary: false,
};

const formRowStyle: React.CSSProperties = { display: 'flex', gap: gap.lg, width: '100%' };
const formRowHalf: React.CSSProperties = { flex: 1, minWidth: 0 };

// ─── Component ──────────────────────────────────────────────────────────────

export function AddContactSheet({ isOpen, onClose, onSaved, initialData }: AddContactSheetProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<ContactFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen && initialData) {
      setForm({
        vendor_id: initialData.vendor_id,
        name: initialData.name,
        role: initialData.role ?? '',
        phone: initialData.phone ?? '',
        email: initialData.email ?? '',
        is_primary: initialData.is_primary,
      });
    } else if (isOpen) {
      setForm(EMPTY_FORM);
    }
  }, [isOpen]);

  useEffect(() => {
    fetch('/api/vendors')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setVendors(data); })
      .catch(err => console.error('[AddContactSheet] failed to load vendors:', err));
  }, []);

  const vendorOptions = useMemo(() => [
    { label: 'Select company', value: '' },
    ...vendors.map(v => ({ label: v.name, value: v.id })),
  ], [vendors]);

  const updateText = (field: keyof ContactFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.vendor_id) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        role: form.role.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        is_primary: form.is_primary,
      };

      const url = isEditing
        ? `/api/contacts/${initialData.id}`
        : `/api/vendors/${form.vendor_id}/contacts`;
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `Failed to ${isEditing ? 'update' : 'add'} contact`);
      }

      const saved = await res.json();
      const vendor = vendors.find(v => v.id === form.vendor_id);

      showToast({
        title: isEditing ? 'Contact updated' : 'Contact added',
        description: `${form.name.trim()} has been ${isEditing ? 'updated' : 'added'}.`,
        variant: 'success',
      });
      onSaved({
        ...form,
        id: saved.id ?? initialData?.id ?? '',
        vendor_name: saved.vendor_name ?? vendor?.name ?? '',
        vendor_type: saved.vendor_type ?? vendor?.type ?? null,
      });
      onClose();
    } catch (err: unknown) {
      showToast({ title: 'Error', description: err instanceof Error ? err.message : `Failed to ${isEditing ? 'update' : 'add'} contact`, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const canSave = !!form.name.trim() && !!form.vendor_id;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit ${initialData.name}` : 'Add Contact'}
      width="600px"
      side="right"
      footer={<>
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" type="submit" form="add-contact-form" disabled={saving || !canSave}>
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Contact'}
        </Button>
      </>}
    >
      <form id="add-contact-form" onSubmit={handleSubmit}>
        <div style={sheetBodyStyle}>
          <h3 style={sheetSectionTitle}>Contact Information</h3>
          <div style={sheetFormGroup}>
            <TextInput label="Name" size="sm" value={form.name} onChange={updateText('name')} placeholder="Contact name" fullWidth required />
            <Select
              label="Company"
              size="sm"
              options={vendorOptions}
              value={form.vendor_id}
              onChange={(e) => setForm(prev => ({ ...prev, vendor_id: e.target.value }))}
              fullWidth
              required
            />
            <TextInput label="Role" size="sm" value={form.role} onChange={updateText('role')} placeholder="e.g. Account Rep, Sales Manager" fullWidth />
          </div>

          <h3 style={sheetSectionTitle}>Contact Details</h3>
          <div style={sheetFormGroup}>
            <div style={formRowStyle}>
              <div style={formRowHalf}>
                <TextInput label="Phone" size="sm" value={form.phone} onChange={updateText('phone')} placeholder="Phone number" fullWidth />
              </div>
              <div style={formRowHalf}>
                <TextInput label="Email" size="sm" value={form.email} onChange={updateText('email')} placeholder="Email address" fullWidth />
              </div>
            </div>
            <Switch
              label="Primary Contact"
              size="sm"
              checked={form.is_primary}
              onChange={(e) => setForm(prev => ({ ...prev, is_primary: e.target.checked }))}
            />
          </div>
        </div>
      </form>
    </Sheet>
  );
}
