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

const dividerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
  fontFamily: font.family.label,
  fontSize: font.size.body.sm,
  color: color.text.secondary,
};

const dividerLineStyle: CSSProperties = {
  flex: 1,
  height: '1px',
  backgroundColor: color.border.primary,
};

const googleLogoWrapperStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: gap.sm,
};

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Official Google "G" mark — 4-color SVG per Google's brand guidelines.
 * Used inside the Sign in with Google button.
 */
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);

    const supabase = createClient();
    // Use the live page origin (not build-time NEXT_PUBLIC_SITE_URL) so the
    // PKCE code-verifier cookie set by signInWithOAuth lands on the same
    // host that the OAuth callback runs on. Mismatch (e.g. user starts on a
    // deploy permalink, redirectTo points at the branch alias) results in
    // "PKCE code verifier not found in storage" — the cookie was set on
    // a different cookie jar than the one the callback reads from. See #195.
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (oauthError) {
      console.error('[login] Google OAuth init failed:', oauthError.message);
      setError(`Could not sign in with Google: ${oauthError.message}`);
      setGoogleLoading(false);
      return;
    }
    // signInWithOAuth navigates the browser to Google; control does not
    // return here on success.
  };

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

        {error && <div style={errorStyle}>{error}</div>}

        <Button
          type="button"
          variant="secondary"
          size="lg"
          fullWidth
          onClick={handleGoogleSignIn}
          loading={googleLoading}
          disabled={loading}
        >
          <span style={googleLogoWrapperStyle}>
            <GoogleLogo />
            Sign in with Google
          </span>
        </Button>

        <div style={dividerStyle}>
          <div style={dividerLineStyle} />
          <span>or</span>
          <div style={dividerLineStyle} />
        </div>

        <form style={formStyle} onSubmit={handleLogin}>
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
            disabled={googleLoading}
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
