'use client';

import { useState, useEffect, useLayoutEffect, type CSSProperties } from 'react';
import { Button, Badge, useConfigureSheet } from '@brikdesigns/bds';
import type { SheetTab } from '@brikdesigns/bds';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import { UserAvatar } from '@/components/UserAvatar';
import { StatusBadge } from '@/components/StatusBadge';
import { SheetSkeleton } from '@/components/SheetSkeleton';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import {
  sheetBodyStyle,
  sheetSectionTitle,
} from '@/app/(auth)/settings/_sheetStyles';
import { font, color, gap, space, border, state, motion } from '@/lib/tokens';
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

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.lg,
  paddingBottom: space.lg,
};

const headerTextStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.tiny,
  minWidth: 0,
  flex: 1,
};

const headerNameStyle: CSSProperties = {
  fontFamily: font.family.heading,
  fontSize: font.size.heading.small,
  fontWeight: font.weight.bold,
  color: color.text.primary,
  lineHeight: 1.2,
  margin: 0,
};

const headerRoleStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.md,
  fontWeight: font.weight.regular,
  color: color.text.secondary,
};

const fieldRow: CSSProperties = { display: 'flex', gap: gap.lg };
const fieldHalf: CSSProperties = { flex: 1, minWidth: 0 };

const emptyState: CSSProperties = {
  padding: `${space.lg} 0`,
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: color.text.secondary,
  textAlign: 'center',
};

const activityCardStyle = (hovered: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
  padding: space.md,
  borderRadius: border.radius.md,
  backgroundColor: hovered ? state.hover.secondary : color.surface.secondary,
  cursor: 'pointer',
  transition: `background-color ${motion.duration.fast} ${motion.ease.out}`,
  border: 'none',
  textAlign: 'left',
  width: '100%',
});

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

const activityTextWrap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.tiny,
  flex: 1,
  minWidth: 0,
};

const activityTitle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: font.weight.medium,
  color: color.text.primary,
  lineHeight: 1.2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const activityMeta: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: font.weight.regular,
  color: color.text.secondary,
  lineHeight: 1.3,
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
  const [hovered, setHovered] = useState(false);
  const parts: string[] = [];
  parts.push(CATEGORY_LABELS[request.category] ?? request.category);
  if (request.assignee_name) parts.push(`Assigned to ${request.assignee_name}`);
  parts.push(formatDate(request.created_at));

  return (
    <button
      type="button"
      style={activityCardStyle(hovered)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div style={activityIconWrap}>
        <Icon icon={icon.requests} />
      </div>
      <div style={activityTextWrap}>
        <span style={activityTitle}>{request.title}</span>
        <span style={activityMeta}>{parts.join(' \u00b7 ')}</span>
      </div>
      <StatusBadge status={request.status} size="sm" />
    </button>
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
      <div style={sheetBodyStyle}>
        {/* Header with avatar */}
        <div style={headerStyle}>
          <UserAvatar name={contact.name} size="lg" />
          <div style={headerTextStyle}>
            <h2 style={headerNameStyle}>{contact.name}</h2>
            {contact.role && <span style={headerRoleStyle}>{contact.role}</span>}
          </div>
          {contact.is_primary && (
            <Badge status="positive" size="sm" style={{ flexShrink: 0 }}>Primary</Badge>
          )}
        </div>

        {/* Contact details */}
        <h3 style={sheetSectionTitle}>Contact Details</h3>
        <div style={fieldRow}>
          <div style={fieldHalf}>
            <ReadOnlyField label="Phone" value={contact.phone} />
          </div>
          <div style={fieldHalf}>
            <ReadOnlyField label="Email" value={contact.email?.toLowerCase() ?? null} />
          </div>
        </div>

        {/* Company details */}
        <h3 style={sheetSectionTitle}>Company</h3>
        <ReadOnlyField
          label="Company"
          value={
            contact.vendor_name && onNavigate ? (
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
            )
          }
        />
        <div style={fieldRow}>
          <div style={fieldHalf}>
            <ReadOnlyField label="Company Phone" value={contact.vendor_phone} />
          </div>
          <div style={fieldHalf}>
            <ReadOnlyField label="Company Email" value={contact.vendor_email?.toLowerCase() ?? null} />
          </div>
        </div>
        {contact.vendor_website_url && (
          <ReadOnlyField label="Website" value={contact.vendor_website_url} />
        )}
        {contact.vendor_address && (
          <ReadOnlyField label="Address" value={contact.vendor_address} />
        )}
      </div>
    );

    // ── Activity tab ──
    const activityContent = (
      <div style={sheetBodyStyle}>
        <h3 style={sheetSectionTitle}>Assigned Requests</h3>
        {activityLoading ? (
          <SheetSkeleton />
        ) : activity.length === 0 ? (
          <p style={emptyState}>No requests have been assigned to this contact yet.</p>
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
      </div>
    );

    const sheetTabs: SheetTab[] = [
      { id: 'details', label: 'Details', content: detailsContent },
      { id: 'activity', label: `Activity (${activity.length})`, content: activityContent },
    ];

    configureSheet({
      title: contact.name,
      tabs: sheetTabs,
      activeTab,
      onTabChange: setActiveTab,
      footer: (
        <div style={{ display: 'flex', alignItems: 'center', gap: gap.md, justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="md" onClick={onClose}>Close</Button>
        </div>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configureSheet, loading, contact?.id, contact?.name, activeTab, activity.length, activityLoading, onClose, onNavigate]);

  return null;
}
