'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { ReadOnlyField, EmptyField } from '@/components/ReadOnlyField';
import { UserAvatar } from '@/components/UserAvatar';
import { Tag } from '@bds/components';
import { color, font, space, gap, border, departmentColor } from '@/lib/tokens';
import { useMembers } from '@/hooks/useMembers';
import {
  contentStyle,
  sectionTitleStyle,
  rowStyle,
} from '../../settings/_shared';

// ─── Employee type tag colors (shared pattern) ──────────────────────────────

const EMPLOYEE_TYPE_TAG: Record<string, { bg: string; color: string; label: string }> = {
  new:      { bg: color.department.blue.base,  color: color.text.onColorDark, label: 'New Hire' },
  maturing: { bg: color.department.gold.base,  color: color.text.onColorDark, label: 'Maturing' },
  active:   { bg: color.department.green.base, color: color.text.onColorDark, label: 'Active' },
};

const SHIFT_LABELS: Record<string, string> = {
  opening:  'Opening',
  closing:  'Closing',
  evening:  'Evening',
  full_day: 'Full Day',
};

// ─── Tabs ────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'details',  label: 'Details' },
  { key: 'training', label: 'Training' },
];

// ─── Styles ──────────────────────────────────────────────────────────────────

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.lg,
};

const titleNameStyle: React.CSSProperties = {
  fontFamily: font.family.heading,
  fontSize: font.size.heading.large,
  fontWeight: font.weight.regular,
  lineHeight: 1,
  color: color.text.primary,
  margin: 0,
};

const titleTagsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
};

const progressTrackStyle: React.CSSProperties = {
  width: '100%',
  height: '8px',
  borderRadius: border.radius.xs,
  backgroundColor: color.background.muted,
  overflow: 'hidden',
  position: 'relative',
};

const progressLabelStyle: React.CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: font.weight.semibold,
  color: color.text.secondary,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function TrainingDetailPage() {
  const params = useParams();
  const memberId = params.memberId as string;
  const [activeTab, setActiveTab] = useState('details');

  const { members, loading } = useMembers();

  const member = useMemo(
    () => members.find((m) => m.id === memberId) ?? null,
    [members, memberId],
  );

  if (loading) {
    return (
      <div style={{ padding: space['3xl'], textAlign: 'center', color: color.text.muted, fontFamily: font.family.body }}>
        Loading…
      </div>
    );
  }

  if (!member) {
    return (
      <div style={{ padding: space['3xl'], textAlign: 'center', color: color.text.muted, fontFamily: font.family.body }}>
        Member not found.
      </div>
    );
  }

  const fullName    = `${member.first_name} ${member.last_name}`.trim();
  const deptColors  = departmentColor(member.department_color);
  const typeTag     = EMPLOYEE_TYPE_TAG[member.employee_type] ?? EMPLOYEE_TYPE_TAG.active;
  const startDate   = member.joined_at ? new Date(member.joined_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

  // Training progress — placeholder until Trainual integration is connected.
  const totalModules     = 0;
  const completedModules = 0;
  const progress         = 0;

  const headerTitle = (
    <div style={titleRowStyle}>
      <UserAvatar name={fullName} departmentColorKey={member.department_color} size="lg" />
      <span style={titleNameStyle}>{fullName}</span>
      <div style={titleTagsStyle}>
        <Tag size="sm" style={{ backgroundColor: typeTag.bg, color: typeTag.color }}>
          {typeTag.label}
        </Tag>
        <Tag size="sm" style={{ backgroundColor: deptColors.light, color: deptColors.text }}>
          {member.department}
        </Tag>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title={headerTitle}
        breadcrumbs={[
          { label: 'Training', href: '/training' },
          { label: fullName },
        ]}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'details' && (
        <div style={contentStyle}>
          {/* Contact Information */}
          <h2 style={sectionTitleStyle}>Contact Information</h2>
          <div style={rowStyle}>
            <ReadOnlyField label="First Name" value={member.first_name} />
            <ReadOnlyField label="Last Name"  value={member.last_name} />
            <ReadOnlyField label="Email"      value={member.email} />
          </div>
          <div style={rowStyle}>
            <ReadOnlyField label="Phone" value={member.phone || null} />
            <EmptyField />
            <EmptyField />
          </div>

          {/* User Information */}
          <h2 style={sectionTitleStyle}>User Information</h2>
          <div style={rowStyle}>
            <ReadOnlyField label="Practice Role" value={member.practice_role} />
            <ReadOnlyField label="Department"    value={member.department} />
            <EmptyField />
          </div>
          <div style={rowStyle}>
            <ReadOnlyField label="Shift"      value={member.shift ? (SHIFT_LABELS[member.shift] ?? member.shift) : null} />
            <ReadOnlyField label="Start Date" value={startDate} />
            <EmptyField />
          </div>

          {/* Status */}
          <h2 style={sectionTitleStyle}>Status</h2>
          <div style={rowStyle}>
            <ReadOnlyField label="Employee Type"      value={typeTag.label} />
            <ReadOnlyField label="Training Progress"  value={`${completedModules} of ${totalModules} modules`} />
            <EmptyField />
          </div>
        </div>
      )}

      {activeTab === 'training' && (
        <div style={contentStyle}>
          <h2 style={sectionTitleStyle}>Training Progress</h2>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: gap.md }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={progressLabelStyle}>
                {completedModules} of {totalModules} modules completed
              </span>
              <span style={progressLabelStyle}>{progress}%</span>
            </div>
            <div style={progressTrackStyle}>
              <div
                className="progress-fill"
                style={{
                  position: 'absolute', top: 0, left: 0, height: '100%',
                  width: `${progress}%`, borderRadius: border.radius.xs,
                  backgroundColor: color.background.brandPrimary,
                }}
              />
            </div>
          </div>

          <h2 style={sectionTitleStyle}>Assigned Modules</h2>
          <p style={{
            fontFamily: font.family.body,
            fontSize: font.size.body.md,
            color: color.text.muted,
            margin: 0,
          }}>
            Training module cards will appear here once training templates are assigned to this team member.
          </p>
        </div>
      )}
    </>
  );
}
