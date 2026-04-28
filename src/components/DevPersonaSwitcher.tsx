'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { createClient } from '@/lib/supabase/client';
import { gap } from '@/lib/tokens';
import { useDevBarSlot, InteractiveListItem } from '@brikdesigns/bds';

// ─── Gate ───────────────────────────────────────────────────────────────────

const SHOW_WIDGET =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === 'true';

// ─── Persona definitions (must match seed-test-users.ts) ────────────────────

interface Persona {
  key: string;
  label: string;
  sublabel: string;
  email: string;
  badge: string;
  badgeColor: string;
  redirectTo: string;
}

interface TesterGroup {
  name: string;
  personas: Persona[];
}

// 7 personas matching seed-test-users.ts PERSONA_TEMPLATES.
// Badge colors use BDS palette: Poppy for elevated roles, grayscale for staff.
const PERSONA_DEFS: Omit<Persona, 'key' | 'email'>[] = [
  { label: 'Brik Admin',     sublabel: 'brik_admin',                     badge: 'PLATFORM',  badgeColor: '#e35335', redirectTo: '/dashboard' }, // poppy-light
  { label: 'Sarah Mitchell', sublabel: 'admin · proficient',             badge: 'ADMIN',     badgeColor: '#b0351b', redirectTo: '/dashboard' }, // poppy-dark
  { label: 'Jessica Torres', sublabel: 'manager · proficient',           badge: 'MANAGER',   badgeColor: '#333333', redirectTo: '/dashboard' }, // grayscale-darkest
  { label: 'Emily Rivera',   sublabel: 'staff · new · opening',          badge: 'NEW',       badgeColor: '#828282', redirectTo: '/dashboard' }, // grayscale-dark
  { label: 'Tyler Nguyen',   sublabel: 'staff · maturing · closing',     badge: 'MATURING',  badgeColor: '#828282', redirectTo: '/dashboard' },
  { label: 'Amanda Chen',    sublabel: 'staff · proficient · hygienist', badge: 'STAFF',     badgeColor: '#bdbdbd', redirectTo: '/dashboard' }, // grayscale-light
  { label: 'Rachel Foster',  sublabel: 'staff · proficient · frontdesk', badge: 'STAFF',     badgeColor: '#bdbdbd', redirectTo: '/dashboard' },
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
// Inline BDS palette constants — dev-tool overlay, not a consumer surface.
// Mirrors the portal's DevPersonaSwitcher styling for visual consistency
// across products.

const BDS = {
  poppy:       '#e35335', // --color-poppy-light / --background-brand-primary
  white:       '#ffffff',
  tanLightest: '#f1f0ec', // --color-tan-lightest (hover surface)
  grayLighter: '#e0e0e0', // --border-primary
  grayDark:    '#828282', // --text-muted
  grayDarker:  '#4f4f4f', // --text-secondary
  grayDarkest: '#333333', // --text-primary
  fontFamily:  "'Poppins', system-ui, sans-serif",
} as const;

// Panel anchored above the DevBar (bottom-center). z-index must exceed the
// DevBar shell (2147483647) so the panel renders above it.
const panelStyle: CSSProperties = {
  position: 'fixed',
  bottom: '72px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 2147483647,
  width: '280px',
  backgroundColor: BDS.white,
  borderRadius: '12px',
  border: `1px solid ${BDS.grayLighter}`,
  boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: gap.xs,
  fontFamily: BDS.fontFamily,
};

const categoryLabelStyle: CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: BDS.grayDark,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '4px 8px 8px',
};

const personaBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  fontFamily: BDS.fontFamily,
  transition: 'background-color 0.1s ease',
};

const avatarStyle: CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  backgroundColor: BDS.tanLightest,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px',
  fontWeight: 700,
  color: BDS.grayDarker,
  flexShrink: 0,
};

const badgeStyle = (bgColor: string): CSSProperties => ({
  fontSize: '9px',
  fontWeight: 700,
  color: BDS.white,
  backgroundColor: bgColor,
  padding: '2px 6px',
  borderRadius: '4px',
  lineHeight: 1,
  letterSpacing: '0.04em',
  flexShrink: 0,
  marginLeft: 'auto',
});

const loadingStyle: CSSProperties = {
  ...personaBtnStyle,
  justifyContent: 'center',
  color: BDS.grayDark,
  fontSize: '12px',
};

const testerTabStyle = (active: boolean): CSSProperties => ({
  background: 'none',
  border: 'none',
  borderBottom: `2px solid ${active ? BDS.poppy : 'transparent'}`,
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: active ? 700 : 500,
  color: active ? BDS.grayDarkest : BDS.grayDark,
  cursor: 'pointer',
  fontFamily: BDS.fontFamily,
  transition: 'color 0.1s, border-color 0.1s',
});

const testerTabRowStyle: CSSProperties = {
  display: 'flex',
  gap: gap.xs,
  borderBottom: `1px solid ${BDS.grayLighter}`,
  marginBottom: '4px',
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
            trailing={<span style={badgeStyle(p.badgeColor)}>{p.badge}</span>}
            onClick={() => handleSwitch(p)}
            disabled={loading !== null}
          />
        );
      })}
    </div>
  );
}
