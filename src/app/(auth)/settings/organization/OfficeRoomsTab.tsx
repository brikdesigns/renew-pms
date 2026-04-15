'use client';

import { useState, type CSSProperties } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@brikdesigns/bds';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { Badge, Button, IconButton, useSheetStack } from '@brikdesigns/bds';
import { EditRoomSheet, type RoomFormData } from '@/components/EditRoomSheet';
import { useRooms, type Room } from '@/hooks/useRooms';
import { color, font, space, gap, border } from '@/lib/tokens';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';

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

interface RoomRow {
  id: string;
  name: string;
  room_type: string;
  description: string;
  is_custom: boolean;
  is_active: boolean;
  sort_order: number;
}

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
  fontFamily: font.family.label,
  fontSize: font.size.label.md,
  fontWeight: font.weight.semibold,
  color: color.text.primary,
  margin: 0,
};

const subHeaderCountStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: font.weight.medium,
  color: color.text.secondary,
  backgroundColor: color.surface.secondary,
  padding: `2px ${gap.md}`,
  borderRadius: border.radius.sm,
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
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: font.weight.medium,
  color: color.text.secondary,
};

const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };


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
  const { openSheet } = useSheetStack();
  const { rooms: apiRooms, setRooms, loading: roomsLoading } = useRooms();
  const rooms: RoomRow[] = apiRooms.map((r) => ({ ...r, description: '', is_custom: false }));
  const { showToast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomRow | null>(null);
  const [viewingRoom, setViewingRoom] = useState<RoomRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

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
    openSheet('room', {
      id: room.id,
      room: { id: room.id, name: room.name, room_type: room.room_type, description: room.description, is_custom: room.is_custom, is_active: room.is_active },
    }, { title: room.name, variant: 'floating' });
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setEditingRoom(null);
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/rooms/${deleteTarget.id}`, { method: 'DELETE' });
    if (res.ok) {
      setRooms((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      showToast({ title: 'Deleted', description: `${deleteTarget.name} has been removed.`, variant: 'success' });
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed to delete' }));
      showToast({ title: 'Error', description: err.error, variant: 'error' });
    }
    setDeleteTarget(null);
  };

  const handleSave = async (data: RoomFormData) => {
    if (editingRoom) {
      const res = await fetch(`/api/rooms/${editingRoom.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, room_type: data.room_type, is_active: data.is_active }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to update' }));
        throw new Error(err.error);
      }
      const updated: Room = await res.json();
      setRooms((prev) => prev.map((r) => r.id === editingRoom.id ? updated : r));
    } else {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, room_type: data.room_type, is_active: data.is_active }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to add room' }));
        throw new Error(err.error);
      }
      const created: Room = await res.json();
      setRooms((prev) => [...prev, created]);
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
        <Button variant="primary" size="sm" onClick={handleAddClick}>Add Room</Button>
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
              <TableHead style={{ width: '120px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell>
                  <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: color.text.primary }}>
                    {room.name}
                  </span>
                </TableCell>
                <TableCell>
                  <RoomTypeChip roomType={room.room_type} />
                </TableCell>
                <TableCell>
                  <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary }}>
                    {room.is_custom ? 'Custom' : 'Default'}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusIndicator active={room.is_active} />
                </TableCell>
                <TableCell>
                  <div style={actionBtnGroup}>
                    <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.eye} />} label={`View ${room.name}`} onClick={() => handleViewClick(room)} />
                    <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.edit} />} label={`Edit ${room.name}`} onClick={() => handleEditClick(room)} />
                    <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.trash} />} label={`Delete ${room.name}`} onClick={() => setDeleteTarget({ id: room.id, name: room.name })} />
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
      <ConfirmDeleteDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.name ?? ''}
        itemType="room"
      />
    </div>
  );
}
