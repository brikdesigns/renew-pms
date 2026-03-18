import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { AppSidebar } from '@/components/AppSidebar';
import { color, space } from '@/lib/tokens';
import type { CSSProperties } from 'react';

const shellStyle: CSSProperties = {
  display: 'flex',
  minHeight: '100dvh',
  backgroundColor: color.page.secondary,
};

const mainStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: space.xl,
  overflowY: 'auto',
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect('/login');
  }

  return (
    <div style={shellStyle}>
      <AppSidebar userEmail={authUser.profile.email ?? undefined} />
      <main style={mainStyle}>{children}</main>
    </div>
  );
}
