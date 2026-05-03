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

// Settings shell scroll container. Owns the page-level horizontal inset and
// vertical rhythm for every settings detail page — the BDS PageHeader
// (post-0.57.0, edge-to-edge) and the body content below share the same
// column via paddingInline, and `gap` provides the PageHeader → body
// spacing that the non-settings shells (pageStyle, tasksStyle, scheduleStyle
// in AuthLayoutInner) already define.
const bodyStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: space.lg,
  paddingTop: space.md,
  paddingBottom: space.xl,
  paddingInline: space.xl,
  overflowY: 'auto',
  backgroundColor: color.page.primary,
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
