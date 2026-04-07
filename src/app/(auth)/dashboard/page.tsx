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
import type { CSSProperties } from 'react';

// ─── Mock data (aggregated from tasks + training pages) ──────────────────────

const OVERDUE_TASKS = [
  { id: 't1', title: 'Review daily patient schedule', assignee: 'Sarah Mitchell', dept: 'Clinical', priority: 'critical' as const },
  { id: 't4', title: 'Conduct daily team huddle', assignee: 'Jessica Torres', dept: 'Administration', priority: 'critical' as const },
  { id: 't7', title: 'Sterilize instruments — morning batch', assignee: 'Amanda Chen', dept: 'Clinical', priority: 'critical' as const },
  { id: 't17', title: 'Run autoclave cycle — morning', assignee: 'Tyler Nguyen', dept: 'Sterilization', priority: 'critical' as const },
  { id: 't14', title: 'Chairside setup for morning procedures', assignee: 'Emily Rivera', dept: 'Clinical', priority: 'critical' as const },
  { id: 't21', title: 'Confirm next-day appointments', assignee: 'Rachel Foster', dept: 'Front Desk', priority: 'critical' as const },
  { id: 't2', title: 'Verify operatory setup and readiness', assignee: 'Sarah Mitchell', dept: 'Clinical', priority: 'warning' as const },
];

// ONBOARDING_MEMBERS sourced from useMembers() — filtered by employee_type !== 'proficient'

// Mock task completion counts keyed by department name.
// Replace with real aggregated task query once tasks are wired to the DB.
const MOCK_DEPT_COMPLETION: Record<string, { completed: number; total: number }> = {
  'Clinical':       { completed: 14, total: 22 },
  'Administration': { completed: 4,  total: 6  },
  'Front Desk':     { completed: 5,  total: 9  },
  'Sterilization':  { completed: 2,  total: 7  },
  'Maintenance':    { completed: 1,  total: 3  },
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
  fontSize: font.size.heading.medium,
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

export default function DashboardPage() {
  const { departments } = useDepartments();
  const { members } = useMembers();

  // Map dept name → color key for all rendering that needs dept colors
  const deptColorMap = useMemo(
    () => new Map(departments.map((d) => [d.name, d.color])),
    [departments]
  );

  // Onboarding members: new hires and maturing staff (not yet fully active)
  const onboardingMembers = useMemo(
    () => members.filter((m) => m.employee_type !== 'proficient' && m.is_active),
    [members]
  );

  const getDeptColors = (deptName: string) => departmentColor(deptColorMap.get(deptName) ?? 'blue');

  return (
    <div style={pageStyle}>
      <div>
        <h1 style={greetingStyle}>Dashboard</h1>
        <p style={subtitleStyle}>Here&apos;s what needs your attention today.</p>
      </div>

      <div style={gridStyle}>
        {/* ── Card 1: Overdue Tasks ── */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: gap.md }}>
              <Icon icon={icon.priorityCritical} style={{ color: color.system.red, fontSize: font.size.body.md } as CSSProperties & Record<string, string>} />
              <h2 style={cardTitleStyle}>Overdue Tasks</h2>
              <span style={{ fontFamily: font.family.subtitle, fontSize: font.size.subtitle.md, fontWeight: font.weight.semibold, color: color.text.muted, backgroundColor: color.surface.secondary, padding: `2px ${gap.md}`, borderRadius: border.radius.sm }}>
                {OVERDUE_TASKS.length}
              </span>
            </div>
            <Link href="/tasks" style={cardLinkStyle}>
              View All
            </Link>
          </div>
          <ul style={listStyle}>
            {OVERDUE_TASKS.map((task) => {
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
              <h2 style={cardTitleStyle}>Today&apos;s Progress</h2>
            </div>
          </div>
          {/* Top row: ring + stats spread across right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: space.xl }}>
            <ProgressRing pct={TODAY_PCT} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: font.family.heading, fontSize: font.size.heading.large, fontWeight: font.weight.bold, color: color.system.green }}>{TODAY_COMPLETED}</div>
                <div style={{ ...labelStyle.subtitle, color: color.text.muted }}>Completed</div>
              </div>
              <div style={{ width: '1px', height: '40px', backgroundColor: color.border.muted, flexShrink: 0 }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: font.family.heading, fontSize: font.size.heading.large, fontWeight: font.weight.bold, color: color.text.primary }}>{TODAY_TOTAL - TODAY_COMPLETED}</div>
                <div style={{ ...labelStyle.subtitle, color: color.text.muted }}>Remaining</div>
              </div>
              <div style={{ width: '1px', height: '40px', backgroundColor: color.border.muted, flexShrink: 0 }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: font.family.heading, fontSize: font.size.heading.large, fontWeight: font.weight.bold, color: color.system.red }}>{OVERDUE_TASKS.length}</div>
                <div style={{ ...labelStyle.subtitle, color: color.text.muted }}>Overdue</div>
              </div>
            </div>
          </div>
          {/* Department bar chart — driven by departments from Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: gap.lg, flex: 1, justifyContent: 'space-between' }}>
            <span style={{ ...labelStyle.subtitle, color: color.text.muted }}>By Department</span>
            {departments.filter((d) => d.is_active && d.name !== 'All Departments').map((d) => {
              const counts = MOCK_DEPT_COMPLETION[d.name] ?? { completed: 0, total: 0 };
              return (
                <DeptBar key={d.id} dept={d.name} colorKey={d.color} completed={counts.completed} total={counts.total} />
              );
            })}
          </div>
        </div>

        {/* ── Card 3: Onboarding Status ── */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h2 style={cardTitleStyle}>Onboarding Status</h2>
            <Link href="/training" style={cardLinkStyle}>
              View All
            </Link>
          </div>
          <ul style={listStyle}>
            {onboardingMembers.length === 0 && (
              <li style={{ ...listItemStyle, justifyContent: 'center', color: color.text.secondary, fontFamily: font.family.label, fontSize: font.size.label.sm }}>
                No members currently onboarding.
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

        {/* ── Card 4: Compliance Due ── */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h2 style={cardTitleStyle}>Compliance & Training Due</h2>
          </div>
          <ul style={listStyle}>
            {COMPLIANCE_ITEMS.map((item) => {
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
