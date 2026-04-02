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
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { Badge } from '@bds/components';
import { EditRoomSheet, type RoomFormData } from '@/components/EditRoomSheet';
import { ViewRoomSheet, type RoomViewData } from '@/components/ViewRoomSheet';
import { SEED_ROOMS, type SeedRoom } from '@/lib/seed-rooms';
import { color, font, space, gap, border } from '@/lib/tokens';

// ─── Room type display mapping ───────────────────────────────────────────────

const ROOM_TYPE_META: Record<string, { label: string; icon: string }> = {
  lobby:              { label: 'Lobby',          icon: icon.roomLobby },
  front_office:       { label: 'Front Office',   icon: icon.roomFrontOffice },
  waiting_area:       { label: 'Waiting Area',   icon: icon.roomWaiting },
  operatory:          { label: 'Operatory',      icon: icon.roomOperatory },
  sterilization_room: { label: 'Sterilization',  icon: icon.roomSterilization },
  xray_room:          { label: 'X-Ray Room',     icon: icon.roomXray },
  lab:                { label: 'Lab',            icon: icon.roomLab },
  consultation_room:  { label: 'Consultation',   icon: icon.roomConsultation },
  supply_storage:     { label: 'Supply / Storage', icon: icon.roomStorage },
  break_room:         { label: 'Break Room',     icon: icon.roomBreak },
  restroom:           { label: 'Restroom',       icon: icon.roomRestroom },
  other:              { label: 'Other',          icon: icon.roomLobby },
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
  padding: `${space.md} ${space.xl}`,
  borderBottom: `1px solid ${color.border.primary}`,
};

const subHeaderLeftStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: space.sm,
};

const subHeaderTitleStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  fontWeight: 600,
  color: color.text.primary,
  margin: 0,
};

const subHeaderCountStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  fontWeight: 500,
  color: color.text.secondary,
  backgroundColor: color.surface.secondary,
  padding: `2px ${gap.md}`,
  borderRadius: border.radius.sm,
};

const addRoomBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '36px',
  paddingInline: '14px',
  borderRadius: border.radius.sm,
  backgroundColor: color.background.brandPrimary,
  color: color.text.onColorDark,
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const tableWrapperStyle: CSSProperties = {
  flex: 1,
  overflowX: 'auto',
  padding: `0 ${space.xl} ${space.xl}`,
};

const typeChipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: gap.sm,
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  fontWeight: 500,
  color: color.text.secondary,
};

const statusDotBase: CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: border.radius.circle,
  display: 'inline-block',
  flexShrink: 0,
};

const statusWrapperStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: gap.sm,
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  fontWeight: 500,
};

const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };

const actionBtnStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '36px', height: '36px', borderRadius: border.radius.md,
  backgroundColor: color.background.brandPrimary, color: color.text.onColorDark,
  border: 'none', cursor: 'pointer', fontSize: font.size.body.sm,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function RoomTypeChip({ roomType }: { roomType: string }) {
  const meta = ROOM_TYPE_META[roomType] ?? ROOM_TYPE_META.other;
  return (
    <span style={typeChipStyle}>
      <Icon icon={meta.icon} style={{ fontSize: font.size.body.xs }} />
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
                  <span style={{ fontWeight: 500, color: color.text.primary }}>
                    {room.name}
                  </span>
                </TableCell>
                <TableCell>
                  <RoomTypeChip roomType={room.room_type} />
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: font.size.body.sm, color: color.text.secondary }}>
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
                      <Icon icon={icon.eye} />
                    </button>
                    <button
                      style={actionBtnStyle}
                      onClick={() => handleEditClick(room)}
                      aria-label={`Edit ${room.name}`}
                    >
                      <Icon icon={icon.edit} />
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
