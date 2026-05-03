import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { SettingsSubNav } from '@/components/SettingsSubNav';
import type { CSSProperties } from 'react';
import { color, space } from '@/lib/tokens';

// ─── Styles ──────────────────────────────────────────────────────────────────

const settingsShellStyle: CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
  width: '100%',
};

// Settings shell scroll container. Owns the page-level horizontal inset for
// every settings detail page — the BDS PageHeader (post-0.57.0, edge-to-edge)
// and the body content below share the same column via this paddingInline.
const bodyStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  backgroundColor: color.page.primary,
  paddingInline: space.xl,
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
