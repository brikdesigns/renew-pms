'use client';

import { type CSSProperties } from 'react';
import { Tag, Dot, InteractiveListItem } from '@brikdesigns/bds';
import { UserAvatar } from '@/components/UserAvatar';
import { color, font, border, gap } from '@/lib/tokens';
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

const trailingWrap: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
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
  const typeTag = EMPLOYEE_TYPE_TAG[member.employeeType] ?? EMPLOYEE_TYPE_TAG.proficient;

  // Build subtitle: role • department
  const subtitleParts: string[] = [];
  if (member.role) subtitleParts.push(member.role);
  if (member.department) subtitleParts.push(member.department);
  const subtitle = subtitleParts.join(' \u2022 ');

  return (
    <InteractiveListItem
      className="renew-list-item-primary"
      style={{ backgroundColor: color.surface.primary }}
      leading={
        <UserAvatar
          name={member.name}
          departmentColorKey={member.departmentColor}
          size="md"
        />
      }
      title={member.name}
      subtitle={subtitle || undefined}
      trailing={
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
      }
      onClick={() => onViewDetails(member.id)}
    />
  );
}
