'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { Tag, Badge, Tooltip } from '@bds/components';
import { UserAvatar } from '@/components/UserAvatar';
import { color, font, gap, space, border, shadow, departmentColor } from '@/lib/tokens';
import { useDepartments } from '@/hooks/useDepartments';
import { useMembers } from '@/hooks/useMembers';
import { label as labelStyle } from '@/lib/styles';
import type { SystemRole } from '@/lib/auth';
import type { CSSProperties } from 'react';

// ─── Mock data (aggregated from tasks + training pages) ──────────────────────

// TODO: Replace with real overdue task query from DB
const OVERDUE_TASKS = [
  { id: 't1', title: 'Review daily patient schedule', assignee: 'Sarah Mitchell', dept: '(C) Clinical', priority: 'critical' as const },
  { id: 't4', title: 'Conduct daily team huddle', assignee: 'Jessica Torres', dept: '(BA) Business Administration', priority: 'critical' as const },
  { id: 't7', title: 'Sterilize instruments — morning batch', assignee: 'Amanda Chen', dept: '(C) Clinical', priority: 'critical' as const },
  { id: 't17', title: 'Run autoclave cycle — morning', assignee: 'Tyler Nguyen', dept: '(C) Clinical', priority: 'critical' as const },
  { id: 't14', title: 'Chairside setup for morning procedures', assignee: 'Emily Rivera', dept: '(C) Clinical', priority: 'critical' as const },
  { id: 't21', title: 'Confirm next-day appointments', assignee: 'Rachel Foster', dept: '(BA) Business Administration', priority: 'critical' as const },
  { id: 't2', title: 'Verify operatory setup and readiness', assignee: 'Sarah Mitchell', dept: '(C) Clinical', priority: 'warning' as const },
];

// ONBOARDING_MEMBERS sourced from useMembers() — filtered by employee_type !== 'proficient'

// TODO: Replace with real aggregated task query from DB
const MOCK_DEPT_COMPLETION: Record<string, { completed: number; total: number }> = {
  '(C) Clinical':                { completed: 14, total: 22 },
  '(BA) Business Administration': { completed: 4,  total: 6  },
  '(M) Management':              { completed: 2,  total: 5  },
  '(L) Leadership':              { completed: 3,  total: 3  },
  'Facilities':                  { completed: 1,  total: 3  },
};

const COMPLIANCE_ITEMS = [
  { name: 'OSHA Safety Training', assignedTo: 'All Staff', due: 'Q2 2026', status: 'upcoming' as const },
  { name: 'HIPAA Privacy Training', assignedTo: 'All Staff', due: 'Q2 2026', status: 'upcoming' as const },
  { name: 'Infection Control Refresher', assignedTo: 'Clinical', due: 'Apr 15, 2026', status: 'due_soon' as const },
  { name: 'Radiation Safety Review', assignedTo: 'Clinical', due: 'Completed Mar 1', status: 'completed' as const },
];

const TODAY_TOTAL = 32;
const TODAY_COMPLETED = 12;
const TODAY_PCT = Math.round((TODAY_COMPLETED / TODAY_TOTAL) * 100);

// ─── Employee type tags (shared) ─────────────────────────────────────────────

const TYPE_TAG: Record<string, { bg: string; color: string; label: string }> = {
  new:      { bg: color.department.blue.base, color: color.text.inverse, label: 'New Hire' },
  maturing: { bg: color.department.gold.base, color: color.text.inverse, label: 'Maturing' },
};

// ─── Priority mapping ────────────────────────────────────────────────────────

const PRIORITY_BADGE: Record<string, { status: 'error' | 'warning' | 'info'; label: string; icon: string }> = {
  critical: { status: 'error',   label: 'Critical', icon: icon.priorityCritical },
  warning:  { status: 'warning', label: 'Medium',   icon: icon.priorityWarning },
  info:     { status: 'info',    label: 'Low',       icon: icon.priorityInfo },
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.xl,
};

const greetingStyle: CSSProperties = {
  fontFamily: font.family.heading,
  fontSize: font.size.heading.large,
  fontWeight: font.weight.regular,
  color: color.text.primary,
  margin: 0,
};

const subtitleStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: color.text.muted,
  margin: 0,
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: gap.xl,
};

const cardStyle: CSSProperties = {
  backgroundColor: color.background.primary,
  borderRadius: border.radius.lg,
  boxShadow: shadow.sm,
  padding: space.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: gap.lg,
};

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

const cardLinkStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: font.weight.semibold,
  color: color.text.brand,
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: gap.xs,
};

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.md,
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

const listItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${space.xs} ${space.sm}`,
  borderRadius: border.radius.md,
  backgroundColor: color.surface.secondary,
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
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const deptColors = departmentColor(colorKey);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
      <span style={{ fontFamily: font.family.subtitle, fontSize: font.size.subtitle.md, fontWeight: font.weight.semibold, color: color.text.secondary, width: '100px', textAlign: 'right', flexShrink: 0 }}>
        {dept}
      </span>
      <div style={{ flex: 1, height: '14px', borderRadius: border.radius.sm, backgroundColor: color.surface.secondary, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${pct}%`, borderRadius: border.radius.sm, backgroundColor: deptColors.base, transition: 'width 0.3s ease' }} />
      </div>
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

  const isAdminUser = systemRole === 'brik_admin' || systemRole === 'admin';
  const isManager = systemRole === 'manager';
  const isStaff = systemRole === 'staff';

  // Map dept name → color key for all rendering that needs dept colors
  const deptColorMap = useMemo(
    () => new Map(departments.map((d) => [d.name, d.color])),
    [departments]
  );

  // Scope overdue tasks by role
  const scopedOverdueTasks = useMemo(() => {
    if (isAdminUser) return OVERDUE_TASKS;
    if (isManager && userDepartment) return OVERDUE_TASKS.filter((t) => t.dept === userDepartment);
    // Staff: show only tasks assigned to the current user (mock: show first 2 as personal tasks)
    return OVERDUE_TASKS.slice(0, 2);
  }, [isAdminUser, isManager, userDepartment]);

  // Scope department completion by role
  const scopedDeptCompletion = useMemo(() => {
    if (isAdminUser) return MOCK_DEPT_COMPLETION;
    if (isManager && userDepartment) {
      const entry = MOCK_DEPT_COMPLETION[userDepartment];
      return entry ? { [userDepartment]: entry } : {};
    }
    return {};
  }, [isAdminUser, isManager, userDepartment]);

  // Scope compliance items by role
  const scopedComplianceItems = useMemo(() => {
    if (isAdminUser) return COMPLIANCE_ITEMS;
    if (isManager && userDepartment) {
      return COMPLIANCE_ITEMS.filter((item) => item.assignedTo === 'All Staff' || item.assignedTo === userDepartment.replace(/^\([^)]+\)\s*/, ''));
    }
    // Staff: only items assigned to all staff or their department
    if (userDepartment) {
      return COMPLIANCE_ITEMS.filter((item) => item.assignedTo === 'All Staff' || item.assignedTo === userDepartment.replace(/^\([^)]+\)\s*/, ''));
    }
    return COMPLIANCE_ITEMS.filter((item) => item.assignedTo === 'All Staff');
  }, [isAdminUser, isManager, userDepartment]);

  // Onboarding members: scope by role
  // Staff: hide entirely if proficient (handled in render). If not proficient, show only self.
  // Manager: filter to their department. Admin: show all.
  const onboardingMembers = useMemo(() => {
    const onboarding = members.filter((m) => m.employee_type !== 'proficient' && m.is_active);
    if (isAdminUser) return onboarding;
    if (isManager && userDepartment) return onboarding.filter((m) => m.department === userDepartment);
    // Staff: show only themselves if they're onboarding
    return onboarding.filter((m) => m.first_name === userName);
  }, [members, isAdminUser, isManager, userDepartment, userName]);

  // Whether to show onboarding card at all
  const showOnboarding = isAdminUser || isManager || employeeType !== 'proficient';

  // Progress stats — scope for staff (personal) vs manager (department)
  const progressStats = useMemo(() => {
    if (isAdminUser) return { completed: TODAY_COMPLETED, total: TODAY_TOTAL };
    if (isManager && userDepartment) {
      const entry = MOCK_DEPT_COMPLETION[userDepartment];
      return entry ?? { completed: 0, total: 0 };
    }
    // Staff: personal task counts (mock subset)
    return { completed: 3, total: 8 };
  }, [isAdminUser, isManager, userDepartment]);

  const progressPct = progressStats.total > 0 ? Math.round((progressStats.completed / progressStats.total) * 100) : 0;

  const getDeptColors = (deptName: string) => departmentColor(deptColorMap.get(deptName) ?? 'blue');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={pageStyle}>
      <div>
        <h1 style={greetingStyle}>{greeting}, {userName}</h1>
        <p style={subtitleStyle}>
          {isStaff
            ? 'Here\u2019s your personal summary for today.'
            : isManager
              ? `Here\u2019s what\u2019s happening in ${userDepartment ?? 'your department'} today.`
              : 'Here\u2019s what needs your attention today.'}
        </p>
      </div>

      <div style={gridStyle}>
        {/* ── Card 1: Overdue Tasks ── */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: gap.md }}>
              <Icon icon={icon.priorityCritical} style={{ color: color.system.red, fontSize: font.size.body.md } as CSSProperties & Record<string, string>} />
              <h2 style={cardTitleStyle}>
                {isStaff ? 'Your Overdue Tasks' : isManager ? 'Department Overdue Tasks' : 'Overdue Tasks'}
              </h2>
              <span style={{ fontFamily: font.family.subtitle, fontSize: font.size.subtitle.md, fontWeight: font.weight.semibold, color: color.text.muted, backgroundColor: color.surface.secondary, padding: `2px ${gap.md}`, borderRadius: border.radius.sm }}>
                {scopedOverdueTasks.length}
              </span>
            </div>
            <Link href="/tasks" style={cardLinkStyle}>
              View All
            </Link>
          </div>
          <ul style={listStyle}>
            {scopedOverdueTasks.map((task) => {
              const pri = PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.info;
              const deptColors = getDeptColors(task.dept);
              return (
                <li key={task.id} style={{ ...listItemStyle, borderLeft: `3px solid ${deptColors.light}` }}>
                  <div style={listItemLeftStyle}>
                    <div style={{ minWidth: 0 }}>
                      <div style={listItemTitleStyle}>{task.title}</div>
                      <div style={listItemSubStyle}>{task.assignee}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm, flexShrink: 0 }}>
                    <Tag size="sm" style={{ backgroundColor: deptColors.light, color: deptColors.text, flexShrink: 0 }}>{task.dept}</Tag>
                    <Tooltip content={pri.label} placement="top">
                      <Badge status={pri.status} size="xs" variant="dark" icon={<Icon icon={pri.icon} />} style={{ flexShrink: 0 }} />
                    </Tooltip>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ── Card 2: Today's Progress ── */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: gap.md }}>
              <Icon icon={icon.circleCheck} style={{ color: color.system.green, fontSize: font.size.body.md } as CSSProperties & Record<string, string>} />
              <h2 style={cardTitleStyle}>
                {isStaff ? 'Your Progress' : isManager ? 'Department Progress' : 'Today\u2019s Progress'}
              </h2>
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
              {departments.filter((d) => d.is_active && d.name !== 'All Departments' && (isAdminUser || d.name === userDepartment)).map((d) => {
                const counts = scopedDeptCompletion[d.name] ?? { completed: 0, total: 0 };
                return (
                  <DeptBar key={d.id} dept={d.name} colorKey={d.color} completed={counts.completed} total={counts.total} />
                );
              })}
            </div>
          )}
        </div>

        {/* ── Card 3: Onboarding Status (hidden for proficient staff) ── */}
        {showOnboarding && (
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h2 style={cardTitleStyle}>
                {isStaff ? 'Your Onboarding' : isManager ? 'Department Onboarding' : 'Onboarding Status'}
              </h2>
              <Link href="/training" style={cardLinkStyle}>
                View All
              </Link>
            </div>
            <ul style={listStyle}>
              {onboardingMembers.length === 0 && (
                <li style={{ ...listItemStyle, justifyContent: 'center', color: color.text.secondary, fontFamily: font.family.label, fontSize: font.size.label.sm }}>
                  {isManager ? 'No department members currently onboarding.' : 'No members currently onboarding.'}
                </li>
              )}
              {onboardingMembers.map((m) => {
                const typeTag = TYPE_TAG[m.employee_type] ?? TYPE_TAG.new;
                const fullName = `${m.first_name} ${m.last_name}`;
                return (
                  <li key={m.id} style={listItemStyle}>
                    <div style={listItemLeftStyle}>
                      <UserAvatar name={fullName} departmentColorKey={m.department} size="sm" />
                      <div style={{ minWidth: 0 }}>
                        <div style={listItemTitleStyle}>{fullName}</div>
                        <div style={listItemSubStyle}>{m.practice_role || m.department}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: gap.md, flexShrink: 0 }}>
                      <Tag size="sm" style={{ backgroundColor: typeTag.bg, color: typeTag.color }}>{typeTag.label}</Tag>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* ── Card 4: Compliance Due ── */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h2 style={cardTitleStyle}>
              {isStaff ? 'Your Compliance & Training' : isManager ? 'Department Compliance' : 'Compliance & Training Due'}
            </h2>
          </div>
          <ul style={listStyle}>
            {scopedComplianceItems.map((item) => {
              const statusMap = {
                completed: { status: 'positive' as const, label: 'Completed' },
                due_soon: { status: 'warning' as const, label: 'Due Soon' },
                upcoming: { status: 'info' as const, label: 'Upcoming' },
              };
              const badge = statusMap[item.status];
              return (
                <li key={item.name} style={listItemStyle}>
                  <div style={listItemLeftStyle}>
                    <div style={{ minWidth: 0 }}>
                      <div style={listItemTitleStyle}>{item.name}</div>
                      <div style={listItemSubStyle}>{item.assignedTo} · {item.due}</div>
                    </div>
                  </div>
                  <Badge status={badge.status} size="sm">{badge.label}</Badge>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
