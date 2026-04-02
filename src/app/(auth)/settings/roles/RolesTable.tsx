'use client';

import { useState, type CSSProperties } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bds/components';
import { Badge } from '@bds/components';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { EditRoleSheet, type RoleFormData } from '@/components/EditRoleSheet';
import { ViewRoleSheet, type RoleViewData } from '@/components/ViewRoleSheet';
import { color, font, space, gap, border } from '@/lib/tokens';
import { useRoles } from '@/hooks/useRoles';
import type { Role } from '@/hooks/useRoles';

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
const actionBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '36px', height: '36px', borderRadius: border.radius.md,
  backgroundColor: color.background.brandPrimary, color: color.text.onColorDark,
  border: 'none', cursor: 'pointer', fontSize: font.size.icon.sm,
};
const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };

// ─── Component ───────────────────────────────────────────────────────────────

export function RolesTable() {
  const { roles, setRoles, loading } = useRoles();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [viewing, setViewing] = useState<Role | null>(null);

  const handleAdd = () => { setEditing(null); setSheetOpen(true); };
  const handleEdit = (r: Role) => { setEditing(r); setSheetOpen(true); };
  const handleClose = () => { setSheetOpen(false); setEditing(null); };
  const handleView = (r: Role) => { setViewing(r); setViewSheetOpen(true); };
  const handleViewClose = () => { setViewSheetOpen(false); setViewing(null); };
  const handleViewEdit = () => { if (viewing) { handleViewClose(); handleEdit(viewing); } };

  const handleSave = async (data: RoleFormData) => {
    if (editing) {
      const res = await fetch(`/api/roles/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json() as Role;
        setRoles((prev) => prev.map((r) => r.id === editing.id ? updated : r));
      }
    } else {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created = await res.json() as Role;
        setRoles((prev) => [...prev, created]);
      }
    }
  };

  const sheetData: RoleFormData | null = editing
    ? { name: editing.name, department_id: editing.department_id, description: editing.description, is_active: editing.is_active }
    : null;

  const viewData: RoleViewData | null = viewing
    ? { id: viewing.id, name: viewing.name, department: viewing.department, description: viewing.description, is_default: viewing.is_default, is_active: viewing.is_active, member_count: viewing.member_count }
    : null;

  return (
    <div style={wrapStyle}>
      <div style={subHeaderStyle}>
        <div style={subHeaderLeftStyle}>
          <h3 style={subHeaderTitleStyle}>Practice Roles</h3>
          <span style={countBadge}>{loading ? '–' : roles.length}</span>
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} style={{ textAlign: 'center', color: color.text.muted, fontFamily: font.family.label, fontSize: font.size.label.sm }}>
                  Loading roles…
                </TableCell>
              </TableRow>
            ) : roles.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: color.text.primary }}>{r.name}</span>
                </TableCell>
                <TableCell>
                  <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary }}>{r.department}</span>
                </TableCell>
                <TableCell>
                  <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary }}>{r.member_count}</span>
                </TableCell>
                <TableCell>
                  <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary }}>
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
                      <Icon icon={icon.eye} />
                    </button>
                    <button style={actionBtn} onClick={() => handleEdit(r)} aria-label={`Edit ${r.name}`}>
                      <Icon icon={icon.edit} />
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
