'use client';

import { forwardRef, useImperativeHandle, useState, type CSSProperties } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@brikdesigns/bds';
import { Badge, Button, IconButton, Sheet, Tag, Select, TextInput, Field } from '@brikdesigns/bds';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { TableSkeleton } from '@/components/TableSkeleton';
import { color, gap, departmentColor } from '@/lib/tokens';
import { useTeams, type Team } from '@/hooks/useTeams';
import { useDepartments } from '@/hooks/useDepartments';
import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import '../_settingsTableStyles.css';
import {
  sheetBodyStyle,
  sheetSectionTitle,
  sheetFormGroup,
} from '@/app/(auth)/settings/_sheetStyles';

// ─── Styles ──────────────────────────────────────────────────────────────────

const wrapStyle: CSSProperties = { display: 'flex', flexDirection: 'column', flex: 1 };

const tableWrap: CSSProperties = { flex: 1, overflowX: 'auto', paddingInline: space.xl };

const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };

// TODO(bds-migration): body-cell bg is a local patch. Promote to BDS Table.css
// (.bds-table-cell { background-color: var(--background-primary) }) once the
// in-flight BDS session is reconciled, then remove this.
const bodyCellStyle: CSSProperties = { backgroundColor: color.background.primary };

// ─── Form data ──────────────────────────────────────────────────────────────

interface TeamFormData {
  name: string;
  department_id: string;
  is_active: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Imperative handle for the parent's PageHeader Add button to trigger the
 * EditTeamSheet (rendered inside TeamsTable). See TeamsSettingsClient.
 */
export type TeamsTableHandle = {
  openAddSheet: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface TeamsTableProps {}

export const TeamsTable = forwardRef<TeamsTableHandle, TeamsTableProps>(function TeamsTable(_props, ref) {
  const { teams, setTeams, loading } = useTeams();
  const { departments } = useDepartments();
  const { members } = useMembers();
  const { showToast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Team | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Bridge for the Add button hosted in PageHeader actions.
  useImperativeHandle(ref, () => ({
    openAddSheet: () => {
      setEditing(null);
      setForm({ name: '', department_id: '', is_active: true });
      setEditOpen(true);
    },
  }));

  // Form state
  const [form, setForm] = useState<TeamFormData>({ name: '', department_id: '', is_active: true });
  const [saving, setSaving] = useState(false);

  const activeDepts = departments.filter(d => d.is_active && d.name !== '(G) All Departments');

  // handleAdd lives on the parent (TeamsSettingsClient) and triggers the
  // sheet via the imperative ref (openAddSheet).

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
      {/* Add Team + filter chrome live on the parent's PageHeader
          (see TeamsSettingsClient). */}
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
                <TableCell colSpan={5} className="settings-table-empty-row" style={bodyCellStyle}>
                  No teams yet. Click &quot;Add Team&quot; to create one.
                </TableCell>
              </TableRow>
            ) : teams.map(t => {
              const deptColors = t.department_color ? departmentColor(t.department_color) : null;
              return (
                <TableRow key={t.id}>
                  <TableCell style={bodyCellStyle}>
                    <span className="settings-table-cell-text settings-table-cell-text--strong">{t.name}</span>
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    {t.department_name ? (
                      <Tag size="sm" style={{ backgroundColor: deptColors?.light ?? color.surface.secondary, color: deptColors?.text ?? color.text.secondary }}>
                        {t.department_name}
                      </Tag>
                    ) : (
                      <span className="settings-table-cell-text settings-table-cell-text--secondary">—</span>
                    )}
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <span className="settings-table-cell-text settings-table-cell-text--secondary">{t.member_count}</span>
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <Badge status={t.is_active ? 'positive' : 'error'} size="sm">
                      {t.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
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
            <Field label="Name" empty="—">{viewing.name}</Field>
            <Field label="Department" empty="—">
              {viewing.department_name ? (
                <Tag size="sm" style={{
                  backgroundColor: viewing.department_color ? departmentColor(viewing.department_color).light : color.surface.secondary,
                  color: viewing.department_color ? departmentColor(viewing.department_color).text : color.text.secondary,
                }}>
                  {viewing.department_name}
                </Tag>
              ) : null}
            </Field>
            <Field label="Status" empty="—">
              <Badge status={viewing.is_active ? 'positive' : 'error'} size="sm">
                {viewing.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </Field>
            <Field label="Members" empty="—">{String(viewing.member_count)}</Field>
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
});
