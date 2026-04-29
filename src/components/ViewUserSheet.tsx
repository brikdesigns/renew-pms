'use client';

import { useState, useEffect, useLayoutEffect, type CSSProperties } from 'react';
import { Sheet, Button, Skeleton, useConfigureSheet } from '@brikdesigns/bds';
import type { SheetTab } from '@brikdesigns/bds';
import { Badge } from '@brikdesigns/bds';
import { Tag } from '@brikdesigns/bds';
import { ProfileCard, profileCardGrid } from '@/components/ProfileCard';
import { sheetBodyStyle, sheetSectionTitle } from '@/app/(auth)/settings/_sheetStyles';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import { SheetSkeleton } from '@/components/SheetSkeleton';
import { DaysOfWeekPicker } from '@/components/DaysOfWeekPicker';
import { EMPLOYEE_TYPE_TAG, SHIFT_LABELS, SYSTEM_ROLE_LABELS } from '@/lib/member-labels';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserViewData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  system_role: string;
  practice_role: string;
  practice_role_id?: string | null;
  department: string;
  department_id?: string | null;
  department_color: string;
  employee_type: string;
  shift: string;
  office_days: string[];
  is_active: boolean;
  joined_at: string;
}

interface ViewUserSheetProps {
  /** Whether the sheet is open (page-level mode). Defaults to true for global mode. */
  isOpen?: boolean;
  onClose: () => void;
  /** Full user data (page-level mode — skips fetch) */
  user?: UserViewData | null;
  /** User ID (global mode — fetches data) */
  id?: string;
  onEdit?: () => void;
  /** Navigate to a related entity (global sheet stack) */
  onNavigate?: (type: string, props: Record<string, unknown>, opts?: { title?: string }) => void;
  /** When true, uses useConfigureSheet instead of rendering own Sheet (set by AppSheetProvider) */
  headless?: boolean;
}

// ─── Tokens ──────────────────────────────────────────────────────────────────

import { font, color, gap, space, border, departmentColor } from '@/lib/tokens';

const TEXT_PRIMARY = color.text.primary;
const TEXT_SECONDARY = color.text.secondary;

// ─── Styles ──────────────────────────────────────────────────────────────────

const fieldRow: CSSProperties = { display: 'flex', gap: gap.lg };
const fieldHalf: CSSProperties = { flex: 1, minWidth: 0 };

const emptyState: CSSProperties = {
  padding: `${space.lg} 0`,
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: TEXT_SECONDARY,
  textAlign: 'center',
};

const progressTrackStyle: CSSProperties = {
  width: '100%',
  height: '6px',
  borderRadius: border.radius.xs,
  backgroundColor: color.background.muted,
  overflow: 'hidden',
  position: 'relative',
};

const progressLabelStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: font.weight.semibold,
  color: TEXT_SECONDARY,
};


// ─── Component ───────────────────────────────────────────────────────────────

export function ViewUserSheet({ isOpen = true, onClose, user: userProp, id, onEdit, onNavigate, headless = false }: ViewUserSheetProps) {
  const configureSheet = useConfigureSheet();
  const [activeTab, setActiveTab] = useState('details');
  const [fetched, setFetched] = useState<UserViewData | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Global mode: fetch by ID when no data prop is given
  const resolvedId = id ?? userProp?.id;
  useEffect(() => {
    if (userProp || !resolvedId) return;
    setFetchLoading(true);
    fetch(`/api/members/${resolvedId}`)
      .then(r => r.json())
      .then(data => { if (data && !data.error) setFetched(data); })
      .catch(err => console.error('[ViewUserSheet] fetch failed:', err))
      .finally(() => setFetchLoading(false));
  }, [resolvedId, userProp]);

  const user = userProp ?? fetched;

  // ── Derived data ──────────────────────────────────────────────────────────

  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : '';

  const roles = user?.practice_role
    ? [{ id: user.practice_role_id ?? null, role: user.practice_role, department: user.department, departmentColor: user.department_color }]
    : [];
  const departments = user?.department
    ? [{ id: user.department_id ?? null, department: user.department, departmentColor: user.department_color }]
    : [];

  // Training placeholder
  const totalModules = 0;
  const completedModules = 0;
  const progress = 0;
  const empType = EMPLOYEE_TYPE_TAG[user?.employee_type ?? ''] ?? EMPLOYEE_TYPE_TAG.proficient;

  // ── Tab content ───────────────────────────────────────────────────────────

  const detailsContent = user ? (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>User Details</h3>
      <div style={fieldRow}>
        <div style={fieldHalf}>
          <ReadOnlyField label="First Name" value={user.first_name} />
        </div>
        <div style={fieldHalf}>
          <ReadOnlyField label="Last Name" value={user.last_name} />
        </div>
      </div>
      <div style={fieldRow}>
        <div style={fieldHalf}>
          <ReadOnlyField label="Email" value={user.email} />
        </div>
        <div style={fieldHalf}>
          <ReadOnlyField label="Phone" value={user.phone || null} />
        </div>
      </div>
      <div style={fieldRow}>
        <div style={fieldHalf}>
          <ReadOnlyField label="System Role" value={SYSTEM_ROLE_LABELS[user.system_role] ?? user.system_role} />
        </div>
        <div style={fieldHalf}>
          <ReadOnlyField label="Practice Role" value={user.practice_role || null} />
        </div>
      </div>
      <div style={fieldRow}>
        <div style={fieldHalf}>
          <ReadOnlyField label="Department" value={user.department || null} />
        </div>
        <div style={fieldHalf}>
          <ReadOnlyField label="Shift" value={user.shift ? (SHIFT_LABELS[user.shift] ?? user.shift) : null} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
        <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: TEXT_PRIMARY }}>
          Days in Office
        </span>
        {user.office_days.length > 0 ? (
          <DaysOfWeekPicker value={user.office_days} readOnly />
        ) : (
          <span style={{ fontFamily: font.family.body, fontSize: font.size.body.sm, color: TEXT_SECONDARY }}>—</span>
        )}
      </div>
      <div style={fieldRow}>
        <div style={fieldHalf}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
            <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: TEXT_PRIMARY }}>
              Employee Type
            </span>
            <div style={{ display: 'inline-flex' }}>
              <Tag size="sm" style={{ backgroundColor: empType.bg, color: empType.color }}>
                {empType.label}
              </Tag>
            </div>
          </div>
        </div>
        <div style={fieldHalf}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
            <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: TEXT_PRIMARY }}>
              Account Status
            </span>
            <div style={{ display: 'inline-flex' }}>
              <Badge status={user.is_active ? 'positive' : 'error'} size="sm">
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      {user.joined_at && (
        <ReadOnlyField label="Joined" value={new Date(user.joined_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
      )}
    </div>
  ) : null;

  const rolesContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Roles</h3>
      {roles.length === 0 ? (
        <p style={emptyState}>No roles assigned to this user.</p>
      ) : (
        <div style={profileCardGrid}>
          {roles.map((r) => (
            <ProfileCard
              key={r.id ?? r.role}
              variant="role"
              name={r.role}
              subtitle={r.department}
              departmentBg={departmentColor(r.departmentColor).light}
              departmentText={departmentColor(r.departmentColor).text}
              onClick={onNavigate && r.id ? () => onNavigate('role', { id: r.id as string }, { title: r.role }) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );

  const departmentsContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Departments</h3>
      {departments.length === 0 ? (
        <p style={emptyState}>No departments assigned to this user.</p>
      ) : (
        <div style={profileCardGrid}>
          {departments.map((d) => (
            <ProfileCard
              key={d.id ?? d.department}
              variant="department"
              name={d.department}
              dotColor={departmentColor(d.departmentColor).light}
              onClick={onNavigate && d.id ? () => onNavigate('department', { id: d.id as string }, { title: d.department }) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );

  const trainingContent = user ? (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Employee Status</h3>
      <div style={fieldRow}>
        <div style={fieldHalf}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
            <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: TEXT_PRIMARY }}>
              Employee Type
            </span>
            <div style={{ display: 'inline-flex' }}>
              <Tag size="sm" style={{ backgroundColor: empType.bg, color: empType.color }}>
                {empType.label}
              </Tag>
            </div>
          </div>
        </div>
        <div style={fieldHalf}>
          <ReadOnlyField label="Department" value={user.department || null} />
        </div>
      </div>

      <h3 style={sheetSectionTitle}>Training Progress</h3>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: gap.md }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={progressLabelStyle}>
            {completedModules} of {totalModules} modules completed
          </span>
          <span style={progressLabelStyle}>{progress}%</span>
        </div>
        <div style={progressTrackStyle}>
          <div
            style={{
              position: 'absolute', top: 0, left: 0, height: '100%',
              width: `${progress}%`, borderRadius: border.radius.xs,
              backgroundColor: color.background.brandPrimary,
            }}
          />
        </div>
      </div>

      <h3 style={sheetSectionTitle}>Assigned Modules</h3>
      <p style={emptyState}>
        Training module cards will appear here once training templates are assigned to this team member.
      </p>
    </div>
  ) : null;

  const sheetTabs: SheetTab[] = [
    { id: 'details', label: 'Details', content: detailsContent },
    { id: 'roles', label: 'Roles', content: rolesContent },
    { id: 'departments', label: 'Departments', content: departmentsContent },
    { id: 'training', label: 'Training', content: trainingContent },
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
    if (fetchLoading || !user) {
      configureSheet({ body: <SheetSkeleton />, footer: <Button variant="ghost" size="md" onClick={onClose}>Close</Button> });
      return;
    }
    configureSheet({
      title: fullName,
      tabs: sheetTabs,
      activeTab,
      onTabChange: setActiveTab,
      footer,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headless, configureSheet, fetchLoading, user?.id, fullName, activeTab, roles.length, departments.length, onClose, onEdit]);

  if (headless) return null;

  // ── Page-level mode: render own Sheet ─────────────────────────────────────

  if (fetchLoading || !user) {
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
      title={fullName}
      width="600px"
      side="right"
      tabs={sheetTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      footer={footer}
    />
  );
}
