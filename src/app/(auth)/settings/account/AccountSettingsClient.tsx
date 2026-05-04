'use client';

import { useState } from 'react';
import { EditProfileSheet, type ProfileFormData } from '@/components/EditProfileSheet';
import { DaysOfWeekPicker } from '@/components/DaysOfWeekPicker';
import { Button, DataSection, Field, FieldGrid, PageHeader } from '@brikdesigns/bds';
import { SHIFT_LABELS } from '@/lib/member-labels';
import { contentStyle } from '../_shared';

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

// Caps the read-mode column on wide viewports so 2-col fields remain
// scannable. Matches the cap used in the BDS Form/Read-Mode Page canonical
// pattern (Frame width sized for legibility, not viewport).
const readModeContentStyle = { ...contentStyle, maxWidth: '1100px' };

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
      <div style={readModeContentStyle}>
        <DataSection title="Contact Information">
          <FieldGrid columns={2}>
            <Field label="First Name" empty="—">{currentProfile.first_name || null}</Field>
            <Field label="Last Name" empty="—">{currentProfile.last_name || null}</Field>
            <Field label="Email" empty="—">{currentProfile.email || null}</Field>
          </FieldGrid>
        </DataSection>

        <DataSection title="User Information">
          <FieldGrid columns={2}>
            <Field label="Role" empty="—">{ROLE_LABELS[currentProfile.system_role] ?? currentProfile.system_role}</Field>
            <Field label="Practice Role" empty="—">{currentProfile.practice_role || null}</Field>
            <Field label="Department" empty="—">{currentProfile.department || null}</Field>
            <Field label="Team" empty="—">{currentProfile.team || null}</Field>
            <Field label="Organization" empty="—">{currentProfile.organization || null}</Field>
            <Field label="Start Date" empty="—">{currentProfile.start_date || null}</Field>
          </FieldGrid>
        </DataSection>

        <DataSection title="Status">
          <FieldGrid columns={2}>
            <Field label="Employee Type" empty="—">{(STATUS_LABELS[currentProfile.employee_type] ?? currentProfile.employee_type) || null}</Field>
            <Field label="Shift" empty="—">{(SHIFT_LABELS[currentProfile.shift] ?? currentProfile.shift) || null}</Field>
          </FieldGrid>
          <Field label="Days in Office" empty="—">
            {currentProfile.office_days.length > 0 ? (
              <DaysOfWeekPicker value={currentProfile.office_days} readOnly />
            ) : null}
          </Field>
        </DataSection>

        <DataSection title="Password">
          <FieldGrid columns={2}>
            <Field label="Password" empty="—">••••••••</Field>
            <Field label="Last Changed" empty="—">{null}</Field>
          </FieldGrid>
        </DataSection>
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
