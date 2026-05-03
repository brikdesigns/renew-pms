'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { Card, Meter, PageHeader, Tag, useSheetStack } from '@brikdesigns/bds';
import { PriorityBadge } from '@/components/PriorityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { ProfileCard } from '@/components/ProfileCard';
import { CardSkeleton } from '@/components/CardSkeleton';
import { color, font, gap, space, border, state, motion, departmentColor } from '@/lib/tokens';
import { useDepartments } from '@/hooks/useDepartments';
import { useMembers } from '@/hooks/useMembers';
import { useDashboard } from '@/hooks/useDashboard';
import { label as labelStyle } from '@/lib/styles';
import { EMPLOYEE_TYPE_TAG } from '@/lib/member-labels';
import type { SystemRole } from '@/lib/auth';
import type { CSSProperties } from 'react';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}


// ─── Styles ──────────────────────────────────────────────────────────────────

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.xl,
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: gap.xl,
};

const CARD_MIN_HEIGHT = '340px';

const cardMinHeightStyle: CSSProperties = { minHeight: CARD_MIN_HEIGHT };

const cardHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const cardTitleStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.lg,
  fontWeight: font.weight.bold,
  color: color.text.primary,
  margin: 0,
};

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.md,
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

function listItemBg(hovered: boolean): string {
  return hovered ? state.hover.secondary : color.surface.secondary;
}

const listItemBase: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${space.xs} ${space.sm}`,
  borderRadius: border.radius.md,
  cursor: 'pointer',
  transition: `background-color ${motion.duration.fast} ${motion.ease.out}`,
  border: 'none',
  width: '100%',
  textAlign: 'left',
};

/** Interactive list item with hover state — matches ProfileCard interaction pattern */
function HoverLi({ onClick, style, children }: { onClick: () => void; style?: CSSProperties; children: ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <li
      style={{ ...listItemBase, backgroundColor: listItemBg(hovered), ...style }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </li>
  );
}

/** Static list item (no click) for empty states */
const listItemStaticStyle: CSSProperties = {
  ...listItemBase,
  cursor: 'default',
  backgroundColor: color.surface.secondary,
  justifyContent: 'center',
};

const listItemLeftStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
  minWidth: 0,
  flex: 1,
};

const listItemTitleStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: font.weight.semibold,
  color: color.text.primary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const listItemSubStyle: CSSProperties = {
  fontFamily: font.family.subtitle,
  fontSize: font.size.subtitle.md,
  fontWeight: font.weight.regular,
  color: color.text.secondary,
};

// ─── Progress ring (SVG donut) ───────────────────────────────────────────────

function ProgressRing({ pct, size = 120 }: { pct: number; size?: number }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color.background.muted} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color.background.brandPrimary} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
        style={{ fontFamily: font.family.heading, fontSize: font.size.heading.medium, fontWeight: font.weight.bold, fill: color.text.primary }}>
        {pct}%
      </text>
    </svg>
  );
}

// ─── Bar chart ───────────────────────────────────────────────────────────────

function DeptBar({ dept, colorKey, completed, total }: { dept: string; colorKey: string; completed: number; total: number }) {
  const deptColors = departmentColor(colorKey);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
      <span style={{ fontFamily: font.family.subtitle, fontSize: font.size.subtitle.md, fontWeight: font.weight.semibold, color: color.text.secondary, width: '100px', textAlign: 'right', flexShrink: 0 }}>
        {dept}
      </span>
      <Meter
        value={completed}
        max={total}
        fillColor={deptColors.base}
        showValue={false}
        size="lg"
        style={{ flex: 1 }}
        aria-label={`${dept}: ${completed} of ${total} complete`}
      />
      <span style={{ fontFamily: font.family.subtitle, fontSize: font.size.subtitle.md, fontWeight: font.weight.semibold, color: color.text.secondary, width: '48px', flexShrink: 0 }}>
        {completed}/{total}
      </span>
    </div>
  );
}

// ─── Progress bar (inline) ───────────────────────────────────────────────────

// ─── Component ───────────────────────────────────────────────────────────────

interface DashboardClientProps {
  userName: string;
  systemRole: SystemRole;
  employeeType: string;
  userDepartment: string | null;
}

export default function DashboardClient({ userName, systemRole, employeeType, userDepartment }: DashboardClientProps) {
  const { departments } = useDepartments();
  const { members } = useMembers();
  const { data: dashboard, loading: dashLoading } = useDashboard();
  const { openSheet } = useSheetStack();

  const isAdminUser = systemRole === 'brik_admin' || systemRole === 'admin';
  const isManager = systemRole === 'manager';
  const isStaff = systemRole === 'staff';

  // Map dept name → color key for all rendering that needs dept colors
  const deptColorMap = useMemo(
    () => new Map(departments.map((d) => [d.name, d.color])),
    [departments]
  );

  // Scope overdue tasks by role (API returns all practice tasks; filter client-side by role)
  const scopedOverdueTasks = useMemo(() => {
    const all = dashboard?.overdueTasks ?? [];
    if (isAdminUser) return all;
    if (isManager && userDepartment) return all.filter((t) => t.dept === userDepartment);
    // Staff: only tasks assigned to the current user
    return all.filter((t) => t.assignee.includes(userName));
  }, [dashboard, isAdminUser, isManager, userDepartment, userName]);

  // Scope department completion by role
  const scopedDeptCompletion = useMemo(() => {
    const all = dashboard?.departmentCompletion ?? {};
    if (isAdminUser) return all;
    if (isManager && userDepartment) {
      const entry = all[userDepartment];
      return entry ? { [userDepartment]: entry } : {};
    }
    return {};
  }, [dashboard, isAdminUser, isManager, userDepartment]);

  // Scope recent requests by role
  const scopedRequests = useMemo(() => {
    const all = dashboard?.recentRequests ?? [];
    if (isAdminUser) return all;
    if (isManager && userDepartment) return all.filter((r) => r.dept === userDepartment);
    return all.filter((r) => r.submitter.includes(userName));
  }, [dashboard, isAdminUser, isManager, userDepartment, userName]);

  // Onboarding members: scope by role, cap at 6
  const onboardingMembers = useMemo(() => {
    const onboarding = members.filter((m) => m.employee_type !== 'proficient' && m.is_active);
    let scoped: typeof onboarding;
    if (isAdminUser) scoped = onboarding;
    else if (isManager && userDepartment) scoped = onboarding.filter((m) => m.department === userDepartment);
    else scoped = onboarding.filter((m) => m.first_name === userName);
    return scoped.slice(0, 6);
  }, [members, isAdminUser, isManager, userDepartment, userName]);

  const showOnboarding = isAdminUser || isManager || employeeType !== 'proficient';

  // Progress stats from real data
  const progressStats = useMemo(() => {
    if (!dashboard) return { completed: 0, total: 0 };
    if (isAdminUser) return dashboard.todayProgress;
    if (isManager && userDepartment) {
      const entry = dashboard.departmentCompletion[userDepartment];
      return entry ? { completed: entry.completed, total: entry.total } : { completed: 0, total: 0 };
    }
    // Staff: use overall progress (API already scopes by practice)
    return dashboard.todayProgress;
  }, [dashboard, isAdminUser, isManager, userDepartment]);

  const progressPct = progressStats.total > 0 ? Math.round((progressStats.completed / progressStats.total) * 100) : 0;

  const getDeptColors = (deptName: string) => departmentColor(deptColorMap.get(deptName) ?? 'blue');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const subtitleText = isStaff
    ? 'Here\u2019s your personal summary for today.'
    : isManager
      ? `Here\u2019s what\u2019s happening in ${userDepartment ?? 'your department'} today.`
      : 'Here\u2019s what needs your attention today.';

  return (
    <div style={pageStyle}>
      <PageHeader title={`${greeting}, ${userName}`} subtitle={subtitleText} />

      <div style={gridStyle}>
        {/* ── Card 1: Overdue Tasks ── */}
        {dashLoading ? (
          <CardSkeleton variant="list" rows={4} minHeight={CARD_MIN_HEIGHT} />
        ) : (
        <Card variant="elevated" padding="lg" style={cardMinHeightStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: gap.md }}>
              <Icon icon={icon.priorityCritical} style={{ color: color.system.red, fontSize: font.size.body.md } as CSSProperties & Record<string, string>} />
              <div style={cardTitleStyle}>
                {isStaff ? 'Your Overdue Tasks' : isManager ? 'Department Overdue Tasks' : 'Overdue Tasks'}
              </div>
              <span style={{ fontFamily: font.family.subtitle, fontSize: font.size.subtitle.md, fontWeight: font.weight.semibold, color: color.text.muted, backgroundColor: color.surface.secondary, padding: `2px ${gap.md}`, borderRadius: border.radius.sm }}>
                {scopedOverdueTasks.length}
              </span>
            </div>
            <Link href="/tasks" className="bds-text-link">
              View All
            </Link>
          </div>
          <ul style={listStyle}>
            {scopedOverdueTasks.length === 0 ? (
              <li style={{ ...listItemStaticStyle, color: color.text.muted, fontFamily: font.family.label, fontSize: font.size.label.sm }}>
                No overdue tasks
              </li>
            ) : scopedOverdueTasks.map((task) => {
              const deptColors = task.deptColor ? departmentColor(task.deptColor) : getDeptColors(task.dept);
              return (
                <HoverLi key={task.id} style={{ borderLeft: `3px solid ${deptColors.light}` }}
                  onClick={() => openSheet('task', { id: task.id }, { title: task.title, variant: 'floating' })}>
                  <div style={listItemLeftStyle}>
                    <div style={{ minWidth: 0 }}>
                      <div style={listItemTitleStyle}>{task.title}</div>
                      <div style={listItemSubStyle}>{task.assignee}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm, flexShrink: 0 }}>
                    {task.dept && <Tag size="sm" style={{ backgroundColor: deptColors.light, color: deptColors.text, flexShrink: 0 }}>{task.dept}</Tag>}
                    <PriorityBadge priority={task.priority} size="xs" />
                  </div>
                </HoverLi>
              );
            })}
          </ul>
        </Card>
        )}

        {/* ── Card 2: Today's Progress ── */}
        {dashLoading ? (
          <CardSkeleton variant="stats" minHeight={CARD_MIN_HEIGHT} />
        ) : (
        <Card variant="elevated" padding="lg" style={cardMinHeightStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: gap.md }}>
              <Icon icon={icon.circleCheck} style={{ color: color.system.green, fontSize: font.size.body.md } as CSSProperties & Record<string, string>} />
              <div style={cardTitleStyle}>
                {isStaff ? 'Your Progress' : isManager ? 'Department Progress' : 'Today\u2019s Progress'}
              </div>
            </div>
          </div>
          {/* Top row: ring + stats spread across right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: space.xl }}>
            <ProgressRing pct={progressPct} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: font.family.heading, fontSize: font.size.heading.large, fontWeight: font.weight.bold, color: color.system.green }}>{progressStats.completed}</div>
                <div style={{ ...labelStyle.subtitle, color: color.text.muted }}>Completed</div>
              </div>
              <div style={{ width: '1px', height: '40px', backgroundColor: color.border.muted, flexShrink: 0 }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: font.family.heading, fontSize: font.size.heading.large, fontWeight: font.weight.bold, color: color.text.primary }}>{progressStats.total - progressStats.completed}</div>
                <div style={{ ...labelStyle.subtitle, color: color.text.muted }}>Remaining</div>
              </div>
              <div style={{ width: '1px', height: '40px', backgroundColor: color.border.muted, flexShrink: 0 }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: font.family.heading, fontSize: font.size.heading.large, fontWeight: font.weight.bold, color: color.system.red }}>{scopedOverdueTasks.length}</div>
                <div style={{ ...labelStyle.subtitle, color: color.text.muted }}>Overdue</div>
              </div>
            </div>
          </div>
          {/* Department bar chart — hidden for staff (personal view), scoped for manager */}
          {!isStaff && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: gap.lg, flex: 1, justifyContent: 'space-between' }}>
              <span style={{ ...labelStyle.subtitle, color: color.text.muted }}>
                {isManager ? 'Department Breakdown' : 'By Department'}
              </span>
              {Object.entries(scopedDeptCompletion)
                .filter(([name]) => name !== '(G) All Departments')
                .map(([name, counts]) => (
                  <DeptBar key={name} dept={name} colorKey={counts.color} completed={counts.completed} total={counts.total} />
                ))
              }
            </div>
          )}
        </Card>
        )}

        {/* ── Card 3: Onboarding Status (hidden for proficient staff) ── */}
        {showOnboarding && (
          <Card variant="elevated" padding="lg" style={cardMinHeightStyle}>
            <div style={cardHeaderStyle}>
              <div style={cardTitleStyle}>
                {isStaff ? 'Your Onboarding' : isManager ? 'Department Onboarding' : 'Onboarding Status'}
              </div>
              <Link href="/training" className="bds-text-link">
                View All
              </Link>
            </div>
            <ul style={listStyle}>
              {onboardingMembers.length === 0 && (
                <li style={{ ...listItemStaticStyle, color: color.text.secondary, fontFamily: font.family.label, fontSize: font.size.label.sm }}>
                  {isManager ? 'No department members currently onboarding.' : 'No members currently onboarding.'}
                </li>
              )}
              {onboardingMembers.map((m) => {
                const typeTag = EMPLOYEE_TYPE_TAG[m.employee_type] ?? EMPLOYEE_TYPE_TAG.new;
                const fullName = `${m.first_name} ${m.last_name}`;
                const deptColors = departmentColor(m.department_color);
                return (
                  <li key={m.id}>
                    <ProfileCard
                      variant="user"
                      avatarSize="sm"
                      name={fullName}
                      role={m.practice_role || m.department}
                      department={m.department}
                      departmentBg={deptColors.light}
                      departmentText={deptColors.text}
                      endContent={<Tag size="sm" style={{ backgroundColor: typeTag.bg, color: typeTag.color }}>{typeTag.label}</Tag>}
                      onClick={() => openSheet('user', { id: m.id }, { title: fullName, variant: 'floating' })}
                    />
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        {/* ── Card 4: Recent Requests ── */}
        {dashLoading ? (
          <CardSkeleton variant="list" rows={4} minHeight={CARD_MIN_HEIGHT} />
        ) : (
        <Card variant="elevated" padding="lg" style={cardMinHeightStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: gap.md }}>
              <Icon icon={icon.requests} style={{ color: color.text.brand, fontSize: font.size.body.md } as CSSProperties & Record<string, string>} />
              <div style={cardTitleStyle}>
                {isStaff ? 'Your Requests' : isManager ? 'Department Requests' : 'Recent Requests'}
              </div>
              <span style={{ fontFamily: font.family.subtitle, fontSize: font.size.subtitle.md, fontWeight: font.weight.semibold, color: color.text.muted, backgroundColor: color.surface.secondary, padding: `2px ${gap.md}`, borderRadius: border.radius.sm }}>
                {scopedRequests.length}
              </span>
            </div>
            <Link href="/requests" className="bds-text-link">
              View All
            </Link>
          </div>
          <ul style={listStyle}>
            {scopedRequests.length === 0 ? (
              <li style={{ ...listItemStaticStyle, color: color.text.muted, fontFamily: font.family.label, fontSize: font.size.label.sm }}>
                No open requests
              </li>
            ) : scopedRequests.map((req) => {
              const deptColors = req.deptColor ? departmentColor(req.deptColor) : getDeptColors(req.dept);
              const timeAgo = formatTimeAgo(req.updatedAt);
              return (
                <HoverLi key={req.id} style={{ borderLeft: `3px solid ${deptColors.light}` }}
                  onClick={() => openSheet('request', { id: req.id }, { title: req.title, variant: 'floating' })}>
                  <div style={listItemLeftStyle}>
                    <div style={{ minWidth: 0 }}>
                      <div style={listItemTitleStyle}>{req.title}</div>
                      <div style={listItemSubStyle}>{req.submitter} · {timeAgo}</div>
                    </div>
                  </div>
                  <StatusBadge status={req.status} />
                </HoverLi>
              );
            })}
          </ul>
        </Card>
        )}
      </div>
    </div>
  );
}
