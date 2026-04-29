'use client';

import { useState, useEffect, useLayoutEffect, type CSSProperties } from 'react';
import { Sheet, Button, Skeleton, useConfigureSheet, Field, FieldGrid } from '@brikdesigns/bds';
import { Badge } from '@brikdesigns/bds';
import type { SheetTab } from '@brikdesigns/bds';
import { sheetBodyStyle, sheetSectionTitle } from '@/app/(auth)/settings/_sheetStyles';
import { SheetSkeleton } from '@/components/SheetSkeleton';
import { ProfileCard, profileCardGrid } from '@/components/ProfileCard';
import { color, font, gap, space, departmentColor } from '@/lib/tokens';
import type { Member } from '@/hooks/useMembers';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RoleViewData {
  id: string;
  name: string;
  department: string;
  department_id?: string | null;
  department_color: string;
  description: string;
  is_default: boolean;
  is_active: boolean;
  member_count: number;
}

interface ViewRoleSheetProps {
  /** Whether the sheet is open (page-level mode). Defaults to true for global mode. */
  isOpen?: boolean;
  onClose: () => void;
  /** Full role data (page-level mode — skips fetch) */
  role?: RoleViewData | null;
  /** Role ID (global mode — fetches data) */
  id?: string;
  onEdit?: () => void;
  /** All practice members — filtered to this role inside the component */
  members?: Member[];
  /** Navigate to a related entity (global sheet stack) */
  onNavigate?: (type: string, props: Record<string, unknown>, opts?: { title?: string }) => void;
  /** When true, uses useConfigureSheet instead of rendering own Sheet (set by AppSheetProvider) */
  headless?: boolean;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const emptyState: CSSProperties = {
  padding: `${space.lg} 0`,
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: color.text.secondary,
  textAlign: 'center',
};


// ─── Component ───────────────────────────────────────────────────────────────

export function ViewRoleSheet({ isOpen = true, onClose, role: roleProp, id, onEdit, members: allMembersProp, onNavigate, headless = false }: ViewRoleSheetProps) {
  const configureSheet = useConfigureSheet();
  const [activeTab, setActiveTab] = useState('details');
  const [fetched, setFetched] = useState<RoleViewData | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Self-fetch members in global (headless) mode when not provided via props
  const [selfMembers, setSelfMembers] = useState<Member[]>([]);

  // Global mode: fetch by ID when no data prop is given
  const resolvedId = id ?? roleProp?.id;
  useEffect(() => {
    if (roleProp || !resolvedId) return;
    setFetchLoading(true);
    fetch(`/api/roles/${resolvedId}`)
      .then(r => r.json())
      .then(data => { if (data && !data.error) setFetched(data); })
      .catch(err => console.error('[ViewRoleSheet] fetch failed:', err))
      .finally(() => setFetchLoading(false));
  }, [resolvedId, roleProp]);

  // Self-fetch members when not provided
  useEffect(() => {
    if (allMembersProp) return;
    fetch('/api/members')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSelfMembers(data); })
      .catch(err => console.error('[ViewRoleSheet] members fetch failed:', err));
  }, [allMembersProp]);

  const role = roleProp ?? fetched;
  const allMembers = allMembersProp ?? selfMembers;

  // ── Derived data ──────────────────────────────────────────────────────────

  const users = role ? allMembers.filter((m) => m.practice_role_id === role.id) : [];
  const departments = role?.department
    ? [{ id: role.department_id ?? null, name: role.department, departmentColor: role.department_color }]
    : [];

  // ── Tab content ───────────────────────────────────────────────────────────

  const detailsContent = role ? (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Role Details</h3>
      <FieldGrid columns={2} gap="lg">
        <Field label="Name" empty="—">{role.name}</Field>
        <Field label="Department" empty="—">{role.department}</Field>
      </FieldGrid>
      <Field label="Description" empty="—">{role.description}</Field>
      <FieldGrid columns={2} gap="lg">
        <Field label="Source" empty="—">{role.is_default ? 'Default' : 'Custom'}</Field>
        <Field label="Status" empty="—">
          <Badge status={role.is_active ? 'positive' : 'error'} size="sm">
            {role.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </Field>
      </FieldGrid>
    </div>
  ) : null;

  const usersContent = role ? (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Users</h3>
      {users.length === 0 ? (
        <p style={emptyState}>No users assigned to this role.</p>
      ) : (
        <div style={profileCardGrid}>
          {users.map((u) => {
            const fullName = `${u.first_name} ${u.last_name}`.trim();
            return (
              <ProfileCard
                key={u.id}
                variant="user"
                name={fullName}
                subtitle={u.email}
                role={role.name}
                department={u.department}
                departmentBg={departmentColor(u.department_color).light}
                departmentText={departmentColor(u.department_color).text}
                onClick={onNavigate ? () => onNavigate('user', { id: u.id }, { title: fullName }) : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  ) : null;

  const departmentsContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Departments</h3>
      {departments.length === 0 ? (
        <p style={emptyState}>No departments assigned to this role.</p>
      ) : (
        <div style={profileCardGrid}>
          {departments.map((d) => (
            <ProfileCard
              key={d.id ?? d.name}
              variant="department"
              name={d.name}
              dotColor={departmentColor(d.departmentColor).light}
              onClick={onNavigate && d.id ? () => onNavigate('department', { id: d.id as string }, { title: d.name }) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );

  const sheetTabs: SheetTab[] = [
    { id: 'details', label: 'Details', content: detailsContent },
    { id: 'users', label: 'Users', content: usersContent },
    { id: 'departments', label: 'Departments', content: departmentsContent },
  ];

  const footer = (
    <div style={{ display: 'flex', alignItems: 'center', gap: gap.md, justifyContent: 'flex-end' }}>
      <Button variant="ghost" size="md" type="button" onClick={onClose}>Close</Button>
      {onEdit && (
        <Button variant="primary" size="md" type="button" onClick={onEdit}>Edit</Button>
      )}
    </div>
  );

  // ── Headless mode: configure the stack's Sheet ────────────────────────────

  useLayoutEffect(() => {
    if (!headless) return;
    if (fetchLoading || !role) {
      configureSheet({ body: <SheetSkeleton />, footer: <Button variant="ghost" size="md" onClick={onClose}>Close</Button> });
      return;
    }
    configureSheet({
      title: role.name,
      tabs: sheetTabs,
      activeTab,
      onTabChange: setActiveTab,
      footer,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headless, configureSheet, fetchLoading, role?.id, role?.name, activeTab, users.length, departments.length, onClose, onEdit]);

  if (headless) return null;

  // ── Page-level mode: render own Sheet ─────────────────────────────────────

  if (fetchLoading || !role) {
    return (
      <Sheet variant="floating" isOpen={isOpen} onClose={onClose} title={<Skeleton variant="text" width="160px" height={20} />} width="600px" side="right">
        <SheetSkeleton />
      </Sheet>
    );
  }

  return (
    <Sheet
      variant="floating"
      isOpen={isOpen}
      onClose={onClose}
      title={role.name}
      width="600px"
      side="right"
      tabs={sheetTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      footer={footer}
    />
  );
}
