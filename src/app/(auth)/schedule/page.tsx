'use client';

import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { color, font, gap, space } from '@/lib/tokens';

const emptyStateStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  gap: gap.lg,
  padding: space.xl,
  minHeight: '60vh',
};

const iconStyle: React.CSSProperties = {
  fontSize: font.size.heading.xLarge,
  color: color.text.muted,
};

const headingStyle: React.CSSProperties = {
  fontFamily: font.family.heading,
  fontSize: font.size.heading.medium,
  fontWeight: 700,
  color: color.text.primary,
  margin: 0,
};

const descStyle: React.CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: color.text.secondary,
  textAlign: 'center',
  maxWidth: '400px',
  lineHeight: font.lineHeight.normal,
};

export default function SchedulePage() {
  return (
    <div style={emptyStateStyle}>
      <Icon icon={icon.calendar} style={iconStyle as React.CSSProperties & Record<string, string>} />
      <h1 style={headingStyle}>Schedule</h1>
      <p style={descStyle}>
        Staff scheduling is coming soon. You&apos;ll be able to manage shifts, view daily coverage, and coordinate team availability here.
      </p>
    </div>
  );
}
