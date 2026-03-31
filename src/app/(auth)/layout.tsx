import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { AppSidebar } from '@/components/AppSidebar';
import { TopUtilityBar } from '@/components/TopUtilityBar';
import { AuthLayoutInner } from '@/components/AuthLayoutInner';
import { ToastProvider } from '@/components/ToastProvider';
import { DevPersonaSwitcher } from '@/components/DevPersonaSwitcher';
import type { CSSProperties } from 'react';

// ─── Layout styles matching Paper "App Shell" artboard ───────────────────────

const shellStyle: CSSProperties = {
  display: 'flex',
  height: '100dvh',
  overflow: 'hidden',
  backgroundColor: 'var(--page-secondary)',
  fontFamily: 'var(--font-family-body)',
};

const mainStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(firstName: string | null, lastName: string | null, email: string | null): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return '?';
}

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

  const { first_name, last_name, email, full_name } = authUser.profile;
  const displayName = first_name ?? email?.split('@')[0] ?? 'there';
  const initials = getInitials(first_name, last_name, email);
  const userDepartment = authUser.membership?.department ?? null;

  return (
    <ToastProvider>
      <div style={shellStyle}>
        <AppSidebar userRole={authUser.profile.system_role} />
        <div style={mainStyle}>
          <AuthLayoutInner
            topBar={<TopUtilityBar userInitials={initials} userName={displayName} userFullName={full_name ?? displayName} userDepartment={userDepartment} />}
          >
            {children}
          </AuthLayoutInner>
        </div>
      </div>
      <DevPersonaSwitcher />
    </ToastProvider>
  );
}
