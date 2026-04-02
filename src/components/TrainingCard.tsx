'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Tag } from '@bds/components';
import { UserAvatar } from '@/components/UserAvatar';
import { getDepartmentColors } from '@/lib/department-colors';
import { color, font, border } from '@/lib/tokens';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TrainingMember {
  id: string;
  name: string;
  role: string;
  department: string;
  employeeType: 'new' | 'maturing' | 'active';
  /** 0–100 training completion percentage */
  progress: number;
  /** Total assigned training modules */
  totalModules: number;
  /** Completed training modules */
  completedModules: number;
  /** Whether this person has any training currently due */
  hasTrainingDue: boolean;
}

// ─── Employee type tag colors ────────────────────────────────────────────────

const TYPE_TAG: Record<string, { bg: string; color: string; label: string }> = {
  new:      { bg: color.department.blue.base,  color: color.text.onColorDark, label: 'New Hire' },
  maturing: { bg: color.department.gold.base,  color: color.text.onColorDark, label: 'Maturing' },
  active:   { bg: color.department.green.base, color: color.text.onColorDark, label: 'Active' },
};

// ─── Styles ──────────────────────────────────────────────────────────────────

function cardStyle(borderColor: string): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '18px 24px',
    backgroundColor: color.surface.primary,
    borderLeft: `8px solid ${borderColor}`,
    borderRadius: border.radius.md,
    overflow: 'hidden',
    width: '100%',
    boxSizing: 'border-box',
  };
}

const topRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
};

const personStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const nameStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.label.md,
  fontWeight: 800,
  lineHeight: 'normal',
  color: color.text.primary,
};

const roleStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  fontWeight: 400,
  lineHeight: 'normal',
  color: color.text.primary,
};

const bottomRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
};

const tagGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const progressWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const progressTrackStyle: CSSProperties = {
  width: '166px',
  height: '6px',
  borderRadius: '3px',
  backgroundColor: 'var(--background-muted)', // not in typed tokens yet
  overflow: 'hidden',
  position: 'relative',
};

function progressBarStyle(pct: number): CSSProperties {
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: `${pct}%`,
    borderRadius: '3px',
    backgroundColor: color.background.brandPrimary,
  };
}

const progressLabelStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.body.xs,
  fontWeight: 600,
  color: color.text.secondary,
  whiteSpace: 'nowrap',
};

const viewBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '32px',
  paddingInline: '16px',
  borderRadius: border.radius.sm,
  backgroundColor: color.background.brandPrimary,
  color: color.text.onColorDark,
  fontFamily: font.family.label,
  fontSize: font.size.body.sm,
  fontWeight: 800,
  border: 'none',
  cursor: 'pointer',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function TrainingCard({ member }: { member: TrainingMember }) {
  const deptColors = getDepartmentColors(member.department);
  const typeTag = TYPE_TAG[member.employeeType] ?? TYPE_TAG.active;

  return (
    <div style={cardStyle(deptColors.light)}>
      {/* Top row: avatar + name | View Details button */}
      <div style={topRowStyle}>
        <div style={personStyle}>
          <UserAvatar name={member.name} department={member.department} size="lg" />
          <div>
            <div style={nameStyle}>{member.name}</div>
            <div style={roleStyle}>{member.role}</div>
          </div>
        </div>
        <Link href={`/training/${member.id}`} style={viewBtnStyle}>
          View Details
        </Link>
      </div>

      {/* Bottom row: type + dept tags | progress bar */}
      <div style={bottomRowStyle}>
        <div style={tagGroupStyle}>
          <Tag size="sm" style={{ backgroundColor: typeTag.bg, color: typeTag.color }}>
            {typeTag.label}
          </Tag>
          <Tag size="sm" style={{ backgroundColor: deptColors.light, color: deptColors.text }}>
            {member.department}
          </Tag>
        </div>
        {member.hasTrainingDue ? (
          <div style={progressWrapStyle}>
            <span style={progressLabelStyle}>
              {member.completedModules}/{member.totalModules}
            </span>
            <div style={progressTrackStyle}>
              <div style={progressBarStyle(member.progress)} />
            </div>
          </div>
        ) : (
          <span style={{ ...progressLabelStyle, color: color.text.muted }}>
            No training due
          </span>
        )}
      </div>
    </div>
  );
}
