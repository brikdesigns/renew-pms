'use client';

import { useState, type CSSProperties } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bds/components';
import { Badge } from '@bds/components';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { EditDepartmentSheet, type DepartmentFormData } from '@/components/EditDepartmentSheet';
import { ViewDepartmentSheet, type DepartmentViewData } from '@/components/ViewDepartmentSheet';
import { color, font, space, gap, border, departmentColor } from '@/lib/tokens';

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

const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };

const actionBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '36px', height: '36px', borderRadius: border.radius.md,
  backgroundColor: color.background.brandPrimary, color: color.text.onColorDark,
  border: 'none', cursor: 'pointer', fontSize: font.size.body.sm,
};

const dotBase: CSSProperties = { width: '8px', height: '8px', borderRadius: border.radius.circle, display: 'inline-block', flexShrink: 0 };

const statusWrap: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: gap.sm,
  fontFamily: font.family.body, fontSize: font.size.body.sm, fontWeight: 500,
};

const colorDot: CSSProperties = { width: '12px', height: '12px', borderRadius: border.radius.circle, display: 'inline-block', flexShrink: 0 };

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
                  <span style={{ fontWeight: 500, color: color.text.primary }}>{d.name}</span>
                </TableCell>
                <TableCell>
                  {d.color
                    ? <span style={{ ...colorDot, backgroundColor: departmentColor(d.color).base }} />
                    : <span style={{ fontSize: font.size.body.sm, color: color.text.secondary }}>—</span>
                  }
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: font.size.body.sm, color: color.text.secondary }}>{d.member_count}</span>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: font.size.body.sm, color: color.text.secondary }}>
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
                      <Icon icon={icon.eye} />
                    </button>
                    <button style={actionBtn} onClick={() => handleEdit(d)} aria-label={`Edit ${d.name}`}>
                      <Icon icon={icon.edit} />
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
