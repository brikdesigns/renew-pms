'use client';

import { useState, type CSSProperties } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bds/components';
import { Badge } from '@bds/components/ui/Badge';
import { Tag } from '@bds/components/ui/Tag';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { EditUserSheet, type UserFormData } from '@/components/EditUserSheet';
import { ViewUserSheet, type UserViewData } from '@/components/ViewUserSheet';
import { UserAvatar } from '@/components/UserAvatar';

// ─── Design tokens ───────────────────────────────────────────────────────────

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_SECONDARY = 'var(--text-secondary)';
const BRAND_PRIMARY = 'var(--background-brand-primary)';

// ─── Local type ──────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  system_role: string;
  practice_role: string;
  department: string;
  employee_type: string;
  shift: string;
  is_active: boolean;
  joined_at: string;
}

const SYSTEM_ROLE_LABELS: Record<string, string> = {
  platform_admin: 'Platform Admin',
  practice_admin: 'Practice Admin',
  staff: 'Staff',
};

const EMPLOYEE_TYPE_TAG: Record<string, { bg: string; color: string; label: string }> = {
  new:      { bg: 'var(--color-department-blue)',  color: 'var(--text-on-color-dark)', label: 'New Hire' },
  maturing: { bg: 'var(--color-department-gold)',  color: 'var(--text-on-color-dark)', label: 'Maturing' },
  active:   { bg: 'var(--color-department-green)', color: 'var(--text-on-color-dark)', label: 'Active' },
};

// Seed data — realistic dental practice team
const SEED_USERS: UserRow[] = [
  { id: '1',  first_name: 'Sarah',    last_name: 'Mitchell',  email: 'sarah@renewdental.com',    phone: '(555) 100-0001', system_role: 'practice_admin', practice_role: 'Owner',                department: 'Clinical',       employee_type: 'active',   shift: 'full_day', is_active: true, joined_at: '2024-01-15' },
  { id: '2',  first_name: 'Jessica',  last_name: 'Torres',    email: 'jessica@renewdental.com',  phone: '(555) 100-0002', system_role: 'practice_admin', practice_role: 'Office Manager',       department: 'Administration', employee_type: 'active',   shift: 'full_day', is_active: true, joined_at: '2024-02-01' },
  { id: '3',  first_name: 'Amanda',   last_name: 'Chen',      email: 'amanda@renewdental.com',   phone: '(555) 100-0003', system_role: 'staff',          practice_role: 'Dental Hygienist',    department: 'Clinical',       employee_type: 'active',   shift: 'opening',  is_active: true, joined_at: '2024-03-10' },
  { id: '4',  first_name: 'Marcus',   last_name: 'Williams',  email: 'marcus@renewdental.com',   phone: '(555) 100-0004', system_role: 'staff',          practice_role: 'Dental Hygienist',    department: 'Clinical',       employee_type: 'active',   shift: 'closing',  is_active: true, joined_at: '2024-04-01' },
  { id: '5',  first_name: 'Emily',    last_name: 'Rivera',    email: 'emily@renewdental.com',    phone: '(555) 100-0005', system_role: 'staff',          practice_role: 'Dental Assistant',     department: 'Clinical',       employee_type: 'maturing', shift: 'opening',  is_active: true, joined_at: '2025-09-15' },
  { id: '6',  first_name: 'Tyler',    last_name: 'Nguyen',    email: 'tyler@renewdental.com',    phone: '(555) 100-0006', system_role: 'staff',          practice_role: 'Dental Assistant',     department: 'Sterilization',  employee_type: 'active',   shift: 'closing',  is_active: true, joined_at: '2024-06-01' },
  { id: '7',  first_name: 'Rachel',   last_name: 'Foster',    email: 'rachel@renewdental.com',   phone: '(555) 100-0007', system_role: 'staff',          practice_role: 'Receptionist',         department: 'Front Desk',     employee_type: 'active',   shift: 'full_day', is_active: true, joined_at: '2024-07-15' },
  { id: '8',  first_name: 'David',    last_name: 'Park',      email: 'david@renewdental.com',    phone: '(555) 100-0008', system_role: 'staff',          practice_role: 'Treatment Coordinator', department: 'Front Desk',    employee_type: 'active',   shift: 'full_day', is_active: true, joined_at: '2024-08-01' },
  { id: '9',  first_name: 'Lisa',     last_name: 'Gomez',     email: 'lisa@renewdental.com',     phone: '(555) 100-0009', system_role: 'staff',          practice_role: 'Insurance Coordinator', department: 'Front Desk',    employee_type: 'active',   shift: 'full_day', is_active: true, joined_at: '2024-09-10' },
  { id: '10', first_name: 'Jordan',   last_name: 'Hayes',     email: 'jordan@renewdental.com',   phone: '(555) 100-0010', system_role: 'staff',          practice_role: 'Inventory Manager',    department: 'Engineering',    employee_type: 'new',      shift: '',         is_active: true, joined_at: '2026-02-01' },
];

// ─── Styles ──────────────────────────────────────────────────────────────────

const wrapStyle: CSSProperties = { display: 'flex', flexDirection: 'column', flex: 1, paddingInline: '32px' };
const subHeaderStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '16px 0', borderBottom: '1px solid var(--border-muted)',
};
const subHeaderLeftStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' };
const subHeaderTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-family-body)', fontSize: '16px', fontWeight: 600, color: TEXT_PRIMARY, margin: 0,
};
const countBadge: CSSProperties = {
  fontFamily: 'var(--font-family-body)', fontSize: 'var(--body-sm)', fontWeight: 500,
  color: TEXT_SECONDARY, backgroundColor: 'var(--surface-secondary)', padding: '2px 8px', borderRadius: '4px',
};
const addBtnStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  height: '36px', paddingInline: '14px', borderRadius: '8px',
  backgroundColor: BRAND_PRIMARY, color: 'var(--text-on-color-dark)',
  fontFamily: 'var(--font-family-body)', fontSize: 'var(--body-sm)', fontWeight: 700,
  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
};
const tableWrap: CSSProperties = { flex: 1, overflowX: 'auto' };
const actionBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '36px', height: '36px', borderRadius: 'var(--border-radius-md)',
  backgroundColor: BRAND_PRIMARY, color: 'var(--text-on-color-dark)',
  border: 'none', cursor: 'pointer', fontSize: 'var(--body-sm)',
};
const actionBtnGroup: CSSProperties = { display: 'flex', gap: '8px', justifyContent: 'flex-end' };
const dotBase: CSSProperties = { width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0 };
const statusWrap: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  fontFamily: 'var(--font-family-body)', fontSize: 'var(--body-sm)', fontWeight: 500,
};

// Avatar rendering moved to shared UserAvatar component

const nameWrap: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function UsersTable() {
  const [users, setUsers] = useState<UserRow[]>(SEED_USERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<UserRow | null>(null);

  const handleAdd = () => { setEditing(null); setSheetOpen(true); };
  const handleEdit = (u: UserRow) => { setEditing(u); setSheetOpen(true); };
  const handleClose = () => { setSheetOpen(false); setEditing(null); };

  const handleView = (u: UserRow) => { setViewing(u); setViewOpen(true); };
  const handleViewClose = () => { setViewOpen(false); setViewing(null); };
  const handleViewEdit = () => { if (viewing) { handleViewClose(); handleEdit(viewing); } };

  const handleSave = (data: UserFormData) => {
    if (editing) {
      setUsers((prev) => prev.map((u) =>
        u.id === editing.id ? { ...u, ...data } : u
      ));
    } else {
      setUsers((prev) => [...prev, {
        id: crypto.randomUUID(), ...data, joined_at: new Date().toISOString().split('T')[0],
      }]);
    }
  };

  const sheetData: UserFormData | null = editing
    ? {
        first_name: editing.first_name, last_name: editing.last_name,
        email: editing.email, phone: editing.phone,
        system_role: editing.system_role, practice_role: editing.practice_role,
        department: editing.department, employee_type: editing.employee_type,
        shift: editing.shift, is_active: editing.is_active,
      }
    : null;

  const viewData: UserViewData | null = viewing
    ? {
        id: viewing.id,
        first_name: viewing.first_name, last_name: viewing.last_name,
        email: viewing.email, phone: viewing.phone,
        system_role: viewing.system_role, practice_role: viewing.practice_role,
        department: viewing.department, employee_type: viewing.employee_type,
        shift: viewing.shift, is_active: viewing.is_active, joined_at: viewing.joined_at,
      }
    : null;

  return (
    <div style={wrapStyle}>
      <div style={subHeaderStyle}>
        <div style={subHeaderLeftStyle}>
          <h3 style={subHeaderTitleStyle}>Users</h3>
          <span style={countBadge}>{users.length}</span>
        </div>
        <button style={addBtnStyle} onClick={handleAdd}>Invite User</button>
      </div>

      <div style={tableWrap}>
        <Table size="default" flush>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Permission</TableHead>
              <TableHead>Employee Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead style={{ width: '100px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const empType = EMPLOYEE_TYPE_TAG[u.employee_type] ?? EMPLOYEE_TYPE_TAG.new;
              const fullName = `${u.first_name} ${u.last_name}`;
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div style={nameWrap}>
                      <UserAvatar name={fullName} department={u.department} size="sm" />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500, color: TEXT_PRIMARY, fontSize: 'var(--body-md)', lineHeight: 1.2 }}>
                          {u.first_name} {u.last_name}
                        </span>
                        <span style={{ fontSize: 'var(--body-sm)', color: TEXT_SECONDARY, lineHeight: 1.2 }}>
                          {u.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: 'var(--body-sm)', color: TEXT_SECONDARY }}>
                      {u.practice_role || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: 'var(--body-sm)', color: TEXT_SECONDARY }}>
                      {u.department || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: 'var(--body-sm)', color: TEXT_SECONDARY }}>
                      {SYSTEM_ROLE_LABELS[u.system_role] ?? u.system_role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Tag size="sm" style={{ backgroundColor: empType.bg, color: empType.color }}>{empType.label}</Tag>
                  </TableCell>
                  <TableCell>
                    <Badge status={u.is_active ? 'positive' : 'error'} size="sm">
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div style={actionBtnGroup}>
                      <button style={actionBtn} onClick={() => handleView(u)} aria-label={`View ${u.first_name}`}>
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button style={actionBtn} onClick={() => handleEdit(u)} aria-label={`Edit ${u.first_name}`}>
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <EditUserSheet isOpen={sheetOpen} onClose={handleClose} initialData={sheetData} onSave={handleSave} />
      <ViewUserSheet isOpen={viewOpen} onClose={handleViewClose} user={viewData} onEdit={handleViewEdit} />
    </div>
  );
}
