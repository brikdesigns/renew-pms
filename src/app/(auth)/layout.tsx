import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { AppSidebar } from '@/components/AppSidebar';
import { TopUtilityBar } from '@/components/TopUtilityBar';
import { AuthLayoutInner } from '@/components/AuthLayoutInner';
import { ToastProvider } from '@/components/ToastProvider';
import { DevPersonaSwitcher } from '@/components/DevPersonaSwitcher';
import type { CSSProperties } from 'react';
import { color, font } from '@/lib/tokens';

// ─── Layout styles matching Paper "App Shell" artboard ───────────────────────

const shellStyle: CSSProperties = {
  display: 'flex',
  height: '100dvh',
  overflow: 'hidden',
  backgroundColor: color.page.secondary,
  fontFamily: font.family.body,
};

const mainStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

// ─── Layout ──────────────────────────────────────────────────────────────────

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect('/login');
  }

  const { first_name, email, full_name } = authUser.profile;
  const displayName = first_name ?? email?.split('@')[0] ?? 'there';
  const userDepartment = authUser.membership?.department ?? null;
  const practiceName = authUser.membership?.organization ?? undefined;

  return (
    <ToastProvider>
      <div style={shellStyle}>
        <AppSidebar userRole={authUser.profile.system_role} />
        <div style={mainStyle}>
          <AuthLayoutInner
            topBar={<TopUtilityBar userName={displayName} userFullName={full_name ?? displayName} userDepartment={userDepartment} userEmail={email ?? undefined} practiceName={practiceName} />}
          >
            {children}
          </AuthLayoutInner>
        </div>
      </div>
      <DevPersonaSwitcher />
    </ToastProvider>
  );
}
