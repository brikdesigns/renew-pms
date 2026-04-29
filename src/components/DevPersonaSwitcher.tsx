'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { createClient } from '@/lib/supabase/client';
import { border, color, font, gap, shadow, space } from '@/lib/tokens';
import { Badge, InteractiveListItem, useDevBarSlot } from '@brikdesigns/bds';

// ─── Gate ───────────────────────────────────────────────────────────────────

const SHOW_WIDGET =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === 'true';

// ─── Persona definitions (must match seed-test-users.ts) ────────────────────

type BadgeStatus = 'brand' | 'info';
type BadgeAppearance = 'solid' | 'subtle';

interface Persona {
  key: string;
  label: string;
  sublabel: string;
  email: string;
  badge: string;
  badgeStatus: BadgeStatus;
  badgeAppearance: BadgeAppearance;
  redirectTo: string;
}

interface TesterGroup {
  name: string;
  personas: Persona[];
}

// 7 personas matching seed-test-users.ts PERSONA_TEMPLATES.
// Tier signal via BDS Badge: `brand` (poppy) for elevated roles, `info`
// solid → subtle for staff levels.
const PERSONA_DEFS: Omit<Persona, 'key' | 'email'>[] = [
  { label: 'Brik Admin',     sublabel: 'brik_admin',                     badge: 'PLATFORM',  badgeStatus: 'brand', badgeAppearance: 'solid',  redirectTo: '/dashboard' },
  { label: 'Sarah Mitchell', sublabel: 'admin · proficient',             badge: 'ADMIN',     badgeStatus: 'brand', badgeAppearance: 'solid',  redirectTo: '/dashboard' },
  { label: 'Jessica Torres', sublabel: 'manager · proficient',           badge: 'MANAGER',   badgeStatus: 'info',  badgeAppearance: 'solid',  redirectTo: '/dashboard' },
  { label: 'Emily Rivera',   sublabel: 'staff · new · opening',          badge: 'NEW',       badgeStatus: 'info',  badgeAppearance: 'subtle', redirectTo: '/dashboard' },
  { label: 'Tyler Nguyen',   sublabel: 'staff · maturing · closing',     badge: 'MATURING',  badgeStatus: 'info',  badgeAppearance: 'subtle', redirectTo: '/dashboard' },
  { label: 'Amanda Chen',    sublabel: 'staff · proficient · hygienist', badge: 'STAFF',     badgeStatus: 'info',  badgeAppearance: 'subtle', redirectTo: '/dashboard' },
  { label: 'Rachel Foster',  sublabel: 'staff · proficient · frontdesk', badge: 'STAFF',     badgeStatus: 'info',  badgeAppearance: 'subtle', redirectTo: '/dashboard' },
];

const ALIASES = ['brikadmin', 'owner', 'manager', 'newhire', 'maturing', 'hygienist', 'frontdesk'];

const TESTERS: TesterGroup[] = [
  { name: 'Nick', personas: buildPersonas('nick@brikdesigns.com') },
  { name: 'Abbey', personas: buildPersonas('abbey@brikdesigns.com') },
];

function buildPersonas(baseEmail: string): Persona[] {
  const [local, domain] = baseEmail.split('@');
  return PERSONA_DEFS.map((def, i) => ({
    ...def,
    key: `${local}_${ALIASES[i]}`,
    email: `${local}+${ALIASES[i]}@${domain}`,
  }));
}

const TEST_PASSWORD = process.env.NEXT_PUBLIC_TEST_PASSWORD ?? 'TestUser123!';

// ─── Styles ─────────────────────────────────────────────────────────────────
//
// All values come from BDS canonical tokens via @/lib/tokens — the panel
// adapts to the active theme (light / dark / brand) like every other product
// surface. No hardcoded hex.

// Panel anchored above the DevBar (bottom-center). z-index must exceed the
// DevBar shell (2147483647) so the panel renders above it.
const panelStyle: CSSProperties = {
  position: 'fixed',
  bottom: '72px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 2147483647,
  width: '280px',
  backgroundColor: color.surface.overlay,
  borderRadius: border.radius.md,
  border: `${border.width.sm} solid ${color.border.primary}`,
  boxShadow: shadow.lg,
  padding: space.sm,
  display: 'flex',
  flexDirection: 'column',
  gap: gap.xs,
};

const categoryLabelStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.subtitle.md,
  fontWeight: font.weight.bold,
  color: color.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: `${space.xs} ${space.sm} ${space.sm}`,
};

const avatarStyle: CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  backgroundColor: color.surface.secondary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: font.family.label,
  fontSize: font.size.subtitle.md,
  fontWeight: font.weight.bold,
  color: color.text.secondary,
  flexShrink: 0,
};

const loadingStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  padding: space.sm,
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  color: color.text.secondary,
};

const testerTabStyle = (active: boolean): CSSProperties => ({
  background: 'none',
  border: 'none',
  borderBottom: `${border.width.md} solid ${active ? color.brand.primary : 'transparent'}`,
  padding: `${space.xs} ${space.sm}`,
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: active ? font.weight.bold : font.weight.medium,
  color: active ? color.text.primary : color.text.secondary,
  cursor: 'pointer',
  transition: 'color 0.1s, border-color 0.1s',
});

const testerTabRowStyle: CSSProperties = {
  display: 'flex',
  gap: gap.xs,
  borderBottom: `${border.width.sm} solid ${color.border.primary}`,
  marginBottom: gap.xs,
};

// ─── Component ──────────────────────────────────────────────────────────────

export function DevPersonaSwitcher() {
  // All hooks must run before early returns so hook order stays consistent.
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [activeTester, setActiveTester] = useState(0);

  // Wait for brik-devbar.js to load before rendering anything.
  // Prevents a flash of any UI during the window between React hydration and
  // the DevBar shell becoming available on window.
  const [barReady, setBarReady] = useState(false);
  useEffect(() => {
    if (!SHOW_WIDGET) return;
    if (typeof window === 'undefined') return;
    const iv = setInterval(() => {
      if (window.BrikDevBar) {
        setBarReady(true);
        clearInterval(iv);
      }
    }, 100);
    return () => clearInterval(iv);
  }, []);

  // Register the persona slot into the DevBar shell.
  // Skip when gate is off so the bar doesn't show an inert icon.
  const slotDef = useMemo(() => (
    SHOW_WIDGET
      ? {
          id: 'persona',
          label: 'Personas',
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
          order: 30,
          onActivate: () => setOpen(true),
          onDeactivate: () => setOpen(false),
        }
      : null
  ), []);
  useDevBarSlot(slotDef);

  // Keep DevBar slot active state in sync with panel open/close.
  useEffect(() => {
    window.BrikDevBar?.setActive?.('persona', open);
  }, [open]);

  if (!SHOW_WIDGET || !barReady) return null;

  const handleSwitch = async (persona: Persona) => {
    setLoading(persona.key);
    const supabase = createClient();

    await supabase.auth.signOut();

    const { error } = await supabase.auth.signInWithPassword({
      email: persona.email,
      password: TEST_PASSWORD,
    });

    if (error) {
      console.error(`[DevPersonaSwitcher] Failed to switch to ${persona.key}:`, error.message);
      setLoading(null);
      alert(
        `Persona switch failed: ${error.message}\n\n` +
        `Check NEXT_PUBLIC_TEST_PASSWORD is set and seed-test-users has run against this Supabase project.`
      );
      return;
    }

    // Hard reload so server components pick up the new session.
    window.location.assign(persona.redirectTo);
  };

  const currentGroup = TESTERS[activeTester];

  if (!open) return null;

  return (
    <div style={panelStyle}>
      <div style={categoryLabelStyle}>Switch Persona</div>

      {/* Tester tabs */}
      <div style={testerTabRowStyle}>
        {TESTERS.map((t, i) => (
          <button
            key={t.name}
            type="button"
            style={testerTabStyle(i === activeTester)}
            onClick={() => setActiveTester(i)}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Personas for active tester */}
      {currentGroup.personas.map((p) => {
        const initials = p.label.split(' ').map((w) => w[0]).join('').slice(0, 2);
        const isLoading = loading === p.key;

        if (isLoading) {
          return (
            <div key={p.key} style={loadingStyle}>
              Switching to {p.label}...
            </div>
          );
        }

        return (
          <InteractiveListItem
            key={p.key}
            size="sm"
            leading={<span style={avatarStyle}>{initials}</span>}
            title={p.label}
            subtitle={p.sublabel}
            trailing={
              <Badge size="sm" status={p.badgeStatus} appearance={p.badgeAppearance}>
                {p.badge}
              </Badge>
            }
            onClick={() => handleSwitch(p)}
            disabled={loading !== null}
          />
        );
      })}
    </div>
  );
}
