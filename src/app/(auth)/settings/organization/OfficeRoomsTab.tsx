'use client';

import { useState, type CSSProperties } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@bds/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDoorOpen,
  faDesktop,
  faCouch,
  faTeeth,
  faFlask,
  faBroom,
  faBoxes,
  faRestroom,
  faCoffee,
  faComments,
  faXRay,
  faEye,
  faPenToSquare,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Badge } from '@bds/components/ui/Badge';
import { EditRoomSheet, type RoomFormData } from '@/components/EditRoomSheet';
import { ViewRoomSheet, type RoomViewData } from '@/components/ViewRoomSheet';
import { SEED_ROOMS, type SeedRoom } from '@/lib/seed-rooms';

// ─── Design tokens ───────────────────────────────────────────────────────────

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_SECONDARY = 'var(--text-secondary)';
const BORDER_ACCENT = 'var(--border-primary)';
const BRAND_PRIMARY = 'var(--background-brand-primary)';

// ─── Room type display mapping ───────────────────────────────────────────────

const ROOM_TYPE_META: Record<string, { label: string; icon: IconDefinition }> = {
  lobby: { label: 'Lobby', icon: faDoorOpen },
  front_office: { label: 'Front Office', icon: faDesktop },
  waiting_area: { label: 'Waiting Area', icon: faCouch },
  operatory: { label: 'Operatory', icon: faTeeth },
  sterilization_room: { label: 'Sterilization', icon: faBroom },
  xray_room: { label: 'X-Ray Room', icon: faXRay },
  lab: { label: 'Lab', icon: faFlask },
  consultation_room: { label: 'Consultation', icon: faComments },
  supply_storage: { label: 'Supply / Storage', icon: faBoxes },
  break_room: { label: 'Break Room', icon: faCoffee },
  restroom: { label: 'Restroom', icon: faRestroom },
  other: { label: 'Other', icon: faDoorOpen },
};

// ─── Local room type alias ──────────────────────────────────────────────────

type RoomRow = SeedRoom;

// ─── Styles ──────────────────────────────────────────────────────────────────

const tabContentStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
};

const subHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 32px',
  borderBottom: `1px solid ${BORDER_ACCENT}`,
};

const subHeaderLeftStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const subHeaderTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-family-body)',
  fontSize: '16px',
  fontWeight: 600,
  color: TEXT_PRIMARY,
  margin: 0,
};

const subHeaderCountStyle: CSSProperties = {
  fontFamily: 'var(--font-family-body)',
  fontSize: 'var(--body-sm)',
  fontWeight: 500,
  color: TEXT_SECONDARY,
  backgroundColor: 'var(--surface-secondary)',
  padding: '2px 8px',
  borderRadius: '4px',
};

const addRoomBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '36px',
  paddingInline: '14px',
  borderRadius: '8px',
  backgroundColor: BRAND_PRIMARY,
  color: 'var(--text-on-color-dark)',
  fontFamily: 'var(--font-family-body)',
  fontSize: 'var(--body-sm)',
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const tableWrapperStyle: CSSProperties = {
  flex: 1,
  overflowX: 'auto',
  padding: '0 32px 32px',
};

const typeChipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontFamily: 'var(--font-family-body)',
  fontSize: 'var(--body-sm)',
  fontWeight: 500,
  color: TEXT_SECONDARY,
};

const statusDotBase: CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  display: 'inline-block',
  flexShrink: 0,
};

const statusWrapperStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontFamily: 'var(--font-family-body)',
  fontSize: 'var(--body-sm)',
  fontWeight: 500,
};

const actionBtnGroup: CSSProperties = { display: 'flex', gap: '8px', justifyContent: 'flex-end' };

const actionBtnStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '36px', height: '36px', borderRadius: 'var(--border-radius-md)',
  backgroundColor: 'var(--background-brand-primary)', color: 'var(--text-on-color-dark)',
  border: 'none', cursor: 'pointer', fontSize: 'var(--body-sm)',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function RoomTypeChip({ roomType }: { roomType: string }) {
  const meta = ROOM_TYPE_META[roomType] ?? ROOM_TYPE_META.other;
  return (
    <span style={typeChipStyle}>
      <FontAwesomeIcon icon={meta.icon} style={{ fontSize: 'var(--body-xs)' }} />
      {meta.label}
    </span>
  );
}

function StatusIndicator({ active }: { active: boolean }) {
  return (
    <Badge status={active ? 'positive' : 'error'} size="sm">
      {active ? 'Active' : 'Inactive'}
    </Badge>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OfficeRoomsTab() {
  const [rooms, setRooms] = useState<RoomRow[]>(SEED_ROOMS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomRow | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [viewingRoom, setViewingRoom] = useState<RoomRow | null>(null);

  const handleAddClick = () => {
    setEditingRoom(null);
    setSheetOpen(true);
  };

  const handleEditClick = (room: RoomRow) => {
    setEditingRoom(room);
    setSheetOpen(true);
  };

  const handleViewClick = (room: RoomRow) => {
    setViewingRoom(room);
    setViewSheetOpen(true);
  };

  const handleViewClose = () => {
    setViewSheetOpen(false);
    setViewingRoom(null);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setEditingRoom(null);
  };

  const handleSave = (data: RoomFormData) => {
    if (editingRoom) {
      // Edit existing
      setRooms((prev) =>
        prev.map((r) =>
          r.id === editingRoom.id
            ? { ...r, name: data.name, room_type: data.room_type, is_active: data.is_active, description: data.description }
            : r
        )
      );
    } else {
      // Add new
      const newRoom: RoomRow = {
        id: crypto.randomUUID(),
        name: data.name,
        room_type: data.room_type,
        description: data.description,
        is_custom: true,
        is_active: data.is_active,
        sort_order: rooms.length + 1,
      };
      setRooms((prev) => [...prev, newRoom]);
    }
  };

  const sheetInitialData: RoomFormData | null = editingRoom
    ? {
        name: editingRoom.name,
        room_type: editingRoom.room_type,
        is_active: editingRoom.is_active,
        description: editingRoom.description,
      }
    : null;

  return (
    <div style={tabContentStyle}>
      {/* Sub-header */}
      <div style={subHeaderStyle}>
        <div style={subHeaderLeftStyle}>
          <h3 style={subHeaderTitleStyle}>Rooms</h3>
          <span style={subHeaderCountStyle}>{rooms.length}</span>
        </div>
        <button style={addRoomBtnStyle} onClick={handleAddClick}>
          Add Room
        </button>
      </div>

      {/* Rooms table */}
      <div style={tableWrapperStyle}>
        <Table size="default">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead style={{ width: '100px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell>
                  <span style={{ fontWeight: 500, color: TEXT_PRIMARY }}>
                    {room.name}
                  </span>
                </TableCell>
                <TableCell>
                  <RoomTypeChip roomType={room.room_type} />
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: 'var(--body-sm)', color: TEXT_SECONDARY }}>
                    {room.is_custom ? 'Custom' : 'Default'}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusIndicator active={room.is_active} />
                </TableCell>
                <TableCell>
                  <div style={actionBtnGroup}>
                    <button
                      style={actionBtnStyle}
                      onClick={() => handleViewClick(room)}
                      aria-label={`View ${room.name}`}
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button
                      style={actionBtnStyle}
                      onClick={() => handleEditClick(room)}
                      aria-label={`Edit ${room.name}`}
                    >
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditRoomSheet
        isOpen={sheetOpen}
        onClose={handleSheetClose}
        initialData={sheetInitialData}
        onSave={handleSave}
      />
      <ViewRoomSheet
        isOpen={viewSheetOpen}
        onClose={handleViewClose}
        room={viewingRoom ? {
          id: viewingRoom.id,
          name: viewingRoom.name,
          room_type: viewingRoom.room_type,
          description: viewingRoom.description,
          is_custom: viewingRoom.is_custom,
          is_active: viewingRoom.is_active,
        } : null}
      />
    </div>
  );
}
