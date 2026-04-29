'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { Badge, Button, useConfigureSheet, Field, FieldGrid } from '@brikdesigns/bds';
import { sheetBodyStyle, sheetSectionTitle } from '@/app/(auth)/settings/_sheetStyles';
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
          <FieldGrid columns={2} gap="lg">
            <Field label="Name" empty="—">{room.name}</Field>
            <Field label="Type" empty="—">{ROOM_TYPE_LABELS[room.room_type] || room.room_type}</Field>
          </FieldGrid>
          {room.description && (
            <Field label="Description" empty="—">{room.description}</Field>
          )}
          <FieldGrid columns={2} gap="lg">
            <Field label="Source" empty="—">{room.is_custom ? 'Custom' : 'Default'}</Field>
            <Field label="Status" empty="—">
              <Badge status={room.is_active ? 'positive' : 'error'} size="sm">
                {room.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </Field>
          </FieldGrid>
        </div>
      ),
      footer: <Button variant="ghost" size="md" type="button" onClick={onClose}>Close</Button>,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configureSheet, fetchLoading, room?.id, room?.name, room?.is_active, onClose]);

  return null;
}
