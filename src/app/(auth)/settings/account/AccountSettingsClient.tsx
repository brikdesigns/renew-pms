'use client';

import { useState } from 'react';
import { EditProfileSheet, type ProfileFormData } from '@/components/EditProfileSheet';
import { ChangePasswordSheet } from '@/components/ChangePasswordSheet';
import { DaysOfWeekPicker } from '@/components/DaysOfWeekPicker';
import { SignInMethodsSection, type LinkedIdentity } from '@/components/SignInMethodsSection';
import { Button, DataSection, Field, FieldGrid, PageHeader } from '@brikdesigns/bds';
import { SHIFT_LABELS } from '@/lib/member-labels';
import { contentStyle } from '../_shared';

interface AccountSettingsClientProps {
  profile: ProfileFormData;
  memberId: string | null;
  isAdmin: boolean;
  /** True when the user has an email/password identity (i.e. can change their password here). */
  hasEmailIdentity: boolean;
  /** Full identity list — drives the per-provider Sign-in methods section (#226). */
  linkedIdentities: LinkedIdentity[];
  /** Subset of linkedIdentities whose email differs from the user's primary email — silent-fork warning surface. */
  mismatchedIdentities: LinkedIdentity[];
  /** User's primary email (from profiles, fallback to auth.users.email). */
  primaryEmail: string;
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

export function AccountSettingsClient({
  profile,
  memberId,
  isAdmin,
  hasEmailIdentity,
  linkedIdentities,
  mismatchedIdentities,
  primaryEmail,
}: AccountSettingsClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [passwordSheetOpen, setPasswordSheetOpen] = useState(false);
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

        <SignInMethodsSection
          identities={linkedIdentities}
          mismatchedIdentities={mismatchedIdentities}
          primaryEmail={primaryEmail}
          hasEmailIdentity={hasEmailIdentity}
          onChangePassword={() => setPasswordSheetOpen(true)}
        />
      </div>

      <EditProfileSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        initialData={currentProfile}
        memberId={memberId}
        isAdmin={isAdmin}
        onSaved={(updated) => setCurrentProfile(updated)}
      />
      <ChangePasswordSheet
        isOpen={passwordSheetOpen}
        onClose={() => setPasswordSheetOpen(false)}
      />
    </>
  );
}
