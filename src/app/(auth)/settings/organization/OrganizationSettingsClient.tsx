'use client';

import { useState, useEffect } from 'react';
import { EditOrganizationSheet, type OrganizationData } from '@/components/EditOrganizationSheet';
import { OfficeRoomsTab } from './OfficeRoomsTab';
import { PageSkeleton } from '@/components/PageSkeleton';
import { Button, DataSection, Field, FieldGrid, PageHeader, TabBar } from '@brikdesigns/bds';
import {
  contentStyle,
  settingsPlaceholderStyle,
} from '../_shared';
import { StatusBadge } from '@/components/StatusBadge';

// ─── Tab definitions ─────────────────────────────────────────────────────────

const ORG_TABS: { key: string; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'location', label: 'Locations' },
  { key: 'office', label: 'Office' },
];

// ─── Details tab ─────────────────────────────────────────────────────────────

function DetailsTab({ practice }: { practice: OrganizationData }) {
  return (
    <div style={contentStyle}>
      <DataSection title="Practice Information">
        <FieldGrid columns={3} gap="lg">
          <Field label="Practice Name" empty="—">{practice.name || null}</Field>
          <Field label="Website" empty="—">{practice.website_url || null}</Field>
          <Field label="Status" empty="—"><StatusBadge status={practice.status} /></Field>
        </FieldGrid>
        <FieldGrid columns={3} gap="lg">
          <Field label="NPI Number" empty="—">{practice.npi_number || null}</Field>
          <Field label="Tax ID" empty="—">{practice.tax_id || null}</Field>
          <div />
        </FieldGrid>
      </DataSection>

      <DataSection title="Address">
        <FieldGrid columns={3} gap="lg">
          <Field label="Address Line 1" empty="—">{practice.address_line1 || null}</Field>
          <Field label="Address Line 2" empty="—">{practice.address_line2 || null}</Field>
          <Field label="City" empty="—">{practice.city || null}</Field>
        </FieldGrid>
        <FieldGrid columns={3} gap="lg">
          <Field label="State" empty="—">{practice.state || null}</Field>
          <Field label="ZIP Code" empty="—">{practice.zip || null}</Field>
          <div />
        </FieldGrid>
      </DataSection>

      <DataSection title="Contact">
        <FieldGrid columns={3} gap="lg">
          <Field label="Email" empty="—">{practice.email || null}</Field>
          <Field label="Phone" empty="—">{practice.phone || null}</Field>
          <div />
        </FieldGrid>
      </DataSection>
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

// ─── Client component ────────────────────────────────────────────────────────

export function OrganizationSettingsClient() {
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
    return <PageSkeleton />;
  }

  return (
    <>
      <PageHeader
        title="Organization"
        actions={
          <Button variant="primary" size="sm" onClick={() => setSheetOpen(true)}>Edit Organization</Button>
        }
        tabs={
          <TabBar
            variant="tab"
            items={ORG_TABS.map((tab) => ({
              label: tab.label,
              active: activeTab === tab.key,
              onClick: () => setActiveTab(tab.key),
            }))}
          />
        }
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
