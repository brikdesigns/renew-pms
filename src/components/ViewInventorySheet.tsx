'use client';

import { useState, useEffect, useLayoutEffect, type CSSProperties } from 'react';
import { Tag, Button, useConfigureSheet } from '@bds/components';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import type { SheetTab } from '@bds/components';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { color, font, gap, space, border, departmentColor } from '@/lib/tokens';
import { sheetBodyStyle, sheetSectionTitle } from '@/app/(auth)/settings/_sheetStyles';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import { SheetSkeleton } from '@/components/SheetSkeleton';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InventoryViewData {
  id: string;
  name: string;
  status: string;
  department: string;
  /** DB-stored color key from departments.color */
  departmentColor: string;
  description: string;
  type: string;
  company: string;
  team: string;
  room: string;
}

/** Lightweight request summary returned by /api/requests?equipment_id=... */
interface EquipmentRequest {
  id: string;
  title: string;
  status: string;
  urgency: string;
  category: string;
  submitter_name: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface ViewInventorySheetProps {
  onClose: () => void;
  /** Full item data (page-level mode — skips fetch) */
  item?: InventoryViewData | null;
  /** Item ID (global mode — fetches data) */
  id?: string;
  /** Open this item in edit mode (omit to hide edit button — e.g. drill-down from request) */
  onEdit?: () => void;
  /** Navigate to a related entity (global sheet stack) */
  onNavigate?: (type: string, props: Record<string, unknown>, opts?: { title?: string }) => void;
}

// ─── Status mapping ─────────────────────────────────────────────────────────


// ─── Styles ─────────────────────────────────────────────────────────────────

const rowStyle: CSSProperties = {
  display: 'flex',
  gap: gap.lg,
  width: '100%',
};

const halfStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const requestRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: gap.md,
  padding: `${space.md} 0`,
  borderBottom: `1px solid ${color.border.muted}`,
  cursor: 'pointer',
};

const requestIconStyle: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: border.radius.pill,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const requestTitleStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: font.weight.medium,
  color: color.text.primary,
  lineHeight: font.lineHeight.tight,
};

const requestMetaStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.xs,
  color: color.text.secondary,
  marginTop: '2px',
};

const emptyActivityStyle: CSSProperties = {
  padding: `${space.xl} 0`,
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: color.text.secondary,
  textAlign: 'center',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ViewInventorySheet({ onClose, item: itemProp, id, onEdit, onNavigate }: ViewInventorySheetProps) {
  const configureSheet = useConfigureSheet();
  const [fetched, setFetched] = useState<InventoryViewData | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [requests, setRequests] = useState<EquipmentRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Global mode: fetch by ID when no data prop is given
  const resolvedId = id ?? itemProp?.id;
  useEffect(() => {
    if (itemProp || !resolvedId) return;
    setFetchLoading(true);
    fetch(`/api/equipment/${resolvedId}`)
      .then(r => r.json())
      .then(data => { if (data && !data.error) setFetched(data); })
      .catch(err => console.error('[ViewInventorySheet] fetch failed:', err))
      .finally(() => setFetchLoading(false));
  }, [resolvedId, itemProp]);

  const item = itemProp ?? fetched;

  // Fetch requests linked to this equipment
  useEffect(() => {
    if (!item?.id) return;
    setRequestsLoading(true);
    fetch(`/api/requests?equipment_id=${item.id}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRequests(data); })
      .catch(err => console.error('[ViewInventorySheet] failed to load requests:', err))
      .finally(() => setRequestsLoading(false));
  }, [item?.id]);

  // Reset tab when item changes
  useEffect(() => {
    if (item) setActiveTab('details');
  }, [item?.id]);

  // ── Configure sheet ──────────────────────────────────────────────────────

  useLayoutEffect(() => {
    if (fetchLoading || !item) {
      configureSheet({
        body: <SheetSkeleton />,
        footer: <Button variant="ghost" size="md" type="button" onClick={onClose}>Close</Button>,
      });
      return;
    }

    const deptColors = departmentColor(item.departmentColor);

    // ── Details tab ──
    const detailsContent = (
      <div style={sheetBodyStyle}>
        <h3 style={sheetSectionTitle}>Item Details</h3>
        <div style={rowStyle}>
          <div style={halfStyle}>
            <ReadOnlyField label="Name" value={item.name} />
          </div>
          <div style={halfStyle}>
            <ReadOnlyField label="Type" value={item.type || '—'} />
          </div>
        </div>
        <div style={rowStyle}>
          <div style={halfStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
              <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: color.text.primary }}>
                Status
              </span>
              <div style={{ display: 'inline-flex' }}>
                <StatusBadge status={item.status} />
              </div>
            </div>
          </div>
          <div style={halfStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
              <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: color.text.primary }}>
                Department
              </span>
              {item.department && (
                <div style={{ display: 'inline-flex' }}>
                  <Tag size="sm" style={{ backgroundColor: deptColors.light, color: deptColors.text }}>{item.department}</Tag>
                </div>
              )}
            </div>
          </div>
        </div>
        {item.description && (
          <ReadOnlyField label="Description" value={item.description} />
        )}
        <div style={rowStyle}>
          <div style={halfStyle}>
            <ReadOnlyField label="Vendor" value={item.company || '—'} />
          </div>
          <div style={halfStyle}>
            <ReadOnlyField label="Team" value={item.team || '—'} />
          </div>
        </div>
        <ReadOnlyField label="Room" value={item.room || '—'} />
      </div>
    );

    // ── Activity tab ──
    const activityContent = (
      <div style={sheetBodyStyle}>
        <h3 style={sheetSectionTitle}>Request History</h3>
        {requestsLoading ? (
          <div style={emptyActivityStyle}>Loading requests...</div>
        ) : requests.length === 0 ? (
          <div style={emptyActivityStyle}>No requests have been filed for this equipment.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {requests.map(req => {
              const isResolved = req.status === 'resolved' || req.status === 'closed';
              return (
                <div
                  key={req.id}
                  style={requestRowStyle}
                  role="button"
                  tabIndex={0}
                  onClick={() => onNavigate?.('request', { id: req.id }, { title: req.title })}
                  onKeyDown={e => { if (e.key === 'Enter') onNavigate?.('request', { id: req.id }, { title: req.title }); }}
                >
                  <div style={{
                    ...requestIconStyle,
                    backgroundColor: isResolved ? color.surface.positive : color.surface.secondary,
                  }}>
                    <Icon
                      icon={isResolved ? icon.circleCheck : icon.requests}
                      style={{
                        fontSize: font.size.body.sm,
                        color: isResolved ? color.text.positive : color.text.secondary,
                      } as CSSProperties & Record<string, string>}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={requestTitleStyle}>{req.title}</div>
                    <div style={requestMetaStyle}>
                      {req.submitter_name ? `${req.submitter_name} · ` : ''}{timeAgo(req.created_at)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm, marginTop: gap.xs }}>
                      <StatusBadge status={req.status} size="xs" />
                      <PriorityBadge priority={req.urgency} size="xs" />
                    </div>
                  </div>
                  <Icon
                    icon="ph:caret-right"
                    style={{ fontSize: font.size.body.md, color: color.text.muted, flexShrink: 0, marginTop: '2px' } as CSSProperties & Record<string, string>}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );

    const sheetTabs: SheetTab[] = [
      { id: 'details', label: 'Details', content: detailsContent },
      { id: 'activity', label: `Activity (${requests.length})`, content: activityContent },
    ];

    configureSheet({
      title: item.name,
      tabs: sheetTabs,
      activeTab,
      onTabChange: setActiveTab,
      footer: <>
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Close</Button>
        {onEdit && <Button variant="primary" size="md" type="button" onClick={onEdit}>Edit</Button>}
      </>,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configureSheet, fetchLoading, item?.id, item?.status, activeTab, requests.length, requestsLoading, onClose, onEdit]);

  return null;
}
