// ─── Shared room seed data ──────────────────────────────────────────────────
// Single source of truth consumed by OfficeRoomsTab, InventoryTable, and sheets.
// Will be replaced by Supabase query once wired.

export interface SeedRoom {
  id: string;
  name: string;
  room_type: string;
  description: string;
  is_custom: boolean;
  is_active: boolean;
  sort_order: number;
}

export const SEED_ROOMS: SeedRoom[] = [
  { id: '1', name: 'Lobby', room_type: 'lobby', description: '', is_custom: false, is_active: true, sort_order: 1 },
  { id: '2', name: 'Front Office', room_type: 'front_office', description: '', is_custom: false, is_active: true, sort_order: 2 },
  { id: '3', name: 'Waiting Area', room_type: 'waiting_area', description: '', is_custom: false, is_active: true, sort_order: 3 },
  { id: '4', name: 'Operatory', room_type: 'operatory', description: '', is_custom: false, is_active: true, sort_order: 4 },
  { id: '5', name: 'Sterilization Room', room_type: 'sterilization_room', description: '', is_custom: false, is_active: true, sort_order: 5 },
  { id: '6', name: 'X-Ray Room', room_type: 'xray_room', description: '', is_custom: false, is_active: true, sort_order: 6 },
  { id: '7', name: 'Lab', room_type: 'lab', description: '', is_custom: false, is_active: true, sort_order: 7 },
  { id: '8', name: 'Consultation Room', room_type: 'consultation_room', description: '', is_custom: false, is_active: true, sort_order: 8 },
  { id: '9', name: 'Supply / Storage', room_type: 'supply_storage', description: '', is_custom: false, is_active: true, sort_order: 9 },
  { id: '10', name: 'Break Room', room_type: 'break_room', description: '', is_custom: false, is_active: true, sort_order: 10 },
  { id: '11', name: 'Restroom', room_type: 'restroom', description: '', is_custom: false, is_active: true, sort_order: 11 },
];

/** Room options for Select dropdowns (active rooms only) */
export const ROOM_OPTIONS = [
  { label: '— None —', value: '' },
  ...SEED_ROOMS.filter((r) => r.is_active).map((r) => ({ label: r.name, value: r.id })),
];

/** Look up room name by ID */
export function getRoomName(roomId: string): string {
  return SEED_ROOMS.find((r) => r.id === roomId)?.name ?? '';
}
