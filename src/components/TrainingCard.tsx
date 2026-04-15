'use client';

import { useState, type CSSProperties } from 'react';
import { Tag, Dot } from '@brikdesigns/bds';
import { UserAvatar } from '@/components/UserAvatar';
import { color, font, space, border, gap, state, motion } from '@/lib/tokens';
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

function cardStyle(hovered: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: gap.md,
    padding: space.md,
    borderRadius: border.radius.md,
    backgroundColor: hovered ? state.hover.secondary : color.surface.secondary,
    cursor: 'pointer',
    transition: `background-color ${motion.duration.fast} ${motion.ease.out}`,
    border: 'none',
    textAlign: 'left',
    width: '100%',
  };
}

const textWrap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.tiny,
  minWidth: 0,
  flex: 1,
};

const nameStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.md,
  fontWeight: font.weight.bold,
  color: color.text.primary,
  lineHeight: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const subtitleStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: font.weight.regular,
  color: color.text.secondary,
  lineHeight: 1.3,
};

const trailingWrap: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
  flexShrink: 0,
};

const progressWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.sm,
};

const progressTrackStyle: CSSProperties = {
  width: '80px',
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
  const [hovered, setHovered] = useState(false);
  const typeTag = EMPLOYEE_TYPE_TAG[member.employeeType] ?? EMPLOYEE_TYPE_TAG.proficient;

  // Build subtitle: role • department
  const subtitleParts: string[] = [];
  if (member.role) subtitleParts.push(member.role);
  if (member.department) subtitleParts.push(member.department);
  const subtitle = subtitleParts.join(' \u2022 ');

  return (
    <button
      type="button"
      style={cardStyle(hovered)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onViewDetails(member.id)}
    >
      <UserAvatar
        name={member.name}
        departmentColorKey={member.departmentColor}
        size="md"
      />
      <div style={textWrap}>
        <span style={nameStyle}>{member.name}</span>
        {subtitle && <span style={subtitleStyle}>{subtitle}</span>}
      </div>
      <div style={trailingWrap}>
        <Tag size="sm" style={{ backgroundColor: typeTag.bg, color: typeTag.color }}>
          {typeTag.label}
        </Tag>
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
    </button>
  );
}
