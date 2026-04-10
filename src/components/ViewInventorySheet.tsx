'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import { Sheet, Button } from '@bds/components';
import { Badge } from '@bds/components';
import { Tag } from '@bds/components';
import { color, font, gap, departmentColor } from '@/lib/tokens';
import { sheetBodyStyle, sheetSectionTitle } from '@/app/(auth)/settings/_sheetStyles';
import { ReadOnlyField } from '@/components/ReadOnlyField';
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

interface ViewInventorySheetProps {
  /** Whether the sheet is open (page-level mode). Defaults to true for global mode. */
  isOpen?: boolean;
  onClose: () => void;
  /** Full item data (page-level mode — skips fetch) */
  item?: InventoryViewData | null;
  /** Item ID (global mode — fetches data) */
  id?: string;
  onEdit: () => void;
  /** Navigate to a related entity (global sheet stack) */
  onNavigate?: (type: string, props: Record<string, unknown>, opts?: { title?: string }) => void;
}

// ─── Status mapping ─────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { status: 'positive' | 'warning' | 'error' | 'info'; label: string }> = {
  Active: { status: 'positive', label: 'Active' },
  'Renew Review': { status: 'warning', label: 'Renew Review' },
  'Need to Cancel/Replace': { status: 'error', label: 'Need to Cancel/Replace' },
};

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

// ─── Component ──────────────────────────────────────────────────────────────

export function ViewInventorySheet({ isOpen = true, onClose, item: itemProp, id, onEdit, onNavigate }: ViewInventorySheetProps) {
  const [fetched, setFetched] = useState<InventoryViewData | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

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

  if (fetchLoading) {
    return (
      <Sheet variant="floating" isOpen={isOpen} onClose={onClose} title="Loading..." width="600px" side="right">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '200px', fontFamily: font.family.body, fontSize: font.size.body.md, color: color.text.muted }}>
          Loading...
        </div>
      </Sheet>
    );
  }

  if (!item) return null;

  const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.Active;
  const deptColors = departmentColor(item.departmentColor);

  return (
    <Sheet
      variant="floating"
      isOpen={isOpen}
      onClose={onClose}
      title={item.name}
      width="600px"
      side="right"
      footer={<>
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Close</Button>
        <Button variant="primary" size="md" type="button" onClick={onEdit}>Edit</Button>
      </>}
    >
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
                <Badge status={badge.status} size="sm">{badge.label}</Badge>
              </div>
            </div>
          </div>
          <div style={halfStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
              <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: color.text.primary }}>
                Department
              </span>
              <div style={{ display: 'inline-flex' }}>
                <Tag size="sm" style={{ backgroundColor: deptColors.light, color: deptColors.text }}>{item.department}</Tag>
              </div>
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
    </Sheet>
  );
}
