'use client';

import { useState, type CSSProperties } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bds/components';
import { Badge, Button, IconButton, SegmentedControl } from '@bds/components';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { EditDepartmentSheet, type DepartmentFormData } from '@/components/EditDepartmentSheet';
import { ViewDepartmentSheet, type DepartmentViewData } from '@/components/ViewDepartmentSheet';
import { color, font, space, gap, border, departmentColor } from '@/lib/tokens';
import { useDepartments } from '@/hooks/useDepartments';
import type { Department } from '@/hooks/useDepartments';
import { useRoles } from '@/hooks/useRoles';
import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { TeamsTable, type TeamsTableHandle } from './TeamsTable';

// ─── Styles ──────────────────────────────────────────────────────────────────

const wrapStyle: CSSProperties = { display: 'flex', flexDirection: 'column', flex: 1, paddingInline: space.xl };

const subHeaderStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: `${space.md} 0`, borderBottom: `1px solid ${color.border.muted}`,
};

const subHeaderLeftStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: space.sm };

const countBadge: CSSProperties = {
  fontFamily: font.family.label, fontSize: font.size.body.xs, fontWeight: font.weight.medium,
  color: color.text.secondary, backgroundColor: color.surface.secondary, padding: `2px ${gap.md}`, borderRadius: border.radius.sm,
};

const tableWrap: CSSProperties = { flex: 1, overflowX: 'auto' };

const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };

const colorDot: CSSProperties = { width: '12px', height: '12px', borderRadius: border.radius.circle, display: 'inline-block', flexShrink: 0 };

const DEPT_SEGMENTS = [
  { label: 'Departments', value: 'departments' },
  { label: 'Teams', value: 'teams' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function DepartmentsTable() {
  const [view, setView] = useState<'departments' | 'teams'>('departments');
  const [teamsHandle, setTeamsHandle] = useState<TeamsTableHandle | null>(null);
  const { departments, setDepartments, loading } = useDepartments();
  const { roles } = useRoles();
  const { members } = useMembers();
  const { showToast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [viewing, setViewing] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleAdd = () => { setEditing(null); setSheetOpen(true); };
  const handleEdit = (d: Department) => { setEditing(d); setSheetOpen(true); };
  const handleClose = () => { setSheetOpen(false); setEditing(null); };
  const handleDelete = () => {
    if (!deleteTarget) return;
    // TODO: Wire to DELETE API
    showToast({ title: 'Deleted', description: `${deleteTarget.name} has been deleted.`, variant: 'success' });
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

  const isDepartments = view === 'departments';

  return (
    <div style={wrapStyle}>
      <div style={subHeaderStyle}>
        <div style={subHeaderLeftStyle}>
          <SegmentedControl items={DEPT_SEGMENTS} value={view} onChange={(v) => setView(v as 'departments' | 'teams')} size="sm" />
          <span style={countBadge}>{isDepartments ? (loading ? '–' : visibleDepts.length) : (teamsHandle?.count ?? '–')}</span>
        </div>
        {isDepartments
          ? <Button variant="primary" size="sm" onClick={handleAdd}>Add Department</Button>
          : <Button variant="primary" size="sm" onClick={() => teamsHandle?.openAdd()}>Add Team</Button>
        }
      </div>

      {view === 'teams' && <TeamsTable embedded onReady={setTeamsHandle} />}

      {view === 'departments' && <div style={tableWrap}>
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
            ) : visibleDepts.map((d) => (
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
                    <IconButton variant="secondary" size="tiny" icon={<Icon icon={icon.eye} />} label={`View ${d.name}`} onClick={() => handleView(d)} />
                    <IconButton variant="secondary" size="tiny" icon={<Icon icon={icon.edit} />} label={`Edit ${d.name}`} onClick={() => handleEdit(d)} />
                    <IconButton variant="secondary" size="tiny" icon={<Icon icon={icon.trash} />} label={`Delete ${d.name}`} onClick={() => setDeleteTarget({ id: d.id, name: d.name })} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>}

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
          is_default: false,
          member_count: viewing.member_count,
        } satisfies DepartmentViewData : null}
        onEdit={handleViewEdit}
        roles={roles}
        members={members}
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
}
