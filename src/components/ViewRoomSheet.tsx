'use client';

import type { CSSProperties } from 'react';
import { Sheet } from '@bds/components';
import { Badge } from '@bds/components';
import { color, font } from '@/lib/tokens';
import { sheetBodyStyle, sheetSectionTitle } from '@/app/(auth)/settings/_sheetStyles';
import { ReadOnlyField } from '@/components/ReadOnlyField';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RoomViewData {
  id: string;
  name: string;
  room_type: string;
  description: string;
  is_custom: boolean;
  is_active: boolean;
}

interface ViewRoomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomViewData | null;
}

// ─── Label maps ─────────────────────────────────────────────────────────────

const ROOM_TYPE_LABELS: Record<string, string> = {
  lobby: 'Lobby',
  front_office: 'Front Office',
  waiting_area: 'Waiting Area',
  operatory: 'Operatory',
  sterilization_room: 'Sterilization Room',
  xray_room: 'X-Ray Room',
  lab: 'Lab',
  consultation_room: 'Consultation Room',
  supply_storage: 'Supply / Storage',
  break_room: 'Break Room',
  restroom: 'Restroom',
  other: 'Other',
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const dotBase: CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  display: 'inline-block',
  flexShrink: 0,
};

const statusWrap: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  fontWeight: 500,
};


// ─── Component ──────────────────────────────────────────────────────────────

export function ViewRoomSheet({ isOpen, onClose, room }: ViewRoomSheetProps) {
  if (!room) return null;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={room.name}
      width="600px"
      side="right"
      footer={
        <button type="button" className="renew-btn renew-btn--ghost" onClick={onClose}>Close</button>
      }
    >
      <div style={sheetBodyStyle}>
        <h3 style={sheetSectionTitle}>Room Details</h3>
        <ReadOnlyField label="Name" value={room.name} />
        <ReadOnlyField label="Type" value={ROOM_TYPE_LABELS[room.room_type] || room.room_type} />
        {room.description && (
          <ReadOnlyField label="Description" value={room.description} />
        )}
        <ReadOnlyField label="Source" value={room.is_custom ? 'Custom' : 'Default'} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontFamily: font.family.label, fontSize: font.size.body.sm, fontWeight: 500, color: color.text.primary }}>
            Status
          </span>
          <div style={{ display: 'inline-flex' }}>
            <Badge status={room.is_active ? 'positive' : 'error'} size="sm">
              {room.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
