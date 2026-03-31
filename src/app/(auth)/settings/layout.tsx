import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { SettingsSubNav } from '@/components/SettingsSubNav';
import type { CSSProperties } from 'react';

// ─── Styles ──────────────────────────────────────────────────────────────────

const settingsShellStyle: CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
  width: '100%',
};

const bodyStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
};

// ─── Layout ──────────────────────────────────────────────────────────────────

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect('/login');
  }

  return (
    <div style={settingsShellStyle}>
      <SettingsSubNav userRole={authUser.profile.system_role} />
      <div style={bodyStyle}>{children}</div>
    </div>
  );
}
