'use client';

import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Sheet, Button, TextInput, TextArea, Select, Tag, IconButton } from '@brikdesigns/bds';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { useToast } from '@/components/ToastProvider';
import { useEquipment } from '@/hooks/useEquipment';
import {
  sheetBodyStyle,
  sheetSectionTitle,
  sheetFormGroup,
} from '@/app/(auth)/settings/_sheetStyles';
import { gap, color } from '@/lib/tokens';
import type { Vendor } from '@/app/(auth)/settings/contacts/ContactsTable';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VendorFormData {
  name: string;
  type: string;
  phone: string;
  email: string;
  website_url: string;
  address: string;
  notes: string;
  is_active: boolean;
  equipment_ids: string[];
}

const TYPE_OPTIONS = [
  { label: 'Select type', value: '' },
  { label: 'Equipment', value: 'equipment' },
  { label: 'Software', value: 'software' },
  { label: 'Service', value: 'service' },
  { label: 'Lab', value: 'lab' },
  { label: 'Referring Practice', value: 'referring_practice' },
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const EMPTY_FORM: VendorFormData = {
  name: '', type: '', phone: '', email: '',
  website_url: '', address: '', notes: '', is_active: true,
  equipment_ids: [],
};

const formRowStyle: React.CSSProperties = { display: 'flex', gap: gap.lg, width: '100%' };
const formRowHalf: React.CSSProperties = { flex: 1, minWidth: 0 };

// ─── Component ──────────────────────────────────────────────────────────────

interface EditVendorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Vendor | null;
  onSave: (data: VendorFormData) => void | Promise<void>;
}

export function EditVendorSheet({ isOpen, onClose, initialData, onSave }: EditVendorSheetProps) {
  const { showToast } = useToast();
  const { equipment } = useEquipment();
  const [form, setForm] = useState<VendorFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? {
        name: initialData.name,
        type: initialData.type,
        phone: initialData.phone ?? '',
        email: initialData.email ?? '',
        website_url: initialData.website_url ?? '',
        address: initialData.address ?? '',
        notes: initialData.notes ?? '',
        is_active: initialData.is_active,
        equipment_ids: equipment
          .filter(e => e.vendor_id === initialData.id)
          .map(e => e.id),
      } : EMPTY_FORM);
    }
    // `equipment` is intentionally omitted: this effect initializes the form
    // when the sheet opens. Re-running it when equipment loads would clobber
    // user edits. The follow-on effect below handles the late-load case.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData]);

  // Sync equipment_ids when equipment loads after the sheet is already open
  useEffect(() => {
    if (isOpen && initialData && equipment.length > 0) {
      setForm(prev => {
        if (prev.equipment_ids.length > 0) return prev; // already populated or user-edited
        const linked = equipment.filter(e => e.vendor_id === initialData.id).map(e => e.id);
        return linked.length > 0 ? { ...prev, equipment_ids: linked } : prev;
      });
    }
  }, [isOpen, initialData, equipment]);

  const isEdit = !!initialData;
  const canSave = !!form.name.trim() && !!form.type;

  const equipmentOptions = useMemo(() => [
    { label: 'Select equipment', value: '' },
    ...equipment.map(e => ({ label: e.name, value: e.id })),
  ], [equipment]);

  const updateText = (field: keyof VendorFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const updateSelect = (field: keyof VendorFormData) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave(form);
    } catch (err: unknown) {
      showToast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to save', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit ${initialData.name}` : 'Add Vendor'}
      width="600px"
      side="right"
      footer={<>
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" type="submit" form="vendor-form" disabled={saving || !canSave}>
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Vendor'}
        </Button>
      </>}
    >
      <form id="vendor-form" onSubmit={handleSubmit}>
        <div style={sheetBodyStyle}>
          <h3 style={sheetSectionTitle}>Company Information</h3>
          <div style={sheetFormGroup}>
            <TextInput label="Company Name" size="sm" value={form.name} onChange={updateText('name')} placeholder="Vendor company name" fullWidth required />
            <div style={formRowStyle}>
              <div style={formRowHalf}>
                <Select label="Type" size="sm" options={TYPE_OPTIONS} value={form.type} onChange={updateSelect('type')} fullWidth required />
              </div>
              <div style={formRowHalf}>
                <Select label="Status" size="sm" options={STATUS_OPTIONS} value={form.is_active ? 'active' : 'inactive'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm(prev => ({ ...prev, is_active: e.target.value === 'active' }))} fullWidth />
              </div>
            </div>
          </div>

          <h3 style={sheetSectionTitle}>Contact Details</h3>
          <div style={sheetFormGroup}>
            <div style={formRowStyle}>
              <div style={formRowHalf}>
                <TextInput label="Phone" size="sm" type="tel" value={form.phone} onChange={updateText('phone')} placeholder="(555) 000-0000" fullWidth />
              </div>
              <div style={formRowHalf}>
                <TextInput label="Email" size="sm" type="email" value={form.email} onChange={updateText('email')} placeholder="contact@vendor.com" fullWidth />
              </div>
            </div>
            <TextInput label="Website" size="sm" type="url" value={form.website_url} onChange={updateText('website_url')} placeholder="https://vendor.com" fullWidth />
            <TextInput label="Address" size="sm" value={form.address} onChange={updateText('address')} placeholder="123 Main St, City, State" fullWidth />
          </div>

          <h3 style={sheetSectionTitle}>Equipment & Inventory</h3>
          <div style={sheetFormGroup}>
            <Select
              label="Add Equipment"
              size="sm"
              options={equipmentOptions.filter(o => !form.equipment_ids.includes(o.value))}
              value=""
              onChange={(e) => {
                const id = e.target.value;
                if (id && !form.equipment_ids.includes(id)) {
                  setForm(prev => ({ ...prev, equipment_ids: [...prev.equipment_ids, id] }));
                }
              }}
              fullWidth
            />
            {form.equipment_ids.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: gap.sm }}>
                {form.equipment_ids.map(eqId => {
                  const item = equipment.find(e => e.id === eqId);
                  return (
                    <Tag key={eqId} size="sm" style={{ backgroundColor: color.surface.secondary, color: color.text.primary, display: 'inline-flex', alignItems: 'center', gap: gap.xs }}>
                      {item?.name ?? eqId}
                      <IconButton
                        variant="danger-ghost"
                        size="tiny"
                        icon={<Icon icon={icon.close} />}
                        label={`Remove ${item?.name ?? 'equipment'}`}
                        onClick={() => setForm(prev => ({ ...prev, equipment_ids: prev.equipment_ids.filter(id => id !== eqId) }))}
                      />
                    </Tag>
                  );
                })}
              </div>
            )}
          </div>

          <h3 style={sheetSectionTitle}>Notes</h3>
          <div style={sheetFormGroup}>
            <TextArea label="Relationship Details" size="sm" value={form.notes} onChange={updateText('notes')} placeholder="Notes about the relationship with this vendor" rows={3} fullWidth />
          </div>
        </div>
      </form>
    </Sheet>
  );
}
