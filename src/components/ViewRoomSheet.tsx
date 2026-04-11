'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { Badge, Button, useConfigureSheet } from '@bds/components';
import { color, font, gap } from '@/lib/tokens';
import { sheetBodyStyle, sheetSectionTitle } from '@/app/(auth)/settings/_sheetStyles';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import { SheetSkeleton } from '@/components/SheetSkeleton';

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
  onClose: () => void;
  /** Full room data (page-level mode — skips fetch) */
  room?: RoomViewData | null;
  /** Room ID (global mode — fetches data) */
  id?: string;
  /** Navigate to a related entity (global sheet stack) */
  onNavigate?: (type: string, props: Record<string, unknown>, opts?: { title?: string }) => void;
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

// ─── Component ──────────────────────────────────────────────────────────────

export function ViewRoomSheet({ onClose, room: roomProp, id, onNavigate }: ViewRoomSheetProps) {
  const configureSheet = useConfigureSheet();
  const [fetched, setFetched] = useState<RoomViewData | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Global mode: fetch by ID when no data prop is given
  const resolvedId = id ?? roomProp?.id;
  useEffect(() => {
    if (roomProp || !resolvedId) return;
    setFetchLoading(true);
    fetch(`/api/rooms/${resolvedId}`)
      .then(r => r.json())
      .then(data => { if (data && !data.error) setFetched(data); })
      .catch(err => console.error('[ViewRoomSheet] fetch failed:', err))
      .finally(() => setFetchLoading(false));
  }, [resolvedId, roomProp]);

  const room = roomProp ?? fetched;

  useLayoutEffect(() => {
    if (fetchLoading || !room) {
      configureSheet({
        body: <SheetSkeleton />,
        footer: <Button variant="ghost" size="md" type="button" onClick={onClose}>Close</Button>,
      });
      return;
    }

    configureSheet({
      title: room.name,
      body: (
        <div style={sheetBodyStyle}>
          <h3 style={sheetSectionTitle}>Room Details</h3>
          <ReadOnlyField label="Name" value={room.name} />
          <ReadOnlyField label="Type" value={ROOM_TYPE_LABELS[room.room_type] || room.room_type} />
          {room.description && (
            <ReadOnlyField label="Description" value={room.description} />
          )}
          <ReadOnlyField label="Source" value={room.is_custom ? 'Custom' : 'Default'} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
            <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: color.text.primary }}>
              Status
            </span>
            <div style={{ display: 'inline-flex' }}>
              <Badge status={room.is_active ? 'positive' : 'error'} size="sm">
                {room.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      ),
      footer: <Button variant="ghost" size="md" type="button" onClick={onClose}>Close</Button>,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configureSheet, fetchLoading, room?.id, room?.name, room?.is_active, onClose]);

  return null;
}
