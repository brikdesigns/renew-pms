import { getAuthUser } from '@/lib/auth';
import { color, font, gap, space, border, shadow } from '@/lib/tokens';
import type { CSSProperties } from 'react';

const pageHeadingStyle: CSSProperties = {
  fontFamily: font.family.heading,
  fontSize: font.size.heading.medium,
  fontWeight: font.weight.semibold,
  color: color.text.primary,
  margin: 0,
  letterSpacing: '-0.01em',
};

const subheadingStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: color.text.muted,
  margin: `${gap.sm} 0 0`,
};

const statsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: gap.xl,
  marginTop: space.xl,
};

const statCardStyle: CSSProperties = {
  backgroundColor: color.background.primary,
  borderRadius: border.radius.lg,
  boxShadow: shadow.sm,
  padding: space.lg,
};

const statLabelStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: font.weight.medium,
  color: color.text.muted,
  margin: 0,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const statValueStyle: CSSProperties = {
  fontFamily: font.family.heading,
  fontSize: font.size.heading.large,
  fontWeight: font.weight.semibold,
  color: color.text.primary,
  margin: `${gap.sm} 0 0`,
};

const STATS = [
  { label: 'Open Tasks', value: '—' },
  { label: 'Training Modules', value: '—' },
  { label: 'Staff', value: '—' },
];

export default async function DashboardPage() {
  const authUser = await getAuthUser();
  const firstName = authUser?.profile.first_name ?? authUser?.profile.email;

  return (
    <div>
      <h1 style={pageHeadingStyle}>Dashboard</h1>
      <p style={subheadingStyle}>Welcome back, {firstName}</p>

      <div style={statsGridStyle}>
        {STATS.map((stat) => (
          <div key={stat.label} style={statCardStyle}>
            <p style={statLabelStyle}>{stat.label}</p>
            <p style={statValueStyle}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
