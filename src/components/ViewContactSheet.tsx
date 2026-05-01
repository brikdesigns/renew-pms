'use client';

import { useState, useEffect, useLayoutEffect, type CSSProperties } from 'react';
import { Button, Badge, InteractiveListItem, useConfigureSheet, Field, FieldGrid, SheetSection, EmptyState } from '@brikdesigns/bds';
import type { SheetTab } from '@brikdesigns/bds';
import { UserAvatar } from '@/components/UserAvatar';
import { StatusBadge } from '@/components/StatusBadge';
import { SheetSkeleton } from '@/components/SheetSkeleton';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { font, color, gap, border } from '@/lib/tokens';
import type { SheetType } from '@/lib/sheet-registry';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ContactData {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  vendor_id: string;
  vendor_name: string | null;
  vendor_type: string | null;
  vendor_phone: string | null;
  vendor_email: string | null;
  vendor_website_url: string | null;
  vendor_address: string | null;
}

interface ActivityRequest {
  id: string;
  title: string;
  category: string;
  urgency: string;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  assignee_name: string | null;
}

interface ViewContactSheetProps {
  onClose: () => void;
  /** Contact ID (global mode — fetches data) */
  id?: string;
  /** Navigate to a related entity (global sheet stack) */
  onNavigate?: (type: SheetType, props: Record<string, unknown>, opts?: { title?: string }) => void;
  /** Injected by AppSheetProvider — ignored but accepted for compatibility */
  headless?: boolean;
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const activityIconWrap: CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: border.radius.pill,
  backgroundColor: color.surface.muted,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: color.text.secondary,
  fontSize: font.size.body.md,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  maintenance: 'Maintenance',
  repair: 'Repair',
  supply_order: 'Supply Order',
  it_support: 'IT Support',
  general: 'General',
  facility: 'Facility',
};

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ─── Activity Row ───────────────────────────────────────────────────────────

function ActivityRow({
  request,
  onClick,
}: {
  request: ActivityRequest;
  onClick: () => void;
}) {
  const parts: string[] = [];
  parts.push(CATEGORY_LABELS[request.category] ?? request.category);
  if (request.assignee_name) parts.push(`Assigned to ${request.assignee_name}`);
  parts.push(formatDate(request.created_at));

  return (
    <InteractiveListItem
      leading={
        <div style={activityIconWrap}>
          <Icon icon={icon.requests} />
        </div>
      }
      title={request.title}
      subtitle={parts.join(' \u00b7 ')}
      trailing={<StatusBadge status={request.status} size="sm" />}
      onClick={onClick}
    />
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ViewContactSheet({ onClose, id, onNavigate }: ViewContactSheetProps) {
  const configureSheet = useConfigureSheet();
  const [activeTab, setActiveTab] = useState('details');
  const [contact, setContact] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState<ActivityRequest[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Fetch contact
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/contacts/${id}`)
      .then(r => r.json())
      .then(data => { if (data && !data.error) setContact(data); })
      .catch(err => console.error('[ViewContactSheet] fetch failed:', err))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch activity (assigned requests)
  useEffect(() => {
    if (!id) return;
    setActivityLoading(true);
    fetch(`/api/contacts/${id}/activity`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setActivity(data); })
      .catch(err => console.error('[ViewContactSheet] activity fetch failed:', err))
      .finally(() => setActivityLoading(false));
  }, [id]);

  useLayoutEffect(() => {
    if (loading || !contact) {
      configureSheet({
        body: <SheetSkeleton />,
        footer: <Button variant="ghost" size="md" onClick={onClose}>Close</Button>,
      });
      return;
    }

    // ── Details tab ──
    const detailsContent = (
      <>
        <SheetSection>
          <div style={{ display: 'flex', alignItems: 'center', gap: gap.lg }}>
            <UserAvatar name={contact.name} size="lg" />
            {contact.is_primary && (
              <Badge status="positive" size="sm">Primary</Badge>
            )}
          </div>
        </SheetSection>

        <SheetSection heading="Contact Details">
          <FieldGrid columns={2} gap="lg">
            <Field label="Phone" empty="—">{contact.phone}</Field>
            <Field label="Email" empty="—">{contact.email?.toLowerCase() ?? null}</Field>
          </FieldGrid>
        </SheetSection>

        <SheetSection heading="Company">
          <Field label="Company" empty="—">
            {contact.vendor_name && onNavigate ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('vendor', { id: contact.vendor_id }, { title: contact.vendor_name ?? 'Company' })}
              >
                {contact.vendor_name}
              </Button>
            ) : (
              contact.vendor_name
            )}
          </Field>
          <FieldGrid columns={2} gap="lg">
            <Field label="Company Phone" empty="—">{contact.vendor_phone}</Field>
            <Field label="Company Email" empty="—">{contact.vendor_email?.toLowerCase() ?? null}</Field>
          </FieldGrid>
          {contact.vendor_website_url && (
            <Field label="Website" empty="—">{contact.vendor_website_url}</Field>
          )}
          {contact.vendor_address && (
            <Field label="Address" empty="—">{contact.vendor_address}</Field>
          )}
        </SheetSection>
      </>
    );

    // ── Activity tab ──
    const activityContent = (
      <SheetSection heading="Assigned Requests">
        {activityLoading ? (
          <SheetSkeleton />
        ) : activity.length === 0 ? (
          <EmptyState title="No assigned requests" description="No requests have been assigned to this contact yet." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
            {activity.map(req => (
              <ActivityRow
                key={req.id}
                request={req}
                onClick={() => onNavigate?.('request', { id: req.id }, { title: req.title })}
              />
            ))}
          </div>
        )}
      </SheetSection>
    );

    const sheetTabs: SheetTab[] = [
      { id: 'details', label: 'Details', content: detailsContent },
      { id: 'activity', label: `Activity (${activity.length})`, content: activityContent },
    ];

    configureSheet({
      title: contact.name,
      description: contact.role ?? undefined,
      tabs: sheetTabs,
      activeTab,
      onTabChange: setActiveTab,
      footer: <Button variant="ghost" size="md" onClick={onClose}>Close</Button>,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configureSheet, loading, contact?.id, contact?.name, activeTab, activity.length, activityLoading, onClose, onNavigate]);

  return null;
}
