'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { ReadOnlyField, EmptyField } from '@/components/ReadOnlyField';
import { UserAvatar } from '@/components/UserAvatar';
import { Tag } from '@bds/components';
import { getDepartmentColors } from '@/lib/department-colors';
import { color, font, gap } from '@/lib/tokens';
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
  opening: 'Opening',
  closing: 'Closing',
  evening: 'Evening',
  full_day: 'Full Day',
};

// ─── Mock member lookup (matches training page + users table seed data) ──────

interface MemberDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  employeeType: 'new' | 'maturing' | 'active';
  shift: string;
  startDate: string;
  organization: string;
  totalModules: number;
  completedModules: number;
  progress: number;
}

const MOCK_MEMBERS: Record<string, MemberDetail> = {
  'pm-jordan': {
    id: 'pm-jordan', firstName: 'Jordan', lastName: 'Hayes',
    email: 'jordan@renewdental.com', phone: '(555) 100-0010',
    role: 'Inventory Manager', department: 'Engineering',
    employeeType: 'new', shift: '', startDate: '2026-02-01',
    organization: 'Renew Dental', totalModules: 6, completedModules: 1, progress: 12,
  },
  'pm-tyler': {
    id: 'pm-tyler', firstName: 'Tyler', lastName: 'Nguyen',
    email: 'tyler@renewdental.com', phone: '(555) 100-0006',
    role: 'Dental Assistant', department: 'Sterilization',
    employeeType: 'new', shift: 'closing', startDate: '2026-01-15',
    organization: 'Renew Dental', totalModules: 8, completedModules: 2, progress: 25,
  },
  'pm-rachel': {
    id: 'pm-rachel', firstName: 'Rachel', lastName: 'Foster',
    email: 'rachel@renewdental.com', phone: '(555) 100-0007',
    role: 'Receptionist', department: 'Front Desk',
    employeeType: 'maturing', shift: 'full_day', startDate: '2025-07-15',
    organization: 'Renew Dental', totalModules: 5, completedModules: 3, progress: 60,
  },
  'pm-emily': {
    id: 'pm-emily', firstName: 'Emily', lastName: 'Rivera',
    email: 'emily@renewdental.com', phone: '(555) 100-0005',
    role: 'Dental Assistant', department: 'Clinical',
    employeeType: 'maturing', shift: 'opening', startDate: '2025-09-15',
    organization: 'Renew Dental', totalModules: 8, completedModules: 6, progress: 75,
  },
  'pm-jessica': {
    id: 'pm-jessica', firstName: 'Jessica', lastName: 'Torres',
    email: 'jessica@renewdental.com', phone: '(555) 100-0002',
    role: 'Office Manager', department: 'Administration',
    employeeType: 'active', shift: 'full_day', startDate: '2024-02-01',
    organization: 'Renew Dental', totalModules: 2, completedModules: 0, progress: 0,
  },
  'pm-sarah': {
    id: 'pm-sarah', firstName: 'Sarah', lastName: 'Mitchell',
    email: 'sarah@renewdental.com', phone: '(555) 100-0001',
    role: 'Owner', department: 'Clinical',
    employeeType: 'active', shift: 'full_day', startDate: '2024-01-15',
    organization: 'Renew Dental', totalModules: 3, completedModules: 1, progress: 33,
  },
  'pm-amanda': {
    id: 'pm-amanda', firstName: 'Amanda', lastName: 'Chen',
    email: 'amanda@renewdental.com', phone: '(555) 100-0003',
    role: 'Dental Hygienist', department: 'Clinical',
    employeeType: 'active', shift: 'opening', startDate: '2024-03-10',
    organization: 'Renew Dental', totalModules: 2, completedModules: 1, progress: 50,
  },
};

// ─── Tabs ────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'details', label: 'Details' },
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
  fontWeight: 400,
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
  borderRadius: '4px',
  backgroundColor: color.background.muted,
  overflow: 'hidden',
  position: 'relative',
};

const progressLabelStyle: React.CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.body.sm,
  fontWeight: 600,
  color: color.text.secondary,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function TrainingDetailPage() {
  const params = useParams();
  const memberId = params.memberId as string;
  const [activeTab, setActiveTab] = useState('details');

  const member = MOCK_MEMBERS[memberId];

  if (!member) {
    return (
      <div style={{ padding: '64px', textAlign: 'center', color: color.text.muted, fontFamily: font.family.body }}>
        Member not found.
      </div>
    );
  }

  const fullName = `${member.firstName} ${member.lastName}`;
  const deptColors = getDepartmentColors(member.department);
  const typeTag = EMPLOYEE_TYPE_TAG[member.employeeType] ?? EMPLOYEE_TYPE_TAG.active;

  const headerTitle = (
    <div style={titleRowStyle}>
      <UserAvatar name={fullName} department={member.department} size="lg" />
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
            <ReadOnlyField label="First Name" value={member.firstName} />
            <ReadOnlyField label="Last Name" value={member.lastName} />
            <ReadOnlyField label="Email" value={member.email} />
          </div>
          <div style={rowStyle}>
            <ReadOnlyField label="Phone" value={member.phone} />
            <EmptyField />
            <EmptyField />
          </div>

          {/* User Information */}
          <h2 style={sectionTitleStyle}>User Information</h2>
          <div style={rowStyle}>
            <ReadOnlyField label="Practice Role" value={member.role} />
            <ReadOnlyField label="Department" value={member.department} />
            <ReadOnlyField label="Organization" value={member.organization} />
          </div>
          <div style={rowStyle}>
            <ReadOnlyField label="Shift" value={member.shift ? (SHIFT_LABELS[member.shift] ?? member.shift) : null} />
            <ReadOnlyField label="Start Date" value={member.startDate} />
            <EmptyField />
          </div>

          {/* Status */}
          <h2 style={sectionTitleStyle}>Status</h2>
          <div style={rowStyle}>
            <ReadOnlyField label="Employee Type" value={typeTag.label} />
            <ReadOnlyField label="Training Progress" value={`${member.completedModules} of ${member.totalModules} modules`} />
            <EmptyField />
          </div>
        </div>
      )}

      {activeTab === 'training' && (
        <div style={contentStyle}>
          <h2 style={sectionTitleStyle}>Training Progress</h2>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={progressLabelStyle}>
                {member.completedModules} of {member.totalModules} modules completed
              </span>
              <span style={progressLabelStyle}>{member.progress}%</span>
            </div>
            <div style={progressTrackStyle}>
              <div
                className="progress-fill"
                style={{
                  position: 'absolute', top: 0, left: 0, height: '100%',
                  width: `${member.progress}%`, borderRadius: '4px',
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
