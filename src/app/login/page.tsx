'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, PasswordInput, TextInput } from '@brikdesigns/bds';
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

const errorStyle: CSSProperties = {
  backgroundColor: color.surface.negative,
  color: color.text.negative,
  borderRadius: border.radius.md,
  padding: `${space.sm} ${space.md}`,
  fontSize: font.size.body.sm,
  fontFamily: font.family.body,
  lineHeight: font.lineHeight.normal,
};

const forgotLinkStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.body.sm,
  color: color.system.link,
  textAlign: 'center',
  textDecoration: 'none',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
      return;
    }

    window.location.href = '/dashboard';
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <p style={logoStyle}>Renew PMS</p>
          <p style={taglineStyle}>Sign in to your practice</p>
        </div>

        <form style={formStyle} onSubmit={handleLogin}>
          {error && <div style={errorStyle}>{error}</div>}

          <TextInput
            label="Email address"
            type="email"
            name="email"
            placeholder="you@yourpractice.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            size="md"
            fullWidth
            required
            autoComplete="username"
          />

          <PasswordInput
            label="Password"
            name="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            size="md"
            fullWidth
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            Sign in
          </Button>

          <Link href="/forgot-password" style={forgotLinkStyle}>
            Forgot your password?
          </Link>
        </form>
      </div>
    </div>
  );
}
