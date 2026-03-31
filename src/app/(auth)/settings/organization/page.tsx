'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import type { TabItem } from '@/components/PageHeader';
import { ReadOnlyField, EmptyField } from '@/components/ReadOnlyField';
import { EditOrganizationSheet, type OrganizationData } from '@/components/EditOrganizationSheet';
import { OfficeRoomsTab } from './OfficeRoomsTab';
import {
  contentStyle,
  sectionTitleStyle,
  rowStyle,
  editBtnStyle,
  settingsPlaceholderStyle,
} from '../_shared';

// ─── Tab definitions ─────────────────────────────────────────────────────────

const ORG_TABS: TabItem[] = [
  { key: 'details', label: 'Details' },
  { key: 'location', label: 'Location' },
  { key: 'office', label: 'Office' },
];

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: 'color-mix(in srgb, var(--color-system-green) 15%, transparent)', text: 'var(--color-system-green)' },
  inactive: { bg: 'color-mix(in srgb, var(--text-secondary) 15%, transparent)', text: 'var(--text-secondary)' },
  suspended: { bg: 'color-mix(in srgb, var(--color-system-red) 15%, transparent)', text: 'var(--color-system-red)' },
};

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.inactive;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'var(--font-family-body)',
        fontSize: 'var(--body-sm)',
        fontWeight: 600,
        padding: '4px 10px',
        borderRadius: '6px',
        backgroundColor: colors.bg,
        color: colors.text,
        lineHeight: 1,
        textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  );
}

// ─── Details tab ─────────────────────────────────────────────────────────────

function DetailsTab({ practice }: { practice: OrganizationData }) {
  return (
    <div style={contentStyle}>
      {/* Practice Information */}
      <h2 style={sectionTitleStyle}>Practice Information</h2>
      <div style={rowStyle}>
        <ReadOnlyField label="Practice Name" value={practice.name || null} />
        <ReadOnlyField label="Website" value={practice.website_url || null} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
          <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 'var(--body-sm)', fontWeight: 500, lineHeight: '1.1', color: 'var(--text-primary)' }}>
            Status
          </span>
          <StatusBadge status={practice.status} />
        </div>
      </div>
      <div style={rowStyle}>
        <ReadOnlyField label="NPI Number" value={practice.npi_number || null} />
        <ReadOnlyField label="Tax ID" value={practice.tax_id || null} />
        <EmptyField />
      </div>

      {/* Address */}
      <h2 style={sectionTitleStyle}>Address</h2>
      <div style={rowStyle}>
        <ReadOnlyField label="Address Line 1" value={practice.address_line1 || null} />
        <ReadOnlyField label="Address Line 2" value={practice.address_line2 || null} />
        <ReadOnlyField label="City" value={practice.city || null} />
      </div>
      <div style={rowStyle}>
        <ReadOnlyField label="State" value={practice.state || null} />
        <ReadOnlyField label="ZIP Code" value={practice.zip || null} />
        <EmptyField />
      </div>

      {/* Contact */}
      <h2 style={sectionTitleStyle}>Contact</h2>
      <div style={rowStyle}>
        <ReadOnlyField label="Email" value={practice.email || null} />
        <ReadOnlyField label="Phone" value={practice.phone || null} />
        <EmptyField />
      </div>
    </div>
  );
}

// ─── Placeholder tabs ────────────────────────────────────────────────────────

function LocationTab() {
  return (
    <div style={settingsPlaceholderStyle}>
      Office locations coming soon — will list all offices for this practice
    </div>
  );
}

function OfficeTab() {
  return <OfficeRoomsTab />;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OrganizationSettingsPage() {
  const [activeTab, setActiveTab] = useState('details');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [practiceData, setPracticeData] = useState<OrganizationData>({
    name: '',
    website_url: '',
    npi_number: '',
    tax_id: '',
    status: 'active',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
  });

  // Fetch practice data on mount
  useEffect(() => {
    async function fetchPractice() {
      try {
        const res = await fetch('/api/practice');
        if (res.ok) {
          const data = await res.json();
          setPracticeData({
            name: data.name ?? '',
            website_url: data.website_url ?? '',
            npi_number: data.npi_number ?? '',
            tax_id: data.tax_id ?? '',
            status: data.status ?? 'active',
            address_line1: data.address_line1 ?? '',
            address_line2: data.address_line2 ?? '',
            city: data.city ?? '',
            state: data.state ?? '',
            zip: data.zip ?? '',
            phone: data.phone ?? '',
            email: data.email ?? '',
          });
        }
      } catch (err) {
        console.error('Failed to fetch practice:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPractice();
  }, []);

  const handleSave = async (data: OrganizationData) => {
    const res = await fetch('/api/practice', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setPracticeData({
        name: updated.name ?? '',
        website_url: updated.website_url ?? '',
        npi_number: updated.npi_number ?? '',
        tax_id: updated.tax_id ?? '',
        status: updated.status ?? 'active',
        address_line1: updated.address_line1 ?? '',
        address_line2: updated.address_line2 ?? '',
        city: updated.city ?? '',
        state: updated.state ?? '',
        zip: updated.zip ?? '',
        phone: updated.phone ?? '',
        email: updated.email ?? '',
      });
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading...</div>;
  }

  return (
    <>
      <PageHeader
        title="Organization"
        actions={
          <button style={editBtnStyle} onClick={() => setSheetOpen(true)}>
            Edit Organization
          </button>
        }
        tabs={ORG_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      {activeTab === 'details' && <DetailsTab practice={practiceData} />}
      {activeTab === 'location' && <LocationTab />}
      {activeTab === 'office' && <OfficeTab />}

      <EditOrganizationSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        initialData={practiceData}
        onSave={handleSave}
      />
    </>
  );
}
