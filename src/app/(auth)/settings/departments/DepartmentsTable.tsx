'use client';

import { forwardRef, useImperativeHandle, useState, type CSSProperties } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@brikdesigns/bds';
import { IconButton, useSheetStack } from '@brikdesigns/bds';
import { StatusBadge } from '@/components/StatusBadge';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { EditDepartmentSheet, type DepartmentFormData } from '@/components/EditDepartmentSheet';
import { TableSkeleton } from '@/components/TableSkeleton';
import { ViewDepartmentSheet, type DepartmentViewData } from '@/components/ViewDepartmentSheet';
import { color, gap, border, departmentColor } from '@/lib/tokens';
import { useDepartments } from '@/hooks/useDepartments';
import type { Department } from '@/hooks/useDepartments';
import { useRoles } from '@/hooks/useRoles';
import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import '../_settingsTableStyles.css';

// ─── Styles ──────────────────────────────────────────────────────────────────

const wrapStyle: CSSProperties = { display: 'flex', flexDirection: 'column', flex: 1 };

const tableWrap: CSSProperties = { flex: 1, overflowX: 'auto' };

const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };

const colorDot: CSSProperties = { width: '12px', height: '12px', borderRadius: border.radius.circle, display: 'inline-block', flexShrink: 0 };

// TODO(bds-migration): body-cell bg is a local patch. Promote to BDS Table.css
// (.bds-table-cell { background-color: var(--background-primary) }) once the
// in-flight BDS session is reconciled, then remove this.
const bodyCellStyle: CSSProperties = { backgroundColor: color.background.primary };

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Imperative handle exposed by DepartmentsTable. The settings page wrapper
 * (`DepartmentsSettingsClient`) hosts the Add button in the PageHeader actions
 * slot but the EditDepartmentSheet stays rendered inside this table.
 */
export type DepartmentsTableHandle = {
  openAddSheet: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DepartmentsTableProps {}

export const DepartmentsTable = forwardRef<DepartmentsTableHandle, DepartmentsTableProps>(function DepartmentsTable(_props, ref) {
  const { pushSheet } = useSheetStack();
  const { departments, setDepartments, loading } = useDepartments();
  const { roles } = useRoles();
  const { members } = useMembers();
  const { showToast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [viewing, setViewing] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Bridge for the Add button hosted in PageHeader actions (see
  // DepartmentsSettingsClient). Sheet stays rendered below.
  useImperativeHandle(ref, () => ({
    openAddSheet: () => { setEditing(null); setSheetOpen(true); },
  }));

  const handleEdit = (d: Department) => { setEditing(d); setSheetOpen(true); };
  const handleClose = () => { setSheetOpen(false); setEditing(null); };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/departments/${deleteTarget.id}`, { method: 'DELETE' });
    if (res.ok) {
      setDepartments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      showToast({ title: 'Deleted', description: `${deleteTarget.name} has been deleted.`, variant: 'success' });
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed to delete department' }));
      showToast({ title: 'Error', description: err.error, variant: 'error' });
    }
    setDeleteTarget(null);
  };
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

  const sheetData = editing
    ? { id: editing.id, name: editing.name, color: editing.color, is_active: editing.is_active }
    : null;

  const visibleDepts = departments.filter((d) => d.name !== '(G) All Departments');

  return (
    <div style={wrapStyle}>
      {/* Add Department + filter chrome live on the parent's PageHeader
          (see DepartmentsSettingsClient). */}
      <div style={tableWrap}>
        <Table size="default" flush>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Status</TableHead>
              <TableHead style={{ width: '120px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton columns={5} />
            ) : visibleDepts.map((d) => (
              <TableRow key={d.id}>
                <TableCell style={bodyCellStyle}>
                  <span className="settings-table-cell-text settings-table-cell-text--strong">{d.name}</span>
                </TableCell>
                <TableCell style={bodyCellStyle}>
                  {d.color
                    ? <span style={{ ...colorDot, backgroundColor: departmentColor(d.color).base }} />
                    : <span className="settings-table-cell-text settings-table-cell-text--secondary">—</span>
                  }
                </TableCell>
                <TableCell style={bodyCellStyle}>
                  <span className="settings-table-cell-text settings-table-cell-text--secondary">{d.member_count}</span>
                </TableCell>
                <TableCell style={bodyCellStyle}>
                  <StatusBadge status={d.is_active} />
                </TableCell>
                <TableCell style={bodyCellStyle}>
                  <div style={actionBtnGroup}>
                    <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.eye} />} label={`View ${d.name}`} onClick={() => handleView(d)} />
                    <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.edit} />} label={`Edit ${d.name}`} onClick={() => handleEdit(d)} />
                    <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.trash} />} label={`Delete ${d.name}`} onClick={() => setDeleteTarget({ id: d.id, name: d.name })} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditDepartmentSheet
        isOpen={sheetOpen}
        onClose={handleClose}
        initialData={sheetData}
        onSave={handleSave}
        roles={roles}
        members={members}
      />
      <ViewDepartmentSheet
        isOpen={viewSheetOpen}
        onClose={handleViewClose}
        department={viewing ? {
          id: viewing.id,
          name: viewing.name,
          color: viewing.color,
          is_active: viewing.is_active,
          member_count: viewing.member_count,
        } satisfies DepartmentViewData : null}
        onEdit={handleViewEdit}
        roles={roles}
        members={members}
        onNavigate={(type, props, opts) => pushSheet(type, props, opts)}
      />
      <ConfirmDeleteDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.name ?? ''}
        itemType="department"
      />
    </div>
  );
});
