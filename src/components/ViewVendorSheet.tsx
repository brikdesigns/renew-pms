'use client';

import { useState, useEffect, useLayoutEffect, type CSSProperties } from 'react';
import { Badge, Tag, Button, useConfigureSheet, Field, FieldGrid } from '@brikdesigns/bds';
import type { SheetTab } from '@brikdesigns/bds';
import { ProfileCard, profileCardGrid } from '@/components/ProfileCard';
import {
  sheetBodyStyle,
  sheetSectionTitle,
} from '@/app/(auth)/settings/_sheetStyles';
import { color, gap, font, space } from '@/lib/tokens';
import type { Vendor } from '@/app/(auth)/settings/contacts/ContactsTable';
import { SheetSkeleton } from '@/components/SheetSkeleton';

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


const emptyState: CSSProperties = {
  padding: `${space.lg} 0`,
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: color.text.secondary,
  textAlign: 'center',
};

// ─── Component ──────────────────────────────────────────────────────────────

interface ViewVendorSheetProps {
  onClose: () => void;
  /** Full vendor data (page-level mode — skips fetch) */
  vendor?: Vendor | null;
  /** Vendor ID (global mode — fetches data) */
  id?: string;
  /** Open this vendor in edit mode (omit to hide edit button — e.g. drill-down from request) */
  onEdit?: (v: Vendor) => void;
  /** Navigate to a related entity (global sheet stack) */
  onNavigate?: (type: string, props: Record<string, unknown>, opts?: { title?: string }) => void;
}

export function ViewVendorSheet({ onClose, vendor: vendorProp, id, onEdit, onNavigate }: ViewVendorSheetProps) {
  const configureSheet = useConfigureSheet();
  const [activeTab, setActiveTab] = useState('details');
  const [contacts, setContacts] = useState<VendorContact[]>([]);
  const [fetched, setFetched] = useState<Vendor | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Global mode: fetch by ID when no data prop is given
  const resolvedId = id ?? vendorProp?.id;
  useEffect(() => {
    if (vendorProp || !resolvedId) return;
    setFetchLoading(true);
    fetch(`/api/vendors/${resolvedId}`)
      .then(r => r.json())
      .then(data => { if (data && !data.error) setFetched(data); })
      .catch(err => console.error('[ViewVendorSheet] fetch failed:', err))
      .finally(() => setFetchLoading(false));
  }, [resolvedId, vendorProp]);

  const vendor = vendorProp ?? fetched;

  useEffect(() => {
    if (!vendor) { setContacts([]); return; }
    fetch(`/api/vendors/${vendor.id}/contacts`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setContacts(data); })
      .catch(err => console.error('[ViewVendorSheet] failed to load contacts:', err));
  }, [vendor]);

  // Reset tab when vendor changes (id is the identity for "different vendor")
  useEffect(() => {
    if (vendor?.id) setActiveTab('details');
  }, [vendor?.id]);

  useLayoutEffect(() => {
    if (fetchLoading || !vendor) {
      configureSheet({
        body: <SheetSkeleton />,
        footer: <Button variant="ghost" size="md" onClick={onClose}>Close</Button>,
      });
      return;
    }

    // ── Details tab ──
    const detailsContent = (
      <div style={sheetBodyStyle}>
        <h3 style={sheetSectionTitle}>Company Details</h3>
        <Field label="Name" empty="—">{vendor.name}</Field>
        <FieldGrid columns={2} gap="lg">
          <Field label="Type" empty="—">
            <Tag size="sm" style={{ backgroundColor: color.surface.secondary, color: color.text.secondary }}>
              {TYPE_LABELS[vendor.type] ?? vendor.type}
            </Tag>
          </Field>
          <Field label="Status" empty="—">
            <Badge status={vendor.is_active ? 'positive' : 'error'} size="sm">
              {vendor.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </Field>
        </FieldGrid>
        <FieldGrid columns={2} gap="lg">
          <Field label="Phone" empty="—">{vendor.phone}</Field>
          <Field label="Email" empty="—">{vendor.email}</Field>
        </FieldGrid>
        {vendor.website_url && <Field label="Website" empty="—">{vendor.website_url}</Field>}
        {vendor.address && <Field label="Address" empty="—">{vendor.address}</Field>}
        {vendor.notes && <Field label="Relationship Details" empty="—">{vendor.notes}</Field>}
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
                  onClick={onNavigate ? () => onNavigate('contact', { id: c.id }, { title: c.name }) : undefined}
                />
              );
            })}
          </div>
        )}
      </div>
    );

    const sheetTabs: SheetTab[] = [
      { id: 'details', label: 'Details', content: detailsContent },
      { id: 'contacts', label: `Contacts (${contacts.length})`, content: contactsContent },
    ];

    configureSheet({
      title: vendor.name,
      tabs: sheetTabs,
      activeTab,
      onTabChange: setActiveTab,
      footer: (
        <div style={{ display: 'flex', alignItems: 'center', gap: gap.md, justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="md" onClick={onClose}>Close</Button>
          {onEdit && <Button variant="primary" size="md" onClick={() => onEdit(vendor)}>Edit Company</Button>}
        </div>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configureSheet, fetchLoading, vendor?.id, vendor?.name, vendor?.is_active, activeTab, contacts.length, onClose, onEdit]);

  return null;
}
