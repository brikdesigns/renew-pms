'use client';

import { useState, type CSSProperties } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bds/components';
import { Badge } from '@bds/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { EditRoleSheet, type RoleFormData } from '@/components/EditRoleSheet';
import { ViewRoleSheet, type RoleViewData } from '@/components/ViewRoleSheet';
import { color, font, space, gap, border } from '@/lib/tokens';

// ─── Local type ──────────────────────────────────────────────────────────────

interface RoleRow {
  id: string;
  name: string;
  department: string;
  description: string;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  member_count: number;
}

// Seed data from schema: seed_practice_defaults
const SEED_ROLES: RoleRow[] = [
  { id: '1',  name: 'Owner',                 department: 'Clinical',       description: 'Practice owner / lead dentist', is_default: true, is_active: true, sort_order: 1,  member_count: 1 },
  { id: '2',  name: 'Office Manager',        department: 'Administration', description: 'Oversees daily operations and staff coordination', is_default: true, is_active: true, sort_order: 2,  member_count: 1 },
  { id: '3',  name: 'Dental Hygienist',      department: 'Clinical',       description: 'Patient cleanings, periodontal care, patient education', is_default: true, is_active: true, sort_order: 3,  member_count: 2 },
  { id: '4',  name: 'Dental Assistant',       department: 'Clinical',       description: 'Chairside assistance, sterilization, patient prep', is_default: true, is_active: true, sort_order: 4,  member_count: 2 },
  { id: '5',  name: 'Receptionist',           department: 'Front Desk',     description: 'Patient check-in, scheduling, phone management', is_default: true, is_active: true, sort_order: 5,  member_count: 1 },
  { id: '6',  name: 'Treatment Coordinator',  department: 'Front Desk',     description: 'Treatment plan presentation and patient follow-up', is_default: true, is_active: true, sort_order: 6,  member_count: 1 },
  { id: '7',  name: 'Insurance Coordinator',  department: 'Front Desk',     description: 'Claims processing, benefits verification, billing', is_default: true, is_active: true, sort_order: 7,  member_count: 1 },
  { id: '8',  name: 'Engineer',               department: 'Engineering',    description: 'Equipment maintenance, IT systems, technical support', is_default: true, is_active: true, sort_order: 8,  member_count: 0 },
  { id: '9',  name: 'Inventory Manager',      department: 'Engineering',    description: 'Supply ordering, stock tracking, vendor management', is_default: true, is_active: true, sort_order: 9,  member_count: 1 },
  { id: '10', name: 'Manager',                department: 'All Departments', description: 'Cross-department management and oversight', is_default: true, is_active: true, sort_order: 10, member_count: 0 },
  { id: '11', name: 'Admin',                  department: 'All Departments', description: 'Administrative access across the practice', is_default: true, is_active: true, sort_order: 11, member_count: 0 },
  { id: '12', name: 'Staff',                  department: 'All Departments', description: 'General staff member', is_default: true, is_active: true, sort_order: 12, member_count: 0 },
];

// ─── Styles ──────────────────────────────────────────────────────────────────

const wrapStyle: CSSProperties = { display: 'flex', flexDirection: 'column', flex: 1, paddingInline: space.xl };

const subHeaderStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: `${space.md} 0`, borderBottom: `1px solid ${color.border.muted}`,
};
const subHeaderLeftStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: space.sm };
const subHeaderTitleStyle: CSSProperties = {
  fontFamily: font.family.body, fontSize: font.size.body.md, fontWeight: 600, color: color.text.primary, margin: 0,
};
const countBadge: CSSProperties = {
  fontFamily: font.family.body, fontSize: font.size.body.sm, fontWeight: 500,
  color: color.text.secondary, backgroundColor: color.surface.secondary, padding: `2px ${gap.md}`, borderRadius: border.radius.sm,
};
const addBtnStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  height: '36px', paddingInline: '14px', borderRadius: border.radius.sm,
  backgroundColor: color.background.brandPrimary, color: color.text.onColorDark,
  fontFamily: font.family.body, fontSize: font.size.body.sm, fontWeight: 700,
  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
};
const tableWrap: CSSProperties = { flex: 1, overflowX: 'auto' };
const actionBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '36px', height: '36px', borderRadius: border.radius.md,
  backgroundColor: color.background.brandPrimary, color: color.text.onColorDark,
  border: 'none', cursor: 'pointer', fontSize: font.size.body.sm,
};
const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };
const dotBase: CSSProperties = { width: '8px', height: '8px', borderRadius: border.radius.circle, display: 'inline-block', flexShrink: 0 };
const statusWrap: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: gap.sm,
  fontFamily: font.family.body, fontSize: font.size.body.sm, fontWeight: 500,
};

// ─── Component ───────────────────────────────────────────────────────────────

export function RolesTable() {
  const [roles, setRoles] = useState<RoleRow[]>(SEED_ROLES);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<RoleRow | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [viewing, setViewing] = useState<RoleRow | null>(null);

  const handleAdd = () => { setEditing(null); setSheetOpen(true); };
  const handleEdit = (r: RoleRow) => { setEditing(r); setSheetOpen(true); };
  const handleClose = () => { setSheetOpen(false); setEditing(null); };
  const handleView = (r: RoleRow) => { setViewing(r); setViewSheetOpen(true); };
  const handleViewClose = () => { setViewSheetOpen(false); setViewing(null); };
  const handleViewEdit = () => { if (viewing) { handleViewClose(); handleEdit(viewing); } };

  const handleSave = (data: RoleFormData) => {
    if (editing) {
      setRoles((prev) => prev.map((r) =>
        r.id === editing.id ? { ...r, ...data } : r
      ));
    } else {
      setRoles((prev) => [...prev, {
        id: crypto.randomUUID(), ...data, is_default: false,
        sort_order: prev.length + 1, member_count: 0,
      }]);
    }
  };

  const sheetData: RoleFormData | null = editing
    ? { name: editing.name, department: editing.department, description: editing.description, is_active: editing.is_active }
    : null;

  const viewData: RoleViewData | null = viewing
    ? { id: viewing.id, name: viewing.name, department: viewing.department, description: viewing.description, is_default: viewing.is_default, is_active: viewing.is_active, member_count: viewing.member_count }
    : null;

  return (
    <div style={wrapStyle}>
      <div style={subHeaderStyle}>
        <div style={subHeaderLeftStyle}>
          <h3 style={subHeaderTitleStyle}>Practice Roles</h3>
          <span style={countBadge}>{roles.length}</span>
        </div>
        <button style={addBtnStyle} onClick={handleAdd}>Add Role</button>
      </div>

      <div style={tableWrap}>
        <Table size="default" flush>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead style={{ width: '100px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <span style={{ fontWeight: 500, color: color.text.primary }}>{r.name}</span>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: font.size.body.sm, color: color.text.secondary }}>{r.department}</span>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: font.size.body.sm, color: color.text.secondary }}>{r.member_count}</span>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: font.size.body.sm, color: color.text.secondary }}>
                    {r.is_default ? 'Default' : 'Custom'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge status={r.is_active ? 'positive' : 'error'} size="sm">
                    {r.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div style={actionBtnGroup}>
                    <button style={actionBtn} onClick={() => handleView(r)} aria-label={`View ${r.name}`}>
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button style={actionBtn} onClick={() => handleEdit(r)} aria-label={`Edit ${r.name}`}>
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditRoleSheet isOpen={sheetOpen} onClose={handleClose} initialData={sheetData} onSave={handleSave} />
      <ViewRoleSheet isOpen={viewSheetOpen} onClose={handleViewClose} role={viewData} onEdit={handleViewEdit} />
    </div>
  );
}
