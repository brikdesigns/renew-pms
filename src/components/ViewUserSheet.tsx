'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { Sheet, SheetSection, Button, Skeleton, useConfigureSheet, Field, FieldGrid, EmptyState, ProgressBar, SheetHelperText } from '@brikdesigns/bds';
import type { SheetTab } from '@brikdesigns/bds';
import { Badge } from '@brikdesigns/bds';
import { Tag } from '@brikdesigns/bds';
import { ProfileCard, profileCardGrid } from '@/components/ProfileCard';
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

import { gap, departmentColor } from '@/lib/tokens';

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
    <SheetSection heading="User Details">
      <FieldGrid columns={2} gap="lg">
        <Field label="First Name" empty="—">{user.first_name}</Field>
        <Field label="Last Name" empty="—">{user.last_name}</Field>
      </FieldGrid>
      <FieldGrid columns={2} gap="lg">
        <Field label="Email" empty="—">{user.email}</Field>
        <Field label="Phone" empty="—">{user.phone || null}</Field>
      </FieldGrid>
      <FieldGrid columns={2} gap="lg">
        <Field label="System Role" empty="—">{SYSTEM_ROLE_LABELS[user.system_role] ?? user.system_role}</Field>
        <Field label="Practice Role" empty="—">{user.practice_role || null}</Field>
      </FieldGrid>
      <FieldGrid columns={2} gap="lg">
        <Field label="Department" empty="—">{user.department || null}</Field>
        <Field label="Shift" empty="—">{user.shift ? (SHIFT_LABELS[user.shift] ?? user.shift) : null}</Field>
      </FieldGrid>
      <Field label="Days in Office" empty="—">
        {user.office_days.length > 0 ? (
          <DaysOfWeekPicker value={user.office_days} readOnly />
        ) : null}
      </Field>
      <FieldGrid columns={2} gap="lg">
        <Field label="Employee Type" empty="—">
          <Tag size="sm" style={{ backgroundColor: empType.bg, color: empType.color }}>
            {empType.label}
          </Tag>
        </Field>
        <Field label="Account Status" empty="—">
          <Badge status={user.is_active ? 'positive' : 'error'} size="sm">
            {user.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </Field>
      </FieldGrid>
      {user.joined_at && (
        <Field label="Joined" empty="—">{new Date(user.joined_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Field>
      )}
    </SheetSection>
  ) : null;

  const rolesContent = (
    <SheetSection heading="Roles">
      {roles.length === 0 ? (
        <EmptyState title="No roles" description="No roles assigned to this user." />
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
    </SheetSection>
  );

  const departmentsContent = (
    <SheetSection heading="Departments">
      {departments.length === 0 ? (
        <EmptyState title="No departments" description="No departments assigned to this user." />
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
    </SheetSection>
  );

  const trainingContent = user ? (
    <>
      <SheetSection heading="Employee Status">
        <FieldGrid columns={2} gap="lg">
          <Field label="Employee Type" empty="—">
            <Tag size="sm" style={{ backgroundColor: empType.bg, color: empType.color }}>
              {empType.label}
            </Tag>
          </Field>
          <Field label="Department" empty="—">{user.department || null}</Field>
        </FieldGrid>
      </SheetSection>

      <SheetSection heading="Training Progress">
        <ProgressBar value={progress} label="Training modules completed" />
        <SheetHelperText>{completedModules} of {totalModules} modules completed ({progress}%)</SheetHelperText>
      </SheetSection>

      <SheetSection heading="Assigned Modules">
        <EmptyState
          title="No modules assigned"
          description="Training module cards will appear here once training templates are assigned to this team member."
        />
      </SheetSection>
    </>
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
