'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { ReadOnlyField, EmptyField } from '@/components/ReadOnlyField';
import { EditProfileSheet, type ProfileFormData } from '@/components/EditProfileSheet';
import { Button } from '@bds/components';
import {
  contentStyle,
  sectionTitleStyle,
  rowStyle,
} from '../_shared';

interface AccountSettingsClientProps {
  profile: ProfileFormData;
  isAdmin: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  platform_admin: 'Platform Admin',
  practice_admin: 'Practice Admin',
  staff: 'Staff',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  maturing: 'Maturing',
  active: 'Active',
};

const SHIFT_LABELS: Record<string, string> = {
  opening: 'Opening',
  closing: 'Closing',
  evening: 'Evening',
  full_day: 'Full Day',
};

export function AccountSettingsClient({ profile, isAdmin }: AccountSettingsClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

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
          <ReadOnlyField label="First Name" value={profile.first_name || null} />
          <ReadOnlyField label="Last Name" value={profile.last_name || null} />
          <ReadOnlyField label="Email" value={profile.email || null} />
        </div>

        {/* User Information */}
        <h2 style={sectionTitleStyle}>User Information</h2>
        <div style={rowStyle}>
          <ReadOnlyField label="Role" value={ROLE_LABELS[profile.system_role] ?? profile.system_role} />
          <ReadOnlyField label="Practice Role" value={profile.practice_role || null} />
          <ReadOnlyField label="Department" value={profile.department || null} />
        </div>
        <div style={rowStyle}>
          <ReadOnlyField label="Team" value={profile.team || null} />
          <ReadOnlyField label="Organization" value={profile.organization || null} />
          <ReadOnlyField label="Start Date" value={profile.start_date || null} />
        </div>

        {/* Status */}
        <h2 style={sectionTitleStyle}>Status</h2>
        <div style={rowStyle}>
          <ReadOnlyField label="Employee Type" value={(STATUS_LABELS[profile.employee_type] ?? profile.employee_type) || null} />
          <ReadOnlyField label="Shift" value={(SHIFT_LABELS[profile.shift] ?? profile.shift) || null} />
          <EmptyField />
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
        initialData={profile}
        isAdmin={isAdmin}
      />
    </>
  );
}
