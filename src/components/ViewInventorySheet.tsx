'use client';

import type { CSSProperties } from 'react';
import { Sheet } from '@bds/components';
import { Badge } from '@bds/components/ui/Badge';
import { Tag } from '@bds/components/ui/Tag';
import { sheetBodyStyle, sheetSectionTitle } from '@/app/(auth)/settings/_sheetStyles';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import { getDepartmentColors } from '@/lib/department-colors';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InventoryViewData {
  id: string;
  name: string;
  status: string;
  department: string;
  description: string;
  type: string;
  company: string;
  team: string;
  room: string;
}

interface ViewInventorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryViewData | null;
  onEdit: () => void;
}

// ─── Status mapping ─────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { status: 'positive' | 'warning' | 'error' | 'info'; label: string }> = {
  Active: { status: 'positive', label: 'Active' },
  'Renew Review': { status: 'warning', label: 'Renew Review' },
  'Need to Cancel/Replace': { status: 'error', label: 'Need to Cancel/Replace' },
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const TEXT_PRIMARY = 'var(--text-primary)';

const rowStyle: CSSProperties = {
  display: 'flex',
  gap: '16px',
  width: '100%',
};

const halfStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

// ─── Component ──────────────────────────────────────────────────────────────

export function ViewInventorySheet({ isOpen, onClose, item, onEdit }: ViewInventorySheetProps) {
  if (!item) return null;

  const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.Active;
  const deptColors = getDepartmentColors(item.department);

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={item.name}
      width="600px"
      side="right"
      footer={<>
        <button type="button" className="renew-btn renew-btn--ghost" onClick={onClose}>Close</button>
        <button type="button" className="renew-btn renew-btn--primary" onClick={onEdit}>Edit</button>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-family-label)', fontSize: 'var(--body-sm)', fontWeight: 500, color: TEXT_PRIMARY }}>
                Status
              </span>
              <div style={{ display: 'inline-flex' }}>
                <Badge status={badge.status} size="sm">{badge.label}</Badge>
              </div>
            </div>
          </div>
          <div style={halfStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-family-label)', fontSize: 'var(--body-sm)', fontWeight: 500, color: TEXT_PRIMARY }}>
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
            <ReadOnlyField label="Third-Party Company" value={item.company || '—'} />
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
