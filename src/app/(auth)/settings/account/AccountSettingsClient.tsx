'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { EditProfileSheet, type ProfileFormData } from '@/components/EditProfileSheet';
import { DaysOfWeekPicker } from '@/components/DaysOfWeekPicker';
import { Button, Field, FieldGrid } from '@brikdesigns/bds';
import {
  contentStyle,
  sectionTitleStyle,
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
        <FieldGrid columns={3} gap="lg">
          <Field label="First Name" empty="—">{currentProfile.first_name || null}</Field>
          <Field label="Last Name" empty="—">{currentProfile.last_name || null}</Field>
          <Field label="Email" empty="—">{currentProfile.email || null}</Field>
        </FieldGrid>

        {/* User Information */}
        <h2 style={sectionTitleStyle}>User Information</h2>
        <FieldGrid columns={3} gap="lg">
          <Field label="Role" empty="—">{ROLE_LABELS[currentProfile.system_role] ?? currentProfile.system_role}</Field>
          <Field label="Practice Role" empty="—">{currentProfile.practice_role || null}</Field>
          <Field label="Department" empty="—">{currentProfile.department || null}</Field>
        </FieldGrid>
        <FieldGrid columns={3} gap="lg">
          <Field label="Team" empty="—">{currentProfile.team || null}</Field>
          <Field label="Organization" empty="—">{currentProfile.organization || null}</Field>
          <Field label="Start Date" empty="—">{currentProfile.start_date || null}</Field>
        </FieldGrid>

        {/* Status */}
        <h2 style={sectionTitleStyle}>Status</h2>
        <FieldGrid columns={3} gap="lg">
          <Field label="Employee Type" empty="—">{(STATUS_LABELS[currentProfile.employee_type] ?? currentProfile.employee_type) || null}</Field>
          <Field label="Shift" empty="—">{(SHIFT_LABELS[currentProfile.shift] ?? currentProfile.shift) || null}</Field>
          <div />
        </FieldGrid>
        <Field label="Days in Office" empty="—">
          {currentProfile.office_days.length > 0 ? (
            <DaysOfWeekPicker value={currentProfile.office_days} readOnly />
          ) : null}
        </Field>

        {/* Password */}
        <h2 style={sectionTitleStyle}>Password</h2>
        <FieldGrid columns={3} gap="lg">
          <Field label="Password" empty="—">••••••••</Field>
          <Field label="Last Changed" empty="—">{null}</Field>
          <div />
        </FieldGrid>
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
