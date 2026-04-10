'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Sheet, Button, TextInput, Select } from '@bds/components';
import { useToast } from '@/components/ToastProvider';
import {
  sheetBodyStyle,
  sheetSectionTitle,
  sheetFormGroup,
} from '@/app/(auth)/settings/_sheetStyles';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrganizationData {
  name: string;
  website_url: string;
  npi_number: string;
  tax_id: string;
  status: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
}

interface EditOrganizationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: OrganizationData;
  onSave: (data: OrganizationData) => void | Promise<void>;
}

// ─── Options ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
];

const US_STATES = [
  { label: 'Alabama', value: 'AL' }, { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' }, { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' }, { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' }, { label: 'Delaware', value: 'DE' },
  { label: 'Florida', value: 'FL' }, { label: 'Georgia', value: 'GA' },
  { label: 'Hawaii', value: 'HI' }, { label: 'Idaho', value: 'ID' },
  { label: 'Illinois', value: 'IL' }, { label: 'Indiana', value: 'IN' },
  { label: 'Iowa', value: 'IA' }, { label: 'Kansas', value: 'KS' },
  { label: 'Kentucky', value: 'KY' }, { label: 'Louisiana', value: 'LA' },
  { label: 'Maine', value: 'ME' }, { label: 'Maryland', value: 'MD' },
  { label: 'Massachusetts', value: 'MA' }, { label: 'Michigan', value: 'MI' },
  { label: 'Minnesota', value: 'MN' }, { label: 'Mississippi', value: 'MS' },
  { label: 'Missouri', value: 'MO' }, { label: 'Montana', value: 'MT' },
  { label: 'Nebraska', value: 'NE' }, { label: 'Nevada', value: 'NV' },
  { label: 'New Hampshire', value: 'NH' }, { label: 'New Jersey', value: 'NJ' },
  { label: 'New Mexico', value: 'NM' }, { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' }, { label: 'North Dakota', value: 'ND' },
  { label: 'Ohio', value: 'OH' }, { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' }, { label: 'Pennsylvania', value: 'PA' },
  { label: 'Rhode Island', value: 'RI' }, { label: 'South Carolina', value: 'SC' },
  { label: 'South Dakota', value: 'SD' }, { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' }, { label: 'Utah', value: 'UT' },
  { label: 'Vermont', value: 'VT' }, { label: 'Virginia', value: 'VA' },
  { label: 'Washington', value: 'WA' }, { label: 'West Virginia', value: 'WV' },
  { label: 'Wisconsin', value: 'WI' }, { label: 'Wyoming', value: 'WY' },
  { label: 'District of Columbia', value: 'DC' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export type { OrganizationData };

export function EditOrganizationSheet({ isOpen, onClose, initialData, onSave }: EditOrganizationSheetProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<OrganizationData>(initialData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setForm(initialData);
  }, [isOpen, initialData]);

  const updateText = (field: keyof OrganizationData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const updateSelect = (field: keyof OrganizationData) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onSave(form);
      showToast({ title: 'Organization updated', description: 'Your changes have been saved.', variant: 'success' });
      onClose();
    } catch {
      showToast({ title: 'Save failed', description: 'Could not update organization. Please try again.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Edit Organization" width="600px" side="right"
      footer={<>
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" type="submit" form="edit-org-form" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </>}
    >
      <form id="edit-org-form" onSubmit={handleSave}>
        <div style={sheetBodyStyle}>
          {/* Practice Information */}
          <h3 style={sheetSectionTitle}>Practice Information</h3>
          <div style={sheetFormGroup}>
            <TextInput
              label="Practice Name"
              size="sm"
              value={form.name}
              onChange={updateText('name')}
              placeholder="Enter practice name"
              fullWidth
            />
            <TextInput
              label="Website"
              size="sm"
              type="url"
              value={form.website_url}
              onChange={updateText('website_url')}
              placeholder="https://example.com"
              fullWidth
            />
            <Select
              label="Status"
              size="sm"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={updateSelect('status')}
              fullWidth
            />
            <TextInput
              label="NPI Number"
              size="sm"
              value={form.npi_number}
              onChange={updateText('npi_number')}
              placeholder="10-digit NPI"
              fullWidth
              helperText="National Provider Identifier for the practice"
            />
            <TextInput
              label="Tax ID"
              size="sm"
              value={form.tax_id}
              onChange={updateText('tax_id')}
              placeholder="XX-XXXXXXX"
              fullWidth
            />
          </div>

          {/* Address */}
          <h3 style={sheetSectionTitle}>Address</h3>
          <div style={sheetFormGroup}>
            <TextInput
              label="Address Line 1"
              size="sm"
              value={form.address_line1}
              onChange={updateText('address_line1')}
              placeholder="Street address"
              fullWidth
            />
            <TextInput
              label="Address Line 2"
              size="sm"
              value={form.address_line2}
              onChange={updateText('address_line2')}
              placeholder="Suite, unit, floor (optional)"
              fullWidth
            />
            <TextInput
              label="City"
              size="sm"
              value={form.city}
              onChange={updateText('city')}
              placeholder="City"
              fullWidth
            />
            <Select
              label="State"
              size="sm"
              options={US_STATES}
              value={form.state}
              onChange={updateSelect('state')}
              placeholder="Select state"
              fullWidth
            />
            <TextInput
              label="ZIP Code"
              size="sm"
              value={form.zip}
              onChange={updateText('zip')}
              placeholder="XXXXX"
              fullWidth
            />
          </div>

          {/* Contact */}
          <h3 style={sheetSectionTitle}>Contact</h3>
          <div style={sheetFormGroup}>
            <TextInput
              label="Email"
              size="sm"
              type="email"
              value={form.email}
              onChange={updateText('email')}
              placeholder="practice@example.com"
              fullWidth
            />
            <TextInput
              label="Phone"
              size="sm"
              type="tel"
              value={form.phone}
              onChange={updateText('phone')}
              placeholder="(XXX) XXX-XXXX"
              fullWidth
            />
          </div>
        </div>
      </form>
    </Sheet>
  );
}
