'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import { Sheet, Badge, Tag, Button } from '@bds/components';
import type { SheetTab } from '@bds/components';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import { ProfileCard, profileCardGrid } from '@/components/ProfileCard';
import {
  sheetBodyStyle,
  sheetSectionTitle,
} from '@/app/(auth)/settings/_sheetStyles';
import { color, gap, font, space } from '@/lib/tokens';
import type { Vendor } from '@/app/(auth)/settings/contacts/ContactsTable';

// ─── Types ──────────────────────────────────────────────────────────────────

interface VendorContact {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
}

// ─── Display maps ───────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  equipment: 'Equipment',
  software: 'Software',
  service: 'Service',
  lab: 'Lab',
  referring_practice: 'Referring Practice',
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const rowStyle: CSSProperties = { display: 'flex', gap: gap.lg, width: '100%' };

const emptyState: CSSProperties = {
  padding: `${space.lg} 0`,
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: color.text.secondary,
  textAlign: 'center',
};

// ─── Component ──────────────────────────────────────────────────────────────

interface ViewVendorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor | null;
  onEdit: (v: Vendor) => void;
}

export function ViewVendorSheet({ isOpen, onClose, vendor, onEdit }: ViewVendorSheetProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [contacts, setContacts] = useState<VendorContact[]>([]);

  useEffect(() => {
    if (!vendor || !isOpen) { setContacts([]); return; }
    fetch(`/api/vendors/${vendor.id}/contacts`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setContacts(data); })
      .catch(err => console.error('[ViewVendorSheet] failed to load contacts:', err));
  }, [vendor, isOpen]);

  useEffect(() => {
    if (vendor) setActiveTab('details');
  }, [vendor?.id]);

  if (!vendor) return null;

  // ── Details tab ──

  const detailsContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Company Details</h3>
      <ReadOnlyField label="Name" value={vendor.name} />
      <div style={rowStyle}>
        <ReadOnlyField label="Type" value={
          <Tag size="sm" style={{ backgroundColor: color.surface.secondary, color: color.text.secondary, display: 'inline-flex' }}>
            {TYPE_LABELS[vendor.type] ?? vendor.type}
          </Tag>
        } />
        <ReadOnlyField label="Status" value={
          <Badge status={vendor.is_active ? 'positive' : 'error'} size="sm" style={{ display: 'inline-flex' }}>
            {vendor.is_active ? 'Active' : 'Inactive'}
          </Badge>
        } />
      </div>
      <div style={rowStyle}>
        <ReadOnlyField label="Phone" value={vendor.phone} />
        <ReadOnlyField label="Email" value={vendor.email} />
      </div>
      {vendor.website_url && <ReadOnlyField label="Website" value={vendor.website_url} />}
      {vendor.address && <ReadOnlyField label="Address" value={vendor.address} />}
      {vendor.notes && <ReadOnlyField label="Relationship Details" value={vendor.notes} />}
    </div>
  );

  // ── Contacts tab ──

  const contactsContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Contacts</h3>
      {contacts.length === 0 ? (
        <p style={emptyState}>No contacts on file for this company.</p>
      ) : (
        <div style={profileCardGrid}>
          {contacts.map(c => {
            const contactInfo = [c.phone, c.email].filter(Boolean).join(' \u00b7 ') || undefined;
            return (
              <ProfileCard
                key={c.id}
                variant="user"
                name={c.name}
                subtitle={contactInfo}
                role={c.role ?? undefined}
                department={c.is_primary ? 'Primary' : undefined}
                departmentBg={c.is_primary ? color.surface.positive : undefined}
                departmentText={c.is_primary ? color.text.primary : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );

  // ── Tabs ──

  const sheetTabs: SheetTab[] = [
    { id: 'details', label: 'Details', content: detailsContent },
    { id: 'contacts', label: `Contacts (${contacts.length})`, content: contactsContent },
  ];

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={vendor.name}
      width="600px"
      side="right"
      tabs={sheetTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      footer={
        <div style={{ display: 'flex', alignItems: 'center', gap: gap.md, justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="md" onClick={onClose}>Close</Button>
          <Button variant="primary" size="md" onClick={() => onEdit(vendor)}>Edit Company</Button>
        </div>
      }
    />
  );
}
