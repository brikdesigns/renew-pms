'use client';

import { useState, type CSSProperties } from 'react';
import { createClient } from '@/lib/supabase/client';
import { gap } from '@/lib/tokens';

// ─── Only render in development ─────────────────────────────────────────────

const IS_DEV = process.env.NODE_ENV === 'development';

// ─── Persona definitions (must match seed script) ───────────────────────────

interface Persona {
  key: string;
  label: string;
  sublabel: string;
  email: string;
  badge: string;
  badgeColor: string;
}

interface TesterGroup {
  name: string;
  personas: Persona[];
}

// Persona templates — same 6 roles for every tester
const PERSONA_DEFS: Omit<Persona, 'key' | 'email'>[] = [
  { label: 'Brik Admin',       sublabel: 'brik_admin',                    badge: 'PLATFORM',   badgeColor: '#e74c3c' },
  { label: 'Sarah Mitchell',   sublabel: 'admin · proficient',            badge: 'ADMIN',      badgeColor: '#f39c12' },
  { label: 'Jessica Torres',   sublabel: 'manager · proficient · full_day', badge: 'MANAGER',  badgeColor: '#e67e22' },
  { label: 'Emily Rivera',     sublabel: 'staff · new · opening',         badge: 'NEW',        badgeColor: '#3498db' },
  { label: 'Tyler Nguyen',     sublabel: 'staff · maturing · closing',    badge: 'MATURING',   badgeColor: '#9b59b6' },
  { label: 'Amanda Chen',      sublabel: 'staff · proficient · opening',  badge: 'PROFICIENT', badgeColor: '#27ae60' },
  { label: 'Rachel Foster',    sublabel: 'staff · proficient · full_day', badge: 'PROFICIENT', badgeColor: '#27ae60' },
];

const ALIASES = ['brikadmin', 'owner', 'manager', 'newhire', 'maturing', 'hygienist', 'frontdesk'];

// Testers — add new team members here
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

const TEST_PASSWORD = 'TestUser123!';

// ─── Styles ─────────────────────────────────────────────────────────────────

const fabStyle: CSSProperties = {
  position: 'fixed',
  bottom: '16px',
  left: '16px',
  zIndex: 9999,
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: '#1a1a2e',
  color: '#fff',
  border: '2px solid #333',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px',
  fontFamily: 'monospace',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  transition: 'transform 0.15s ease',
};

const panelStyle: CSSProperties = {
  position: 'fixed',
  bottom: '64px',
  left: '16px',
  zIndex: 9999,
  width: '280px',
  backgroundColor: '#1a1a2e',
  borderRadius: '12px',
  border: '1px solid #333',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: gap.xs,
  fontFamily: 'var(--font-family-body, system-ui)',
};

const headerStyle: CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
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
  transition: 'background-color 0.1s ease',
};

const avatarStyle: CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  backgroundColor: '#333',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px',
  fontWeight: 700,
  color: '#ccc',
  flexShrink: 0,
};

const nameStyle: CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#e0e0e0',
  lineHeight: 1.2,
};

const subStyle: CSSProperties = {
  fontSize: '11px',
  color: '#888',
  lineHeight: 1.2,
};

const badgeStyle = (color: string): CSSProperties => ({
  fontSize: '9px',
  fontWeight: 700,
  color,
  backgroundColor: `${color}20`,
  padding: '2px 6px',
  borderRadius: '4px',
  lineHeight: 1,
  flexShrink: 0,
  marginLeft: 'auto',
});

const loadingStyle: CSSProperties = {
  ...personaBtnStyle,
  justifyContent: 'center',
  color: '#888',
  fontSize: '12px',
};

// ─── Component ──────────────────────────────────────────────────────────────

const testerTabStyle = (active: boolean): CSSProperties => ({
  background: 'none',
  border: 'none',
  borderBottom: `2px solid ${active ? '#888' : 'transparent'}`,
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: active ? 700 : 500,
  color: active ? '#e0e0e0' : '#666',
  cursor: 'pointer',
  transition: 'color 0.1s, border-color 0.1s',
});

const testerTabRowStyle: CSSProperties = {
  display: 'flex',
  gap: gap.xs,
  borderBottom: '1px solid #333',
  marginBottom: '4px',
};

export function DevPersonaSwitcher() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [activeTester, setActiveTester] = useState(0);

  if (!IS_DEV) return null;

  const handleSwitch = async (persona: Persona) => {
    setLoading(persona.key);
    const supabase = createClient();

    // Sign out current user first
    await supabase.auth.signOut();

    // Sign in as the selected persona
    const { error } = await supabase.auth.signInWithPassword({
      email: persona.email,
      password: TEST_PASSWORD,
    });

    if (error) {
      console.error(`Failed to switch to ${persona.key}:`, error.message);
      setLoading(null);
      return;
    }

    // Hard reload to pick up new session in server components
    window.location.href = '/dashboard';
  };

  const currentGroup = TESTERS[activeTester];

  return (
    <>
      <button
        type="button"
        style={fabStyle}
        onClick={() => setOpen(!open)}
        aria-label="Toggle persona switcher"
        title="Dev Persona Switcher"
      >
        👤
      </button>

      {open && (
        <div style={panelStyle}>
          <div style={headerStyle}>Switch Persona</div>

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
              <button
                key={p.key}
                type="button"
                style={personaBtnStyle}
                onClick={() => handleSwitch(p)}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2a2a3e'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                disabled={loading !== null}
              >
                <span style={avatarStyle}>{initials}</span>
                <div>
                  <div style={nameStyle}>{p.label}</div>
                  <div style={subStyle}>{p.sublabel}</div>
                </div>
                <span style={badgeStyle(p.badgeColor)}>{p.badge}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
