'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import { Sheet, Button, Skeleton } from '@bds/components';
import type { SheetTab } from '@bds/components';
import { Badge } from '@bds/components';
import { Tag } from '@bds/components';
import { ProfileCard, profileCardGrid } from '@/components/ProfileCard';
import { sheetBodyStyle, sheetSectionTitle } from '@/app/(auth)/settings/_sheetStyles';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import { SheetSkeleton } from '@/components/SheetSkeleton';
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
  department: string;
  department_color: string;
  employee_type: string;
  shift: string;
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

export function ViewUserSheet({ isOpen = true, onClose, user: userProp, id, onEdit, onNavigate }: ViewUserSheetProps) {
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

  if (fetchLoading || !user) {
    return (
      <Sheet variant="floating" isOpen={isOpen} onClose={onClose} title={<Skeleton variant="text" width="160px" height={20} />} width="600px" side="right">
        <SheetSkeleton />
      </Sheet>
    );
  }

  const fullName = `${user.first_name} ${user.last_name}`.trim();

  // A member has exactly one role (via practice_role_types) and one department
  // (via that role's department_id). Shown as single-item lists in the tabs.
  const roles = user.practice_role
    ? [{ id: user.id, role: user.practice_role, department: user.department, departmentColor: user.department_color }]
    : [];
  const departments = user.department
    ? [{ id: user.id, department: user.department, departmentColor: user.department_color }]
    : [];

  const detailsContent = (
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
      <div style={fieldRow}>
        <div style={fieldHalf}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
            <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: TEXT_PRIMARY }}>
              Employee Type
            </span>
            <div style={{ display: 'inline-flex' }}>
              <Tag size="sm" style={{ backgroundColor: (EMPLOYEE_TYPE_TAG[user.employee_type] ?? EMPLOYEE_TYPE_TAG.proficient).bg, color: (EMPLOYEE_TYPE_TAG[user.employee_type] ?? EMPLOYEE_TYPE_TAG.proficient).color }}>
                {(EMPLOYEE_TYPE_TAG[user.employee_type] ?? EMPLOYEE_TYPE_TAG.proficient).label}
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
  );

  const rolesContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Roles</h3>
      {roles.length === 0 ? (
        <p style={emptyState}>No roles assigned to this user.</p>
      ) : (
        <div style={profileCardGrid}>
          {roles.map((r) => (
            <ProfileCard
              key={r.id}
              variant="role"
              name={r.role}
              subtitle={r.department}
              departmentBg={departmentColor(r.departmentColor).light}
              departmentText={departmentColor(r.departmentColor).text}
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
              key={d.id}
              variant="department"
              name={d.department}
              dotColor={departmentColor(d.departmentColor).light}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Training — placeholder until Trainual integration is connected
  const totalModules = 0;
  const completedModules = 0;
  const progress = 0;
  const empType = EMPLOYEE_TYPE_TAG[user.employee_type] ?? EMPLOYEE_TYPE_TAG.proficient;

  const trainingContent = (
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
  );

  const sheetTabs: SheetTab[] = [
    { id: 'details', label: 'Details', content: detailsContent },
    { id: 'roles', label: 'Roles', content: rolesContent },
    { id: 'departments', label: 'Departments', content: departmentsContent },
    { id: 'training', label: 'Training', content: trainingContent },
  ];

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
      footer={
        <div style={{ display: 'flex', alignItems: 'center', gap: gap.md, justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="md" type="button" onClick={onClose}>Close</Button>
          {onEdit && (
            <Button variant="primary" size="md" type="button" onClick={onEdit}>Edit</Button>
          )}
        </div>
      }
    />
  );
}
