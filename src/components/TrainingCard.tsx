'use client';

import type { CSSProperties } from 'react';
import { Button, Tag, Dot } from '@bds/components';
import { UserAvatar } from '@/components/UserAvatar';
import { color, font, space, border, shadow, gap, departmentColor } from '@/lib/tokens';
import { EMPLOYEE_TYPE_TAG } from '@/lib/member-labels';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TrainingMember {
  id: string;
  name: string;
  role: string;
  department: string;
  employeeType: 'new' | 'maturing' | 'proficient';
  /** DB-stored color key from departments.color (e.g. 'blue', 'green') */
  departmentColor: string;
  /** 0–100 training completion percentage */
  progress: number;
  /** Total assigned training modules */
  totalModules: number;
  /** Completed training modules */
  completedModules: number;
  /** Whether this person has any training currently due */
  hasTrainingDue: boolean;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function cardStyle(borderColor: string): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: gap.lg,
    paddingBlock: space.md,
    paddingInline: space.lg,
    backgroundColor: color.surface.primary,
    borderLeft: `8px solid ${borderColor}`,
    borderRadius: border.radius.md,
    boxShadow: shadow.sm,
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
  gap: gap.md,
};

const nameStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.md,
  fontWeight: font.weight.bold,
  lineHeight: 'normal',
  color: color.text.primary,
};

const roleStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: font.weight.regular,
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
  gap: gap.md,
};

const progressWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
};

const progressTrackStyle: CSSProperties = {
  width: '166px',
  height: '6px',
  borderRadius: border.radius.xs,
  backgroundColor: color.background.muted,
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
    borderRadius: border.radius.xs,
    backgroundColor: color.background.brandPrimary,
  };
}

const progressLabelStyle: CSSProperties = {
  fontFamily: font.family.subtitle,
  fontSize: font.size.subtitle.md,
  fontWeight: font.weight.semibold,
  color: color.text.secondary,
  whiteSpace: 'nowrap',
};

// ─── Component ───────────────────────────────────────────────────────────────

interface TrainingCardProps {
  member: TrainingMember;
  onViewDetails: (memberId: string) => void;
}

export function TrainingCard({ member, onViewDetails }: TrainingCardProps) {
  const deptColors = departmentColor(member.departmentColor);
  const typeTag = EMPLOYEE_TYPE_TAG[member.employeeType] ?? EMPLOYEE_TYPE_TAG.proficient;

  return (
    <div style={cardStyle(deptColors.light)}>
      {/* Top row: avatar + name | View Details button */}
      <div style={topRowStyle}>
        <div style={personStyle}>
          <UserAvatar name={member.name} departmentColorKey={member.departmentColor} size="lg" />
          <div>
            <div style={nameStyle}>{member.name}</div>
            <div style={roleStyle}>{member.role}</div>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={() => onViewDetails(member.id)}>
          View Details
        </Button>
      </div>

      {/* Bottom row: type + dept tags | progress bar */}
      <div style={bottomRowStyle}>
        <div style={tagGroupStyle}>
          {member.department && (
            <Tag size="sm" style={{ backgroundColor: deptColors.light, color: deptColors.text }}>
              {member.department}
            </Tag>
          )}
          <Tag size="sm" style={{ backgroundColor: typeTag.bg, color: typeTag.color }}>
            {typeTag.label}
          </Tag>
        </div>
        {member.hasTrainingDue ? (
          <div style={progressWrapStyle}>
            <Dot status="warning" size="sm" pulse />
            <span style={progressLabelStyle}>
              {member.completedModules}/{member.totalModules}
            </span>
            <div style={progressTrackStyle}>
              <div className="progress-fill" style={progressBarStyle(member.progress)} />
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
