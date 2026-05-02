import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { AppSidebar } from '@/components/AppSidebar';
import { AuthLayoutInner } from '@/components/AuthLayoutInner';
import { ToastProvider } from '@/components/ToastProvider';
import { DevTools } from '@/components/dev-tools';
import { AppSheetProvider } from '@/components/AppSheetProvider';
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

  const { first_name, full_name } = authUser.profile;
  const displayName = first_name ?? authUser.profile.email?.split('@')[0] ?? 'there';
  const userDepartment = authUser.membership?.department ?? null;
  const practiceName = authUser.membership?.organization ?? undefined;
  const role = authUser.profile.system_role;
  const isAdmin = role === 'brik_admin' || role === 'admin' || role === 'manager';

  return (
    <ToastProvider>
      <AppSheetProvider isAdmin={isAdmin} currentMemberId={authUser.membership?.memberId}>
        <div style={shellStyle}>
          <AppSidebar
            userRole={authUser.profile.system_role}
            userName={displayName}
            userFullName={full_name ?? displayName}
            userDepartment={userDepartment}
            practiceName={practiceName}
          />
          <div style={mainStyle}>
            <AuthLayoutInner>{children}</AuthLayoutInner>
          </div>
        </div>
        <DevTools />
      </AppSheetProvider>
    </ToastProvider>
  );
}
