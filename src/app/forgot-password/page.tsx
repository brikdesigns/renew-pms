'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, TextInput } from '@brikdesigns/bds';
import { color, font, gap, space, border, shadow } from '@/lib/tokens';
import type { CSSProperties } from 'react';

// ─── Layout ──────────────────────────────────────────────────────────────────

const pageStyle: CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: color.page.secondary,
  padding: space.lg,
};

const cardStyle: CSSProperties = {
  width: '100%',
  maxWidth: '400px',
  backgroundColor: color.background.primary,
  borderRadius: border.radius.lg,
  boxShadow: shadow.md,
  padding: space.huge,
  display: 'flex',
  flexDirection: 'column',
  gap: gap.xl,
};

const headerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.sm,
  textAlign: 'center',
};

const logoStyle: CSSProperties = {
  fontFamily: font.family.heading,
  fontSize: font.size.heading.medium,
  fontWeight: font.weight.semibold,
  color: color.text.primary,
  margin: 0,
  letterSpacing: '-0.02em',
};

const taglineStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  color: color.text.secondary,
  margin: 0,
};

const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.lg,
};

const successStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  color: color.text.secondary,
  textAlign: 'center',
  margin: 0,
  lineHeight: font.lineHeight.normal,
};

const footerLinkStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.body.sm,
  color: color.system.link,
  textAlign: 'center',
  textDecoration: 'none',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <p style={logoStyle}>Renew PMS</p>
          <p style={taglineStyle}>
            {submitted ? 'Check your email' : 'Reset your password'}
          </p>
        </div>

        {submitted ? (
          <>
            <p style={successStyle}>
              If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox and spam folder.
            </p>
            <Link href="/login" style={footerLinkStyle}>
              Back to sign in
            </Link>
          </>
        ) : (
          <form style={formStyle} onSubmit={handleSubmit}>
            <TextInput
              label="Email address"
              type="email"
              placeholder="you@yourpractice.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="md"
              fullWidth
              required
              autoComplete="email"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              Send reset link
            </Button>

            <Link href="/login" style={footerLinkStyle}>
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
