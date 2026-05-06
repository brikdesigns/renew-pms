'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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

const errorStyle: CSSProperties = {
  backgroundColor: color.surface.negative,
  color: color.text.negative,
  borderRadius: border.radius.md,
  padding: `${space.sm} ${space.md}`,
  fontSize: font.size.body.sm,
  fontFamily: font.family.body,
  lineHeight: font.lineHeight.normal,
};

const messageStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  color: color.text.secondary,
  textAlign: 'center',
  margin: 0,
  lineHeight: font.lineHeight.normal,
};

const linkStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.body.sm,
  color: color.system.link,
  textAlign: 'center',
  textDecoration: 'none',
};

// ─── Component ───────────────────────────────────────────────────────────────

type SessionState = 'checking' | 'valid' | 'missing';

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flow = searchParams.get('flow') === 'invite' ? 'invite' : 'recovery';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>('checking');

  useEffect(() => {
    const supabase = createClient();

    // Invite/recovery magic links land here with tokens in the URL fragment
    // (e.g. #access_token=...&refresh_token=...&type=invite). The browser
    // client's `detectSessionInUrl` is meant to auto-process this, but
    // @supabase/ssr's PKCE-default createBrowserClient does not reliably
    // pick up implicit-flow hash tokens — getUser() returns null and we
    // wrongly render "link expired".
    //
    // Fix: parse the hash explicitly and call setSession() to establish
    // the session deterministically, then strip the hash so the next
    // render doesn't re-process. Falls back to getUser() when there are
    // no tokens in the URL (recovery link already consumed, etc.).
    if (typeof window === 'undefined') return;

    const rawHash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(rawHash);
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data, error }) => {
          if (error || !data.session) {
            console.error('[reset-password] setSession failed:', error?.message);
            setSessionState('missing');
            return;
          }
          // Strip the hash so a refresh doesn't re-process the same tokens
          // and so the access_token isn't visible in the URL bar.
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname + window.location.search,
          );
          setSessionState('valid');
        });
      return;
    }

    // No URL tokens — check existing session (e.g. user navigated here
    // directly with a previously-established session).
    supabase.auth.getUser().then(({ data }) => {
      setSessionState(data.user ? 'valid' : 'missing');
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      // Don't surface raw Supabase error.message — Supabase strings can be
      // verbose, technical, or schema-leaky. Map to user-friendly text;
      // operator sees the underlying cause in console + Sentry.
      console.error('[reset-password] updateUser failed:', updateError.message);
      const raw = updateError.message?.toLowerCase() ?? '';
      if (raw.includes('session') || raw.includes('expired') || raw.includes('jwt')) {
        setError('Your session has expired. Request a new password-reset link to continue.');
      } else {
        setError('Could not set your password. Please try again or request a new link.');
      }
      setLoading(false);
      return;
    }

    if (flow === 'recovery') {
      // Sign out so the user re-authenticates with the new password
      await supabase.auth.signOut();
      router.push('/login?reset=true');
      return;
    }

    // Invite flow — user is now active, send them straight in
    router.push('/dashboard');
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <p style={logoStyle}>Renew PMS</p>
          <p style={taglineStyle}>
            {flow === 'invite' ? 'Set your password' : 'Choose a new password'}
          </p>
        </div>

        {sessionState === 'checking' && (
          <p style={messageStyle}>Verifying your link…</p>
        )}

        {sessionState === 'missing' && (
          <>
            <p style={messageStyle}>
              This link has expired or is no longer valid. Request a new one to continue.
            </p>
            <Link href="/forgot-password" style={linkStyle}>
              Request a new link
            </Link>
          </>
        )}

        {sessionState === 'valid' && (
          <form style={formStyle} onSubmit={handleSubmit}>
            {error && <div style={errorStyle}>{error}</div>}

            <TextInput
              label="New password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              size="md"
              fullWidth
              required
              autoComplete="new-password"
              minLength={8}
            />

            <TextInput
              label="Confirm new password"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              size="md"
              fullWidth
              required
              autoComplete="new-password"
              minLength={8}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              {flow === 'invite' ? 'Set password and sign in' : 'Update password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
