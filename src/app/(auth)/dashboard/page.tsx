'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { Tag } from '@bds/components';
import { Badge } from '@bds/components';
import { UserAvatar } from '@/components/UserAvatar';
import { getDepartmentColors } from '@/lib/department-colors';
import { color, font, gap, space, border, shadow } from '@/lib/tokens';
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

const ONBOARDING_MEMBERS = [
  { id: 'pm-jordan', name: 'Jordan Hayes', role: 'Inventory Manager', dept: 'Engineering', type: 'new' as const, progress: 12, completed: 1, total: 6 },
  { id: 'pm-tyler', name: 'Tyler Nguyen', role: 'Dental Assistant', dept: 'Sterilization', type: 'new' as const, progress: 25, completed: 2, total: 8 },
  { id: 'pm-rachel', name: 'Rachel Foster', role: 'Receptionist', dept: 'Front Desk', type: 'maturing' as const, progress: 60, completed: 3, total: 5 },
  { id: 'pm-emily', name: 'Emily Rivera', role: 'Dental Assistant', dept: 'Clinical', type: 'maturing' as const, progress: 75, completed: 6, total: 8 },
];

const DEPT_COMPLETION = [
  { dept: 'Clinical', completed: 14, total: 22 },
  { dept: 'Administration', completed: 4, total: 6 },
  { dept: 'Front Desk', completed: 5, total: 9 },
  { dept: 'Sterilization', completed: 2, total: 7 },
  { dept: 'Engineering', completed: 1, total: 3 },
];

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
  new:      { bg: color.department.blue.base, color: color.text.onColorDark, label: 'New Hire' },
  maturing: { bg: color.department.gold.base, color: color.text.onColorDark, label: 'Maturing' },
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
  fontWeight: 400,
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
  fontWeight: 800,
  color: color.text.primary,
  margin: 0,
};

const cardLinkStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.body.sm,
  fontWeight: 600,
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
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  fontWeight: 600,
  color: color.text.primary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const listItemSubStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.xs,
  fontWeight: 400,
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
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--background-muted)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--background-brand-primary)" strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
        style={{ fontFamily: font.family.heading, fontSize: font.size.heading.medium, fontWeight: 700, fill: color.text.primary }}>
        {pct}%
      </text>
    </svg>
  );
}

// ─── Bar chart ───────────────────────────────────────────────────────────────

function DeptBar({ dept, completed, total }: { dept: string; completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const deptColors = getDepartmentColors(dept);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
      <span style={{ fontFamily: font.family.label, fontSize: font.size.body.xs, fontWeight: 600, color: color.text.secondary, width: '100px', textAlign: 'right', flexShrink: 0 }}>
        {dept}
      </span>
      <div style={{ flex: 1, height: '20px', borderRadius: border.radius.sm, backgroundColor: color.surface.secondary, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${pct}%`, borderRadius: border.radius.sm, backgroundColor: deptColors.base, transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontFamily: font.family.label, fontSize: font.size.body.xs, fontWeight: 600, color: color.text.secondary, width: '48px', flexShrink: 0 }}>
        {completed}/{total}
      </span>
    </div>
  );
}

// ─── Progress bar (inline) ───────────────────────────────────────────────────

function MiniProgress({ pct }: { pct: number }) {
  return (
    <div style={{ width: '80px', height: '6px', borderRadius: border.radius.sm, backgroundColor: color.surface.secondary, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${pct}%`, borderRadius: border.radius.sm, backgroundColor: color.background.brandPrimary }} />
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
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
              <Icon icon={icon.priorityCritical} style={{ color: color.department.red.base, fontSize: font.size.body.md } as CSSProperties & Record<string, string>} />
              <h2 style={cardTitleStyle}>Overdue Tasks</h2>
              <span style={{ fontFamily: font.family.label, fontSize: font.size.body.xs, fontWeight: 600, color: color.text.muted, backgroundColor: color.surface.secondary, padding: `2px ${gap.md}`, borderRadius: border.radius.sm }}>
                {OVERDUE_TASKS.length}
              </span>
            </div>
            <Link href="/tasks" style={cardLinkStyle}>
              View All <Icon icon={icon.arrowRight} style={{ fontSize: font.size.body.xs }} />
            </Link>
          </div>
          <ul style={listStyle}>
            {OVERDUE_TASKS.map((task) => {
              const pri = PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.info;
              const deptColors = getDepartmentColors(task.dept);
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
                    <Badge status={pri.status} size="xs" variant="dark" icon={<Icon icon={pri.icon} />} title={pri.label} style={{ flexShrink: 0 }} />
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
              <Icon icon={icon.circleCheck} style={{ color: color.department.green.base, fontSize: font.size.body.md } as CSSProperties & Record<string, string>} />
              <h2 style={cardTitleStyle}>Today&apos;s Progress</h2>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: space.huge }}>
            <ProgressRing pct={TODAY_PCT} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm, flex: 1 }}>
              <div>
                <span style={{ fontFamily: font.family.heading, fontSize: font.size.heading.large, fontWeight: 700, color: color.text.primary }}>{TODAY_COMPLETED}</span>
                <span style={{ fontFamily: font.family.body, fontSize: font.size.body.md, color: color.text.muted }}> / {TODAY_TOTAL} tasks</span>
              </div>
              <div style={{ display: 'flex', gap: gap.lg }}>
                <div>
                  <div style={{ ...labelStyle.subtitle, color: color.text.muted }}>Completed</div>
                  <div style={{ fontFamily: font.family.heading, fontSize: font.size.heading.small, fontWeight: 700, color: color.department.green.base }}>{TODAY_COMPLETED}</div>
                </div>
                <div>
                  <div style={{ ...labelStyle.subtitle, color: color.text.muted }}>Remaining</div>
                  <div style={{ fontFamily: font.family.heading, fontSize: font.size.heading.small, fontWeight: 700, color: color.text.primary }}>{TODAY_TOTAL - TODAY_COMPLETED}</div>
                </div>
                <div>
                  <div style={{ ...labelStyle.subtitle, color: color.text.muted }}>Overdue</div>
                  <div style={{ fontFamily: font.family.heading, fontSize: font.size.heading.small, fontWeight: 700, color: color.department.red.base }}>{OVERDUE_TASKS.length}</div>
                </div>
              </div>
            </div>
          </div>
          {/* Department bar chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md, marginTop: gap.md }}>
            <span style={{ ...labelStyle.subtitle, color: color.text.muted }}>By Department</span>
            {DEPT_COMPLETION.map((d) => (
              <DeptBar key={d.dept} dept={d.dept} completed={d.completed} total={d.total} />
            ))}
          </div>
        </div>

        {/* ── Card 3: Onboarding Status ── */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h2 style={cardTitleStyle}>Onboarding Status</h2>
            <Link href="/training" style={cardLinkStyle}>
              View All <Icon icon={icon.arrowRight} style={{ fontSize: font.size.body.xs }} />
            </Link>
          </div>
          <ul style={listStyle}>
            {ONBOARDING_MEMBERS.map((m) => {
              const deptColors = getDepartmentColors(m.dept);
              const typeTag = TYPE_TAG[m.type];
              return (
                <li key={m.id} style={listItemStyle}>
                  <div style={listItemLeftStyle}>
                    <UserAvatar name={m.name} department={m.dept} size="sm" />
                    <div style={{ minWidth: 0 }}>
                      <div style={listItemTitleStyle}>{m.name}</div>
                      <div style={listItemSubStyle}>{m.role}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: gap.md, flexShrink: 0 }}>
                    <Tag size="sm" style={{ backgroundColor: typeTag.bg, color: typeTag.color }}>{typeTag.label}</Tag>
                    <span style={{ fontFamily: font.family.label, fontSize: font.size.body.xs, fontWeight: 600, color: color.text.secondary, whiteSpace: 'nowrap' }}>
                      {m.completed}/{m.total}
                    </span>
                    <MiniProgress pct={m.progress} />
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
                  <Badge status={badge.status} size="xs">{badge.label}</Badge>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
