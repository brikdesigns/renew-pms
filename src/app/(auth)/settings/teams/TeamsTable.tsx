'use client';

import { useState, type CSSProperties } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@brikdesigns/bds';
import { Badge, Button, IconButton, Sheet, Tag, Select, TextInput } from '@brikdesigns/bds';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import { TableSkeleton } from '@/components/TableSkeleton';
import { color, font, space, gap, border, departmentColor } from '@/lib/tokens';
import { useTeams, type Team } from '@/hooks/useTeams';
import { useDepartments } from '@/hooks/useDepartments';
import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import {
  sheetBodyStyle,
  sheetSectionTitle,
  sheetFormGroup,
} from '@/app/(auth)/settings/_sheetStyles';

// ─── Styles ──────────────────────────────────────────────────────────────────

const wrapStyle: CSSProperties = { display: 'flex', flexDirection: 'column', flex: 1 };

const subHeaderStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: `${space.md} ${space.xl}`, borderBottom: `1px solid ${color.border.muted}`,
};

const subHeaderLeftStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: space.sm };

const countBadge: CSSProperties = {
  fontFamily: font.family.label, fontSize: font.size.body.xs, fontWeight: font.weight.medium,
  color: color.text.secondary, backgroundColor: color.surface.secondary, padding: `2px ${gap.md}`, borderRadius: border.radius.sm,
};

const tableWrap: CSSProperties = { flex: 1, overflowX: 'auto', paddingInline: space.xl };

const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };

// ─── Form data ──────────────────────────────────────────────────────────────

interface TeamFormData {
  name: string;
  department_id: string;
  is_active: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function TeamsTable() {
  const { teams, setTeams, loading } = useTeams();
  const { departments } = useDepartments();
  const { members } = useMembers();
  const { showToast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Team | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Form state
  const [form, setForm] = useState<TeamFormData>({ name: '', department_id: '', is_active: true });
  const [saving, setSaving] = useState(false);

  const activeDepts = departments.filter(d => d.is_active && d.name !== '(G) All Departments');

  const handleAdd = () => {
    setEditing(null);
    setForm({ name: '', department_id: '', is_active: true });
    setEditOpen(true);
  };

  const handleEdit = (t: Team) => {
    setEditing(t);
    setForm({ name: t.name, department_id: t.department_id ?? '', is_active: t.is_active });
    setEditOpen(true);
  };

  const handleEditClose = () => { setEditOpen(false); setEditing(null); };

  const handleView = (t: Team) => { setViewing(t); setViewOpen(true); };
  const handleViewClose = () => { setViewOpen(false); setViewing(null); };
  const handleViewEdit = () => { if (viewing) { handleViewClose(); handleEdit(viewing); } };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = { name: form.name.trim(), department_id: form.department_id || null, is_active: form.is_active };

    if (editing) {
      const res = await fetch(`/api/teams/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json() as Team;
        setTeams(prev => prev.map(t => t.id === editing.id ? { ...updated, member_count: editing.member_count } : t));
        showToast({ title: 'Updated', description: `${updated.name} has been updated.`, variant: 'success' });
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to update' }));
        showToast({ title: 'Error', description: err.error, variant: 'error' });
      }
    } else {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json() as Team;
        setTeams(prev => [...prev, created]);
        showToast({ title: 'Created', description: `${created.name} has been created.`, variant: 'success' });
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to create' }));
        showToast({ title: 'Error', description: err.error, variant: 'error' });
      }
    }

    setSaving(false);
    handleEditClose();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/teams/${deleteTarget.id}`, { method: 'DELETE' });
    if (res.ok) {
      setTeams(prev => prev.filter(t => t.id !== deleteTarget.id));
      showToast({ title: 'Deleted', description: `${deleteTarget.name} has been deleted.`, variant: 'success' });
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed to delete' }));
      showToast({ title: 'Error', description: err.error, variant: 'error' });
    }
    setDeleteTarget(null);
  };

  // Suppress unused lint — members will be used when team_id is added to the Member interface
  void members;

  return (
    <div style={wrapStyle}>
      <div style={subHeaderStyle}>
        <div style={subHeaderLeftStyle}>
          <h3 style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.semibold, color: color.text.primary, margin: 0 }}>Teams</h3>
          <span style={countBadge}>{loading ? '–' : teams.length}</span>
        </div>
        <Button variant="primary" size="sm" onClick={handleAdd}>Add Team</Button>
      </div>

      <div style={tableWrap}>
        <Table size="default" flush>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Status</TableHead>
              <TableHead style={{ width: '120px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton columns={5} />
            ) : teams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} style={{ textAlign: 'center', color: color.text.muted, fontFamily: font.family.label, fontSize: font.size.label.sm }}>
                  No teams yet. Click &quot;Add Team&quot; to create one.
                </TableCell>
              </TableRow>
            ) : teams.map(t => {
              const deptColors = t.department_color ? departmentColor(t.department_color) : null;
              return (
                <TableRow key={t.id}>
                  <TableCell>
                    <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: color.text.primary }}>{t.name}</span>
                  </TableCell>
                  <TableCell>
                    {t.department_name ? (
                      <Tag size="sm" style={{ backgroundColor: deptColors?.light ?? color.surface.secondary, color: deptColors?.text ?? color.text.secondary }}>
                        {t.department_name}
                      </Tag>
                    ) : (
                      <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary }}>—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary }}>{t.member_count}</span>
                  </TableCell>
                  <TableCell>
                    <Badge status={t.is_active ? 'positive' : 'error'} size="sm">
                      {t.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div style={actionBtnGroup}>
                      <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.eye} />} label={`View ${t.name}`} onClick={() => handleView(t)} />
                      <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.edit} />} label={`Edit ${t.name}`} onClick={() => handleEdit(t)} />
                      <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.trash} />} label={`Delete ${t.name}`} onClick={() => setDeleteTarget({ id: t.id, name: t.name })} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* ── Edit / Add Sheet ── */}
      <Sheet
        isOpen={editOpen}
        onClose={handleEditClose}
        title={editing ? `Edit ${editing.name}` : 'Add Team'}
        width="480px"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={handleEditClose}>Cancel</Button>
            <Button variant="primary" size="md" type="submit" form="edit-team-form" disabled={saving || !form.name.trim()}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Team'}
            </Button>
          </>
        }
      >
        <form id="edit-team-form" onSubmit={handleSave}>
          <div style={sheetFormGroup}>
            <TextInput
              label="Name"
              size="sm"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Front Desk, Hygiene Team"
              autoFocus
            />
            <Select
              label="Department"
              size="sm"
              value={form.department_id}
              onChange={e => setForm(prev => ({ ...prev, department_id: e.target.value }))}
              options={[
                { value: '', label: 'No department' },
                ...activeDepts.map(d => ({ value: d.id, label: d.name })),
              ]}
            />
            <Select
              label="Status"
              size="sm"
              value={form.is_active ? 'active' : 'inactive'}
              onChange={e => setForm(prev => ({ ...prev, is_active: e.target.value === 'active' }))}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </form>
      </Sheet>

      {/* ── View Sheet ── */}
      <Sheet
        variant="floating"
        isOpen={viewOpen}
        onClose={handleViewClose}
        title={viewing?.name ?? ''}
        width="480px"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={handleViewClose}>Close</Button>
            <Button variant="secondary" size="md" onClick={handleViewEdit}>Edit</Button>
          </>
        }
      >
        {viewing && (
          <div style={sheetBodyStyle}>
            <h3 style={sheetSectionTitle}>Details</h3>
            <ReadOnlyField label="Name" value={viewing.name} />
            <ReadOnlyField label="Department" value={
              viewing.department_name ? (
                <Tag size="sm" style={{
                  backgroundColor: viewing.department_color ? departmentColor(viewing.department_color).light : color.surface.secondary,
                  color: viewing.department_color ? departmentColor(viewing.department_color).text : color.text.secondary,
                  display: 'inline-flex',
                }}>
                  {viewing.department_name}
                </Tag>
              ) : '—'
            } />
            <ReadOnlyField label="Status" value={
              <Badge status={viewing.is_active ? 'positive' : 'error'} size="sm" style={{ display: 'inline-flex' }}>
                {viewing.is_active ? 'Active' : 'Inactive'}
              </Badge>
            } />
            <ReadOnlyField label="Members" value={String(viewing.member_count)} />
          </div>
        )}
      </Sheet>

      <ConfirmDeleteDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.name ?? ''}
        itemType="team"
      />
    </div>
  );
}
