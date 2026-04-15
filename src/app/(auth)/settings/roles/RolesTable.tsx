'use client';

import { useState, type CSSProperties } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@brikdesigns/bds';
import { Button, IconButton, useSheetStack } from '@brikdesigns/bds';
import { StatusBadge } from '@/components/StatusBadge';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { EditRoleSheet, type RoleFormData } from '@/components/EditRoleSheet';
import { TableSkeleton } from '@/components/TableSkeleton';
import { ViewRoleSheet, type RoleViewData } from '@/components/ViewRoleSheet';
import { color, font, space, gap, border } from '@/lib/tokens';
import { useRoles } from '@/hooks/useRoles';
import type { Role } from '@/hooks/useRoles';
import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';

// ─── Styles ──────────────────────────────────────────────────────────────────

const wrapStyle: CSSProperties = { display: 'flex', flexDirection: 'column', flex: 1 };
const subHeaderStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: `${space.md} ${space.xl}`, borderBottom: `1px solid ${color.border.muted}`,
};
const subHeaderLeftStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: space.sm };
const subHeaderTitleStyle: CSSProperties = {
  fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.semibold, color: color.text.primary, margin: 0,
};
const countBadge: CSSProperties = {
  fontFamily: font.family.label, fontSize: font.size.body.xs, fontWeight: font.weight.medium,
  color: color.text.secondary, backgroundColor: color.surface.secondary, padding: `2px ${gap.md}`, borderRadius: border.radius.sm,
};
const tableWrap: CSSProperties = { flex: 1, overflowX: 'auto', paddingInline: space.xl };
const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };

// ─── Component ───────────────────────────────────────────────────────────────

export function RolesTable() {
  const { roles, setRoles, loading } = useRoles();
  const { members } = useMembers();
  const { pushSheet } = useSheetStack();
  const { showToast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [viewing, setViewing] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleAdd = () => { setEditing(null); setSheetOpen(true); };
  const handleEdit = (r: Role) => { setEditing(r); setSheetOpen(true); };
  const handleClose = () => { setSheetOpen(false); setEditing(null); };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/roles/${deleteTarget.id}`, { method: 'DELETE' });
    if (res.ok) {
      setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      showToast({ title: 'Deleted', description: `${deleteTarget.name} has been deleted.`, variant: 'success' });
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed to delete role' }));
      showToast({ title: 'Error', description: err.error, variant: 'error' });
    }
    setDeleteTarget(null);
  };
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

  const sheetData: (RoleFormData & { id?: string }) | null = editing
    ? { id: editing.id, name: editing.name, department_id: editing.department_id, description: editing.description, default_system_role: editing.default_system_role, is_active: editing.is_active }
    : null;

  const viewData: RoleViewData | null = viewing
    ? { id: viewing.id, name: viewing.name, department: viewing.department, department_id: viewing.department_id, department_color: viewing.department_color, description: viewing.description, is_default: viewing.is_default, is_active: viewing.is_active, member_count: viewing.member_count }
    : null;

  return (
    <div style={wrapStyle}>
      <div style={subHeaderStyle}>
        <div style={subHeaderLeftStyle}>
          <h3 style={subHeaderTitleStyle}>Practice Roles</h3>
          <span style={countBadge}>{loading ? '–' : roles.filter((r) => r.name !== 'Everyone').length}</span>
        </div>
        <Button variant="primary" size="sm" onClick={handleAdd}>Add Role</Button>
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
              <TableHead style={{ width: '120px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton columns={6} />
            ) : roles.filter((r) => r.name !== 'Everyone').map((r) => (
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
                  <StatusBadge status={r.is_active} />
                </TableCell>
                <TableCell>
                  <div style={actionBtnGroup}>
                    <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.eye} />} label={`View ${r.name}`} onClick={() => handleView(r)} />
                    <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.edit} />} label={`Edit ${r.name}`} onClick={() => handleEdit(r)} />
                    <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.trash} />} label={`Delete ${r.name}`} onClick={() => setDeleteTarget({ id: r.id, name: r.name })} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditRoleSheet isOpen={sheetOpen} onClose={handleClose} initialData={sheetData} onSave={handleSave} members={members} />
      <ViewRoleSheet isOpen={viewSheetOpen} onClose={handleViewClose} role={viewData} onEdit={handleViewEdit} members={members} onNavigate={(type, props, opts) => pushSheet(type, props, opts)} />
      <ConfirmDeleteDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.name ?? ''}
        itemType="role"
      />
    </div>
  );
}
