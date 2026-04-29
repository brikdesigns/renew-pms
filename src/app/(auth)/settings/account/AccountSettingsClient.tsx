'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { ReadOnlyField, EmptyField } from '@/components/ReadOnlyField';
import { EditProfileSheet, type ProfileFormData } from '@/components/EditProfileSheet';
import { DaysOfWeekPicker } from '@/components/DaysOfWeekPicker';
import { Button } from '@brikdesigns/bds';
import { font, color, gap } from '@/lib/tokens';
import {
  contentStyle,
  sectionTitleStyle,
  rowStyle,
} from '../_shared';

interface AccountSettingsClientProps {
  profile: ProfileFormData;
  memberId: string | null;
  isAdmin: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  brik_admin: 'Platform Admin',
  admin: 'Practice Admin',
  staff: 'Staff',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  maturing: 'Maturing',
  active: 'Active',
};

import { SHIFT_LABELS } from '@/lib/member-labels';

export function AccountSettingsClient({ profile, memberId, isAdmin }: AccountSettingsClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(profile);

  return (
    <>
      <PageHeader
        title="Profile"
        actions={
          <Button variant="primary" size="sm" onClick={() => setSheetOpen(true)}>Edit Profile</Button>
        }
      />
      <div style={contentStyle}>
        {/* Contact Information */}
        <h2 style={sectionTitleStyle}>Contact Information</h2>
        <div style={rowStyle}>
          <ReadOnlyField label="First Name" value={currentProfile.first_name || null} />
          <ReadOnlyField label="Last Name" value={currentProfile.last_name || null} />
          <ReadOnlyField label="Email" value={currentProfile.email || null} />
        </div>

        {/* User Information */}
        <h2 style={sectionTitleStyle}>User Information</h2>
        <div style={rowStyle}>
          <ReadOnlyField label="Role" value={ROLE_LABELS[currentProfile.system_role] ?? currentProfile.system_role} />
          <ReadOnlyField label="Practice Role" value={currentProfile.practice_role || null} />
          <ReadOnlyField label="Department" value={currentProfile.department || null} />
        </div>
        <div style={rowStyle}>
          <ReadOnlyField label="Team" value={currentProfile.team || null} />
          <ReadOnlyField label="Organization" value={currentProfile.organization || null} />
          <ReadOnlyField label="Start Date" value={currentProfile.start_date || null} />
        </div>

        {/* Status */}
        <h2 style={sectionTitleStyle}>Status</h2>
        <div style={rowStyle}>
          <ReadOnlyField label="Employee Type" value={(STATUS_LABELS[currentProfile.employee_type] ?? currentProfile.employee_type) || null} />
          <ReadOnlyField label="Shift" value={(SHIFT_LABELS[currentProfile.shift] ?? currentProfile.shift) || null} />
          <EmptyField />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
          <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: color.text.primary }}>
            Days in Office
          </span>
          {currentProfile.office_days.length > 0 ? (
            <DaysOfWeekPicker value={currentProfile.office_days} readOnly />
          ) : (
            <span style={{ fontFamily: font.family.body, fontSize: font.size.body.sm, color: color.text.secondary }}>—</span>
          )}
        </div>

        {/* Password */}
        <h2 style={sectionTitleStyle}>Password</h2>
        <div style={rowStyle}>
          <ReadOnlyField label="Password" value="••••••••" />
          <ReadOnlyField label="Last Changed" value={null} />
          <EmptyField />
        </div>
      </div>

      <EditProfileSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        initialData={currentProfile}
        memberId={memberId}
        isAdmin={isAdmin}
        onSaved={(updated) => setCurrentProfile(updated)}
      />
    </>
  );
}
