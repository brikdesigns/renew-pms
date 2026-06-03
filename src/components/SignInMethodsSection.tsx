'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import { Button, DataSection, Field, Banner } from '@brikdesigns/bds';
import { Icon } from '@iconify/react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ToastProvider';
import { border, color, font, gap, space } from '@/lib/tokens';

export interface LinkedIdentity {
  id: string;
  provider: string;
  email: string | null;
  last_sign_in_at: string | null;
}

interface SignInMethodsSectionProps {
  identities: LinkedIdentity[];
  mismatchedIdentities: LinkedIdentity[];
  primaryEmail: string;
  hasEmailIdentity: boolean;
  /** Triggered when the "Change password" button is clicked (parent owns the sheet). */
  onChangePassword: () => void;
}

interface SignInMethodsListProps {
  identities: LinkedIdentity[];
  mismatchedIdentities: LinkedIdentity[];
  primaryEmail: string;
}

const PROVIDER_LABEL: Record<string, string> = {
  email: 'Email + password',
  google: 'Google',
  apple: 'Apple',
  microsoft: 'Microsoft',
  azure: 'Microsoft',
};

const PROVIDER_ICON: Record<string, string> = {
  email: 'ph:envelope-fill',
  google: 'logos:google-icon',
  apple: 'logos:apple',
  microsoft: 'logos:microsoft-icon',
  azure: 'logos:microsoft-icon',
};

function providerLabel(slug: string): string {
  return PROVIDER_LABEL[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

function providerIcon(slug: string): string {
  return PROVIDER_ICON[slug] ?? 'ph:user-circle-fill';
}

function formatLastUsed(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.sm,
};

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
  padding: `${space.sm} ${space.md}`,
  borderRadius: border.radius.sm,
  backgroundColor: color.surface.secondary,
};

const rowIconWrap: CSSProperties = {
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const rowMetaStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.xs,
  flex: 1,
  minWidth: 0,
};

const rowProviderStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.body.sm,
  fontWeight: font.weight.semibold,
  color: color.text.primary,
};

const rowSubStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.xs,
  color: color.text.secondary,
};

const ctaWrapStyle: CSSProperties = {
  marginTop: space.md,
  display: 'flex',
  gap: gap.sm,
};

/**
 * Read-only list of sign-in methods. Reused by both the user-facing
 * Settings → Account section (#226 self-view) and the admin
 * ViewUserSheet → Sign-in tab (#226 admin-view), which is why it lives
 * here as a separate export. Connect/change actions stay on the wrapper.
 */
export function SignInMethodsList({
  identities,
  mismatchedIdentities,
  primaryEmail,
}: SignInMethodsListProps): ReactNode {
  return (
    <>
      {mismatchedIdentities.length > 0 && (
        <Banner
          tone="warning"
          title="Linked identity uses a different email"
          description={`${mismatchedIdentities
            .map((i) => `${providerLabel(i.provider)} (${i.email})`)
            .join(', ')} does not match the primary email (${primaryEmail}). Sign-ins via that provider won't link to this account — they will create a separate user. Update the linked identity's email at the provider, or sign in here using the matching email.`}
        />
      )}

      <Field label="Primary email" empty="—">{primaryEmail || null}</Field>

      <div style={listStyle}>
        {identities.length === 0 && (
          <span style={rowSubStyle}>No identities linked.</span>
        )}
        {identities.map((i) => (
          <div key={i.id} style={rowStyle}>
            <div style={rowIconWrap}>
              <Icon icon={providerIcon(i.provider)} style={{ fontSize: font.size.body.xl } as CSSProperties} />
            </div>
            <div style={rowMetaStyle}>
              <span style={rowProviderStyle}>{providerLabel(i.provider)}</span>
              <span style={rowSubStyle}>
                {i.email ?? '(no email recorded)'} · last used {formatLastUsed(i.last_sign_in_at)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function SignInMethodsSection({
  identities,
  mismatchedIdentities,
  primaryEmail,
  hasEmailIdentity,
  onChangePassword,
}: SignInMethodsSectionProps): ReactNode {
  const { showToast } = useToast();
  const [linking, setLinking] = useState(false);
  const hasGoogle = identities.some((i) => i.provider === 'google');

  const handleConnectGoogle = async () => {
    if (linking) return;
    setLinking(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?redirect=/settings/account`,
      },
    });
    if (error || !data?.url) {
      console.error('[link-identity] google link failed:', error?.message);
      showToast({
        title: 'Could not start Google link',
        description: error?.message ?? 'Please try again.',
        variant: 'error',
      });
      setLinking(false);
      return;
    }
    window.location.href = data.url;
  };

  const actions = hasEmailIdentity ? (
    <Button variant="primary" size="sm" onClick={onChangePassword}>
      Change password
    </Button>
  ) : undefined;

  return (
    <DataSection title="Sign-in methods" actions={actions}>
      <SignInMethodsList
        identities={identities}
        mismatchedIdentities={mismatchedIdentities}
        primaryEmail={primaryEmail}
      />

      {hasEmailIdentity && !hasGoogle && (
        <div style={ctaWrapStyle}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { void handleConnectGoogle(); }}
            disabled={linking}
          >
            {linking ? 'Connecting…' : 'Connect Google'}
          </Button>
        </div>
      )}
    </DataSection>
  );
}
