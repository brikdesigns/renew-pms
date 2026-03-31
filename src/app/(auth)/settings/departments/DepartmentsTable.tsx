'use client';

import { useState, type CSSProperties } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bds/components';
import { Badge } from '@bds/components/ui/Badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faEye } from '@fortawesome/free-solid-svg-icons';
import { EditDepartmentSheet, type DepartmentFormData } from '@/components/EditDepartmentSheet';
import { ViewDepartmentSheet, type DepartmentViewData } from '@/components/ViewDepartmentSheet';
import { departmentColor } from '@/lib/tokens';

// ─── Design tokens ───────────────────────────────────────────────────────────

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_SECONDARY = 'var(--text-secondary)';
const BRAND_PRIMARY = 'var(--background-brand-primary)';

// ─── Local type ──────────────────────────────────────────────────────────────

interface DepartmentRow {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  member_count: number;
}

const SEED_DEPARTMENTS: DepartmentRow[] = [
  { id: '1', name: 'Clinical',        color: 'blue',   is_active: true, is_default: true, sort_order: 1, member_count: 4 },
  { id: '2', name: 'Front Desk',      color: 'green',  is_active: true, is_default: true, sort_order: 2, member_count: 3 },
  { id: '3', name: 'Engineering',     color: 'purple', is_active: true, is_default: true, sort_order: 3, member_count: 1 },
  { id: '4', name: 'HR',              color: 'pink',   is_active: true, is_default: true, sort_order: 4, member_count: 1 },
  { id: '5', name: 'Administration',  color: 'gold',   is_active: true, is_default: true, sort_order: 5, member_count: 2 },
  { id: '6', name: 'Sterilization',   color: 'red',    is_active: true, is_default: true, sort_order: 6, member_count: 2 },
  { id: '7', name: 'All Departments', color: 'teal',   is_active: true, is_default: true, sort_order: 7, member_count: 0 },
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

const actionBtnGroup: CSSProperties = { display: 'flex', gap: '8px', justifyContent: 'flex-end' };

const actionBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '36px', height: '36px', borderRadius: 'var(--border-radius-md)',
  backgroundColor: BRAND_PRIMARY, color: 'var(--text-on-color-dark)',
  border: 'none', cursor: 'pointer', fontSize: 'var(--body-sm)',
};


const dotBase: CSSProperties = { width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0 };

const statusWrap: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  fontFamily: 'var(--font-family-body)', fontSize: 'var(--body-sm)', fontWeight: 500,
};

const colorDot: CSSProperties = { width: '12px', height: '12px', borderRadius: '50%', display: 'inline-block', flexShrink: 0 };

// ─── Component ───────────────────────────────────────────────────────────────

export function DepartmentsTable() {
  const [departments, setDepartments] = useState<DepartmentRow[]>(SEED_DEPARTMENTS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentRow | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [viewing, setViewing] = useState<DepartmentRow | null>(null);

  const handleAdd = () => { setEditing(null); setSheetOpen(true); };
  const handleEdit = (d: DepartmentRow) => { setEditing(d); setSheetOpen(true); };
  const handleClose = () => { setSheetOpen(false); setEditing(null); };
  const handleView = (d: DepartmentRow) => { setViewing(d); setViewSheetOpen(true); };
  const handleViewClose = () => { setViewSheetOpen(false); setViewing(null); };
  const handleViewEdit = () => { if (viewing) { handleViewClose(); handleEdit(viewing); } };

  const handleSave = (data: DepartmentFormData) => {
    if (editing) {
      setDepartments((prev) => prev.map((d) =>
        d.id === editing.id ? { ...d, ...data } : d
      ));
    } else {
      setDepartments((prev) => [...prev, {
        id: crypto.randomUUID(), ...data, is_default: false,
        sort_order: prev.length + 1, member_count: 0,
      }]);
    }
  };

  const sheetData: DepartmentFormData | null = editing
    ? { name: editing.name, color: editing.color, is_active: editing.is_active }
    : null;

  return (
    <div style={wrapStyle}>
      <div style={subHeaderStyle}>
        <div style={subHeaderLeftStyle}>
          <h3 style={subHeaderTitleStyle}>Departments</h3>
          <span style={countBadge}>{departments.length}</span>
        </div>
        <button style={addBtnStyle} onClick={handleAdd}>Add Department</button>
      </div>

      <div style={tableWrap}>
        <Table size="default" flush>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead style={{ width: '100px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <span style={{ fontWeight: 500, color: TEXT_PRIMARY }}>{d.name}</span>
                </TableCell>
                <TableCell>
                  {d.color
                    ? <span style={{ ...colorDot, backgroundColor: departmentColor(d.color).base }} />
                    : <span style={{ fontSize: 'var(--body-sm)', color: TEXT_SECONDARY }}>—</span>
                  }
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: 'var(--body-sm)', color: TEXT_SECONDARY }}>{d.member_count}</span>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: 'var(--body-sm)', color: TEXT_SECONDARY }}>
                    {d.is_default ? 'Default' : 'Custom'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge status={d.is_active ? 'positive' : 'error'} size="sm">
                    {d.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div style={actionBtnGroup}>
                    <button style={actionBtn} onClick={() => handleView(d)} aria-label={`View ${d.name}`}>
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button style={actionBtn} onClick={() => handleEdit(d)} aria-label={`Edit ${d.name}`}>
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditDepartmentSheet isOpen={sheetOpen} onClose={handleClose} initialData={sheetData} onSave={handleSave} />
      <ViewDepartmentSheet
        isOpen={viewSheetOpen}
        onClose={handleViewClose}
        department={viewing ? {
          id: viewing.id,
          name: viewing.name,
          color: viewing.color,
          is_active: viewing.is_active,
          is_default: viewing.is_default,
          member_count: viewing.member_count,
        } satisfies DepartmentViewData : null}
        onEdit={handleViewEdit}
      />
    </div>
  );
}
