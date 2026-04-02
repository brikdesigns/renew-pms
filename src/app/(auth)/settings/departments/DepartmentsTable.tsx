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
import { useDepartments } from '@/hooks/useDepartments';
import type { Department } from '@/hooks/useDepartments';

// ─── Styles ──────────────────────────────────────────────────────────────────

const wrapStyle: CSSProperties = { display: 'flex', flexDirection: 'column', flex: 1, paddingInline: space.xl };

const subHeaderStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: `${space.md} 0`, borderBottom: `1px solid ${color.border.muted}`,
};

const subHeaderLeftStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: space.sm };

const subHeaderTitleStyle: CSSProperties = {
  fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.semibold, color: color.text.primary, margin: 0,
};

const countBadge: CSSProperties = {
  fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium,
  color: color.text.secondary, backgroundColor: color.surface.secondary, padding: `2px ${gap.md}`, borderRadius: border.radius.sm,
};

const addBtnStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  height: '36px', paddingInline: '14px', borderRadius: border.radius.sm,
  backgroundColor: color.background.brandPrimary, color: color.text.onColorDark,
  fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.bold,
  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
};

const tableWrap: CSSProperties = { flex: 1, overflowX: 'auto' };

const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };

const actionBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '36px', height: '36px', borderRadius: border.radius.md,
  backgroundColor: color.background.brandPrimary, color: color.text.onColorDark,
  border: 'none', cursor: 'pointer', fontSize: font.size.icon.sm,
};

const colorDot: CSSProperties = { width: '12px', height: '12px', borderRadius: border.radius.circle, display: 'inline-block', flexShrink: 0 };

// ─── Component ───────────────────────────────────────────────────────────────

export function DepartmentsTable() {
  const { departments, setDepartments, loading } = useDepartments();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [viewing, setViewing] = useState<Department | null>(null);

  const handleAdd = () => { setEditing(null); setSheetOpen(true); };
  const handleEdit = (d: Department) => { setEditing(d); setSheetOpen(true); };
  const handleClose = () => { setSheetOpen(false); setEditing(null); };
  const handleView = (d: Department) => { setViewing(d); setViewSheetOpen(true); };
  const handleViewClose = () => { setViewSheetOpen(false); setViewing(null); };
  const handleViewEdit = () => { if (viewing) { handleViewClose(); handleEdit(viewing); } };

  const handleSave = async (data: DepartmentFormData) => {
    if (editing) {
      const res = await fetch(`/api/departments/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json() as Department;
        setDepartments((prev) => prev.map((d) => d.id === editing.id ? updated : d));
      }
    } else {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created = await res.json() as Department;
        setDepartments((prev) => [...prev, created]);
      }
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
          <span style={countBadge}>{loading ? '–' : departments.length}</span>
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
              <TableHead>Status</TableHead>
              <TableHead style={{ width: '100px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} style={{ textAlign: 'center', color: color.text.muted, fontFamily: font.family.label, fontSize: font.size.label.sm }}>
                  Loading departments…
                </TableCell>
              </TableRow>
            ) : departments.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: color.text.primary }}>{d.name}</span>
                </TableCell>
                <TableCell>
                  {d.color
                    ? <span style={{ ...colorDot, backgroundColor: departmentColor(d.color).base }} />
                    : <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary }}>—</span>
                  }
                </TableCell>
                <TableCell>
                  <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary }}>{d.member_count}</span>
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
          is_default: false,
          member_count: viewing.member_count,
        } satisfies DepartmentViewData : null}
        onEdit={handleViewEdit}
      />
    </div>
  );
}
