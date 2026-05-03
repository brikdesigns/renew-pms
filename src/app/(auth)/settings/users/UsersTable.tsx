'use client';

import { useState, useMemo, type CSSProperties } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@brikdesigns/bds';
import { Badge, Tag, Button, IconButton, Chip, Menu, useSheetStack } from '@brikdesigns/bds';
import type { MenuItemData } from '@brikdesigns/bds';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { EditUserSheet, type UserFormData } from '@/components/EditUserSheet';
import { TableSkeleton } from '@/components/TableSkeleton';
import { ViewUserSheet, type UserViewData } from '@/components/ViewUserSheet';
import { UserAvatar } from '@/components/UserAvatar';
import { color, font, space, gap, border } from '@/lib/tokens';
import { useMembers, type Member } from '@/hooks/useMembers';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { useDepartments } from '@/hooks/useDepartments';
import { useRoles } from '@/hooks/useRoles';
import { SECONDARY_DEPTS } from '@/lib/secondary-departments';
import { EMPLOYEE_TYPE_TAG, SYSTEM_ROLE_LABELS } from '@/lib/member-labels';
import '../_settingsTableStyles.css';

const TYPE_VALUE_MAP: Record<string, string> = { 'New Hire': 'new', 'Maturing': 'maturing', 'Proficient': 'proficient' };

// ─── Styles ──────────────────────────────────────────────────────────────────

const wrapStyle: CSSProperties = { display: 'flex', flexDirection: 'column', flex: 1 };
const subHeaderStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  paddingBlock: space.md,
};
const subHeaderLeftStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: space.sm };
const countBadge: CSSProperties = {
  fontFamily: font.family.label, fontSize: font.size.body.xs, fontWeight: font.weight.medium,
  color: color.text.secondary, backgroundColor: color.surface.secondary, padding: `2px ${gap.md}`, borderRadius: border.radius.sm,
};
const tableWrap: CSSProperties = { flex: 1, overflowX: 'auto' };
const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };
const nameWrap: CSSProperties = { display: 'flex', alignItems: 'center', gap: gap.md };
const filterBarStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: gap.md, flexWrap: 'wrap' };
const chipWrapperStyle: CSSProperties = { position: 'relative' };
const menuStyle: CSSProperties = { position: 'absolute', top: '100%', left: 0, marginTop: 4, minWidth: 180, zIndex: 100 };

// TODO(bds-migration): body-cell bg is a local patch. Promote to BDS Table.css
// (.bds-table-cell { background-color: var(--background-primary) }) once the
// in-flight BDS session is reconciled, then remove this.
const bodyCellStyle: CSSProperties = { backgroundColor: color.background.primary };

// ─── ChipFilter ─────────────────────────────────────────────────────────────

function ChipFilter({ options, selected, onChange }: { options: readonly string[]; selected: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const items: MenuItemData[] = options.map((opt) => ({
    id: opt, label: opt, onClick: () => { onChange(opt); setOpen(false); },
  }));
  const isFiltered = selected !== options[0];
  return (
    <div style={chipWrapperStyle}>
      <Chip label={selected} variant={isFiltered ? 'primary' : 'secondary'} appearance={isFiltered ? 'solid' : 'outline'} showDropdown onChipClick={() => setOpen((p) => !p)} />
      <Menu items={items} isOpen={open} onClose={() => setOpen(false)} activeId={selected} style={menuStyle} />
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function UsersTable() {
  const { pushSheet } = useSheetStack();
  const { members, setMembers, loading } = useMembers();
  const { departments } = useDepartments();
  const { roles } = useRoles();
  const { showToast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // ── Filters ──
  const [filterRole, setFilterRole] = useState('All Roles');
  const [filterDept, setFilterDept] = useState('All Departments');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [filterType, setFilterType] = useState('All Types');

  const roleBelongsToDept = (roleName: string, rolePrimaryDept: string, dept: string) =>
    rolePrimaryDept === dept || (SECONDARY_DEPTS[roleName]?.includes(dept) ?? false);

  // When department changes, reset role if it doesn't belong to the new department
  const handleDeptChange = (dept: string) => {
    setFilterDept(dept);
    if (dept !== 'All Departments' && filterRole !== 'All Roles') {
      const roleMatch = roles.find((r) => r.name === filterRole);
      if (roleMatch && !roleBelongsToDept(roleMatch.name, roleMatch.department, dept)) setFilterRole('All Roles');
    }
  };

  // When role changes, auto-select its primary department
  const handleRoleChange = (role: string) => {
    setFilterRole(role);
    if (role !== 'All Roles') {
      const roleMatch = roles.find((r) => r.name === role);
      if (roleMatch && roleMatch.department) setFilterDept(roleMatch.department);
    }
  };

  // Role options scoped to the selected department
  const roleOptions = useMemo(() => {
    const belongs = (roleName: string, rolePrimaryDept: string, dept: string) =>
      rolePrimaryDept === dept || (SECONDARY_DEPTS[roleName]?.includes(dept) ?? false);
    const filtered = filterDept === 'All Departments'
      ? roles.filter((r) => r.is_active)
      : roles.filter((r) => r.is_active && belongs(r.name, r.department, filterDept));
    return ['All Roles', ...filtered.map((r) => r.name)] as const;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles, filterDept, filterRole]);

  const deptOptions = useMemo(
    () => ['All Departments', ...departments.filter((d) => d.is_active && d.name !== '(G) All Departments').map((d) => d.name)] as const,
    [departments],
  );

  const statusOptions = ['All Statuses', 'Active', 'Inactive'] as const;
  const typeOptions = ['All Types', 'New Hire', 'Maturing', 'Proficient'] as const;

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (filterRole !== 'All Roles' && m.practice_role !== filterRole) return false;
      if (filterDept !== 'All Departments' && m.department !== filterDept) return false;
      if (filterStatus === 'Active' && !m.is_active) return false;
      if (filterStatus === 'Inactive' && m.is_active) return false;
      if (filterType !== 'All Types' && m.employee_type !== TYPE_VALUE_MAP[filterType]) return false;
      return true;
    });
  }, [members, filterRole, filterDept, filterStatus, filterType]);

  const handleAdd = () => { setEditing(null); setSheetOpen(true); };
  const handleEdit = (m: Member) => { setEditing(m); setSheetOpen(true); };
  const handleClose = () => { setSheetOpen(false); setEditing(null); };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/members/${deleteTarget.id}`, { method: 'DELETE' });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      showToast({ title: 'Deleted', description: `${deleteTarget.name} has been removed.`, variant: 'success' });
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed to delete user' }));
      showToast({ title: 'Error', description: err.error, variant: 'error' });
    }
    setDeleteTarget(null);
  };

  const handleView = (m: Member) => { setViewing(m); setViewOpen(true); };
  const handleViewClose = () => { setViewOpen(false); setViewing(null); };
  const handleViewEdit = () => { if (viewing) { handleViewClose(); handleEdit(viewing); } };

  const handleResendInvite = async (m: Member) => {
    const res = await fetch(`/api/members/${m.id}/resend-invite`, { method: 'POST' });
    if (res.ok) {
      showToast({
        title: 'Invite resent',
        description: `A new invite link is on its way to ${m.email.toLowerCase()}.`,
        variant: 'success',
      });
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed to resend invite' }));
      showToast({ title: 'Could not resend invite', description: err.error, variant: 'error' });
    }
  };

  const handleSave = async (data: UserFormData) => {
    if (editing) {
      const res = await fetch(`/api/members/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          system_role: data.system_role,
          practice_role_id: data.practice_role_id,
          employee_type: data.employee_type,
          shift: data.shift || null,
          office_days: data.office_days,
          is_active: data.is_active,
        }),
      });
      if (res.ok) {
        const updated: Member = await res.json();
        setMembers((prev) => prev.map((m) => m.id === editing.id ? updated : m));
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to update user' }));
        showToast({ title: 'Error', description: err.error, variant: 'error' });
      }
    } else {
      // Invite new user
      const res = await fetch('/api/members/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          system_role: data.system_role,
          practice_role_id: data.practice_role_id || null,
          employee_type: data.employee_type,
          shift: data.shift || null,
        }),
      });
      if (res.ok) {
        const newMember: Member & { email_status?: 'sent' | 'failed' } = await res.json();
        setMembers((prev) => [...prev, newMember]);
        if (newMember.email_status === 'failed') {
          showToast({
            title: 'Member created — invite email failed',
            description: `${newMember.first_name} was added but didn't receive the invite email. Try the Resend invite action on their row.`,
            variant: 'error',
          });
        }
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to invite user' }));
        showToast({ title: 'Error', description: err.error, variant: 'error' });
        throw new Error(err.error); // Prevent the success toast in EditUserSheet
      }
    }
  };

  const sheetData: UserFormData | null = editing
    ? {
        first_name: editing.first_name,
        last_name: editing.last_name,
        email: editing.email,
        phone: editing.phone,
        system_role: editing.system_role,
        practice_role_id: editing.practice_role_id,
        practice_role: editing.practice_role,
        department: editing.department,
        employee_type: editing.employee_type,
        shift: editing.shift,
        office_days: editing.office_days,
        is_active: editing.is_active,
      }
    : null;

  const viewData: UserViewData | null = viewing
    ? {
        id: viewing.id,
        first_name: viewing.first_name,
        last_name: viewing.last_name,
        email: viewing.email,
        phone: viewing.phone,
        system_role: viewing.system_role,
        practice_role: viewing.practice_role,
        practice_role_id: viewing.practice_role_id,
        department: viewing.department,
        department_id: viewing.department_id,
        department_color: viewing.department_color,
        employee_type: viewing.employee_type,
        shift: viewing.shift,
        office_days: viewing.office_days,
        is_active: viewing.is_active,
        joined_at: viewing.joined_at,
      }
    : null;

  return (
    <div style={wrapStyle}>
      <div style={subHeaderStyle}>
        <div style={subHeaderLeftStyle}>
          <span style={countBadge}>{filteredMembers.length}</span>
        </div>
        <div style={filterBarStyle}>
          <ChipFilter options={roleOptions} selected={filterRole} onChange={handleRoleChange} />
          <ChipFilter options={deptOptions} selected={filterDept} onChange={handleDeptChange} />
          <ChipFilter options={statusOptions} selected={filterStatus} onChange={setFilterStatus} />
          <ChipFilter options={typeOptions} selected={filterType} onChange={setFilterType} />
          <Button variant="primary" size="sm" onClick={handleAdd}>Invite User</Button>
        </div>
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
              <TableHead style={{ width: '120px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableSkeleton columns={7} />
            )}
            {!loading && filteredMembers.map((m) => {
              const empType = EMPLOYEE_TYPE_TAG[m.employee_type] ?? EMPLOYEE_TYPE_TAG.new;
              const fullName = `${m.first_name} ${m.last_name}`;
              return (
                <TableRow key={m.id}>
                  <TableCell style={bodyCellStyle}>
                    <div style={nameWrap}>
                      <UserAvatar name={fullName} departmentColorKey={m.department_color} size="button" />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontFamily: font.family.label, fontWeight: font.weight.medium, color: color.text.primary, fontSize: font.size.label.md, lineHeight: font.lineHeight.snug }}>
                          {m.first_name} {m.last_name}
                        </span>
                        <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary, lineHeight: font.lineHeight.snug }}>
                          {m.email.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <span className="settings-table-cell-text settings-table-cell-text--secondary">
                      {m.practice_role || '—'}
                    </span>
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <span className="settings-table-cell-text settings-table-cell-text--secondary">
                      {m.department || '—'}
                    </span>
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <span className="settings-table-cell-text settings-table-cell-text--secondary">
                      {SYSTEM_ROLE_LABELS[m.system_role] ?? m.system_role}
                    </span>
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <Tag size="sm" style={{ backgroundColor: empType.bg, color: empType.color }}>{empType.label}</Tag>
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <Badge status={m.is_active ? 'positive' : 'error'} size="sm">
                      {m.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <div style={actionBtnGroup}>
                      {m.has_signed_in === false && (
                        <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.paperPlane} />} label={`Resend invite to ${m.first_name}`} onClick={() => handleResendInvite(m)} />
                      )}
                      <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.eye} />} label={`View ${m.first_name}`} onClick={() => handleView(m)} />
                      <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.edit} />} label={`Edit ${m.first_name}`} onClick={() => handleEdit(m)} />
                      <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.trash} />} label={`Delete ${m.first_name}`} onClick={() => setDeleteTarget({ id: m.id, name: `${m.first_name} ${m.last_name}` })} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <EditUserSheet isOpen={sheetOpen} onClose={handleClose} initialData={sheetData} onSave={handleSave} />
      <ViewUserSheet isOpen={viewOpen} onClose={handleViewClose} user={viewData} onEdit={handleViewEdit} onNavigate={(type, props, opts) => pushSheet(type, props, opts)} />
      <ConfirmDeleteDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.name ?? ''}
        itemType="user"
      />
    </div>
  );
}
