'use client';

import { useState, useEffect, useLayoutEffect, type CSSProperties } from 'react';
import { Sheet, Button, Skeleton, useConfigureSheet } from '@bds/components';
import { Badge } from '@bds/components';
import type { SheetTab } from '@bds/components';
import { sheetBodyStyle, sheetSectionTitle } from '@/app/(auth)/settings/_sheetStyles';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import { SheetSkeleton } from '@/components/SheetSkeleton';
import { departmentColor, color, font, gap, space, border } from '@/lib/tokens';
import { ProfileCard, profileCardGrid } from '@/components/ProfileCard';
import type { Role } from '@/hooks/useRoles';
import type { Member } from '@/hooks/useMembers';
import { SECONDARY_DEPTS } from '@/lib/secondary-departments';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DepartmentViewData {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  member_count: number;
}

interface ViewDepartmentSheetProps {
  /** Whether the sheet is open (page-level mode). Defaults to true for global mode. */
  isOpen?: boolean;
  onClose: () => void;
  /** Full department data (page-level mode — skips fetch) */
  department?: DepartmentViewData | null;
  /** Department ID (global mode — fetches data) */
  id?: string;
  onEdit?: () => void;
  /** All practice roles — filtered to this dept inside the component */
  roles?: Role[];
  /** All practice members — filtered to this dept inside the component */
  members?: Member[];
  /** Navigate to a related entity (global sheet stack) */
  onNavigate?: (type: string, props: Record<string, unknown>, opts?: { title?: string }) => void;
  /** When true, uses useConfigureSheet instead of rendering own Sheet (set by AppSheetProvider) */
  headless?: boolean;
}

// ─── Color label lookup ──────────────────────────────────────────────────────

const COLOR_LABELS: Record<string, string> = {
  blue: 'Blue',
  green: 'Green',
  red: 'Red',
  purple: 'Purple',
  gold: 'Gold',
  taupe: 'Taupe',
  brown: 'Brown',
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const colorSwatchRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
};

const colorDot: CSSProperties = {
  width: '12px',
  height: '12px',
  borderRadius: border.radius.circle,
  display: 'inline-block',
  flexShrink: 0,
};

const fieldRow: CSSProperties = { display: 'flex', gap: gap.lg };
const fieldHalf: CSSProperties = { flex: 1, minWidth: 0 };

const emptyState: CSSProperties = {
  padding: `${space.lg} 0`,
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: color.text.secondary,
  textAlign: 'center',
};


// ─── Component ───────────────────────────────────────────────────────────────

export function ViewDepartmentSheet({ isOpen = true, onClose, department: departmentProp, id, onEdit, roles: allRolesProp, members: allMembersProp, onNavigate, headless = false }: ViewDepartmentSheetProps) {
  const configureSheet = useConfigureSheet();
  const [activeTab, setActiveTab] = useState('details');
  const [fetched, setFetched] = useState<DepartmentViewData | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Self-fetch roles and members in global (headless) mode when not provided via props
  const [selfRoles, setSelfRoles] = useState<Role[]>([]);
  const [selfMembers, setSelfMembers] = useState<Member[]>([]);

  // Global mode: fetch by ID when no data prop is given
  const resolvedId = id ?? departmentProp?.id;
  useEffect(() => {
    if (departmentProp || !resolvedId) return;
    setFetchLoading(true);
    fetch(`/api/departments/${resolvedId}`)
      .then(r => r.json())
      .then(data => { if (data && !data.error) setFetched(data); })
      .catch(err => console.error('[ViewDepartmentSheet] fetch failed:', err))
      .finally(() => setFetchLoading(false));
  }, [resolvedId, departmentProp]);

  // Self-fetch related data when props aren't provided
  useEffect(() => {
    if (allRolesProp) return;
    fetch('/api/roles')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSelfRoles(data); })
      .catch(err => console.error('[ViewDepartmentSheet] roles fetch failed:', err));
  }, [allRolesProp]);

  useEffect(() => {
    if (allMembersProp) return;
    fetch('/api/members')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSelfMembers(data); })
      .catch(err => console.error('[ViewDepartmentSheet] members fetch failed:', err));
  }, [allMembersProp]);

  const department = departmentProp ?? fetched;
  const allRoles = allRolesProp ?? selfRoles;
  const allMembers = allMembersProp ?? selfMembers;

  // ── Derived data ──────────────────────────────────────────────────────────

  const roles = department
    ? allRoles.filter(
        (r) => r.department_id === department.id || (SECONDARY_DEPTS[r.name]?.includes(department.name) ?? false),
      )
    : [];
  const roleNames = new Set(roles.map((r) => r.name));
  const users = department
    ? allMembers.filter(
        (m) => m.department_id === department.id || roleNames.has(m.practice_role),
      )
    : [];
  const colorLabel = department ? (COLOR_LABELS[department.color] ?? department.color) : '';

  // ── Tab content ───────────────────────────────────────────────────────────

  const detailsContent = department ? (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Department Details</h3>
      <div style={fieldRow}>
        <div style={fieldHalf}>
          <ReadOnlyField label="Name" value={department.name} />
        </div>
        <div style={fieldHalf}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
            <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: color.text.primary }}>
              Color Tag
            </span>
            {department.color ? (
              <span style={colorSwatchRow}>
                <span style={{ ...colorDot, backgroundColor: departmentColor(department.color).base }} />
                <span style={{ fontFamily: font.family.body, fontSize: font.size.body.md, color: color.text.secondary }}>
                  {colorLabel}
                </span>
              </span>
            ) : (
              <span style={{ fontFamily: font.family.body, fontSize: font.size.body.md, color: color.text.secondary }}>None</span>
            )}
          </div>
        </div>
      </div>
      <div style={fieldRow}>
        <div style={fieldHalf}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
            <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: color.text.primary }}>
              Status
            </span>
            <div style={{ display: 'inline-flex' }}>
              <Badge status={department.is_active ? 'positive' : 'error'} size="sm">
                {department.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
        <div style={fieldHalf}>
          <ReadOnlyField label="Members" value={String(department.member_count)} />
        </div>
      </div>
    </div>
  ) : null;

  const rolesContent = department ? (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Roles</h3>
      {roles.length === 0 ? (
        <p style={emptyState}>No roles assigned to this department.</p>
      ) : (
        <div style={profileCardGrid}>
          {roles.map((r) => (
            <ProfileCard
              key={r.id}
              variant="role"
              name={r.name}
              subtitle={r.description}
              departmentBg={departmentColor(department.color).light}
              departmentText={departmentColor(department.color).text}
              onClick={onNavigate ? () => onNavigate('role', { id: r.id }, { title: r.name }) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  ) : null;

  const usersContent = department ? (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Users</h3>
      {users.length === 0 ? (
        <p style={emptyState}>No users assigned to this department.</p>
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
                role={u.practice_role}
                department={department.name}
                departmentBg={departmentColor(department.color).light}
                departmentText={departmentColor(department.color).text}
                onClick={onNavigate ? () => onNavigate('user', { id: u.id }, { title: fullName }) : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  ) : null;

  const sheetTabs: SheetTab[] = [
    { id: 'details', label: 'Details', content: detailsContent },
    { id: 'roles', label: 'Roles', content: rolesContent },
    { id: 'users', label: 'Users', content: usersContent },
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
    if (fetchLoading || !department) {
      configureSheet({ body: <SheetSkeleton />, footer: <Button variant="ghost" size="md" onClick={onClose}>Close</Button> });
      return;
    }
    configureSheet({
      title: department.name,
      tabs: sheetTabs,
      activeTab,
      onTabChange: setActiveTab,
      footer,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headless, configureSheet, fetchLoading, department?.id, department?.name, activeTab, roles.length, users.length, onClose, onEdit]);

  if (headless) return null;

  // ── Page-level mode: render own Sheet ─────────────────────────────────────

  if (fetchLoading || !department) {
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
      title={department.name}
      width="600px"
      side="right"
      tabs={sheetTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      footer={footer}
    />
  );
}
