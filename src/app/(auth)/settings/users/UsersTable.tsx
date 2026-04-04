'use client';

import { useState, type CSSProperties } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bds/components';
import { Badge, Tag, Button, IconButton } from '@bds/components';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { EditUserSheet, type UserFormData } from '@/components/EditUserSheet';
import { ViewUserSheet, type UserViewData } from '@/components/ViewUserSheet';
import { UserAvatar } from '@/components/UserAvatar';
import { color, font, space, gap, border } from '@/lib/tokens';
import { useMembers, type Member } from '@/hooks/useMembers';

const TEXT_SECONDARY = color.text.secondary;

const SYSTEM_ROLE_LABELS: Record<string, string> = {
  platform_admin: 'Platform Admin',
  practice_admin: 'Practice Admin',
  staff: 'Staff',
};

const EMPLOYEE_TYPE_TAG: Record<string, { bg: string; color: string; label: string }> = {
  new:      { bg: color.department.blue.base,   color: color.text.onColorDark, label: 'New Hire' },
  maturing: { bg: color.department.gold.base,   color: color.text.onColorDark, label: 'Maturing' },
  active:   { bg: color.department.green.base,  color: color.text.onColorDark, label: 'Active' },
};

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
const tableWrap: CSSProperties = { flex: 1, overflowX: 'auto' };
const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };
const nameWrap: CSSProperties = { display: 'flex', alignItems: 'center', gap: gap.md };

// ─── Component ───────────────────────────────────────────────────────────────

export function UsersTable() {
  const { members, setMembers, loading } = useMembers();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Member | null>(null);

  const handleAdd = () => { setEditing(null); setSheetOpen(true); };
  const handleEdit = (m: Member) => { setEditing(m); setSheetOpen(true); };
  const handleClose = () => { setSheetOpen(false); setEditing(null); };

  const handleView = (m: Member) => { setViewing(m); setViewOpen(true); };
  const handleViewClose = () => { setViewOpen(false); setViewing(null); };
  const handleViewEdit = () => { if (viewing) { handleViewClose(); handleEdit(viewing); } };

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
          is_active: data.is_active,
        }),
      });
      if (res.ok) {
        const updated: Member = await res.json();
        setMembers((prev) => prev.map((m) => m.id === editing.id ? updated : m));
      }
    }
    // POST (invite) flow is handled separately — no optimistic add here
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
        department: viewing.department,
        department_color: viewing.department_color,
        employee_type: viewing.employee_type,
        shift: viewing.shift,
        is_active: viewing.is_active,
        joined_at: viewing.joined_at,
      }
    : null;

  return (
    <div style={wrapStyle}>
      <div style={subHeaderStyle}>
        <div style={subHeaderLeftStyle}>
          <h3 style={subHeaderTitleStyle}>Users</h3>
          <span style={countBadge}>{members.length}</span>
        </div>
        <Button variant="primary" size="sm" onClick={handleAdd}>Invite User</Button>
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
              <TableHead style={{ width: '100px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} style={{ textAlign: 'center', color: color.text.secondary, fontFamily: font.family.label, fontSize: font.size.label.sm }}>
                  Loading members…
                </TableCell>
              </TableRow>
            )}
            {!loading && members.map((m) => {
              const empType = EMPLOYEE_TYPE_TAG[m.employee_type] ?? EMPLOYEE_TYPE_TAG.new;
              const fullName = `${m.first_name} ${m.last_name}`;
              return (
                <TableRow key={m.id}>
                  <TableCell>
                    <div style={nameWrap}>
                      <UserAvatar name={fullName} departmentColorKey={m.department} size="sm" />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontFamily: font.family.label, fontWeight: font.weight.medium, color: color.text.primary, fontSize: font.size.label.md, lineHeight: font.lineHeight.snug }}>
                          {m.first_name} {m.last_name}
                        </span>
                        <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary, lineHeight: font.lineHeight.snug }}>
                          {m.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: TEXT_SECONDARY }}>
                      {m.practice_role || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: TEXT_SECONDARY }}>
                      {m.department || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: TEXT_SECONDARY }}>
                      {SYSTEM_ROLE_LABELS[m.system_role] ?? m.system_role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Tag size="sm" style={{ backgroundColor: empType.bg, color: empType.color }}>{empType.label}</Tag>
                  </TableCell>
                  <TableCell>
                    <Badge status={m.is_active ? 'positive' : 'error'} size="sm">
                      {m.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div style={actionBtnGroup}>
                      <IconButton variant="primary" size="sm" icon={<Icon icon={icon.eye} />} label={`View ${m.first_name}`} onClick={() => handleView(m)} />
                      <IconButton variant="primary" size="sm" icon={<Icon icon={icon.edit} />} label={`Edit ${m.first_name}`} onClick={() => handleEdit(m)} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <EditUserSheet isOpen={sheetOpen} onClose={handleClose} initialData={sheetData} onSave={handleSave} />
      <ViewUserSheet isOpen={viewOpen} onClose={handleViewClose} user={viewData} onEdit={handleViewEdit} />
    </div>
  );
}
