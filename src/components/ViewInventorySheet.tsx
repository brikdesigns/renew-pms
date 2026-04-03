'use client';

import type { CSSProperties } from 'react';
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

export function ViewInventorySheet({ isOpen, onClose, item, onEdit }: ViewInventorySheetProps) {
  if (!item) return null;

  const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.Active;
  const deptColors = departmentColor(item.departmentColor);

  return (
    <Sheet
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
