/**
 * BDS Token Reference for Portal Development
 *
 * Maps Figma style names → CSS custom property strings.
 * Source of truth: brik-bds/tokens/TOKEN-REFERENCE.md + Style Dictionary output.
 *
 * WHY THIS EXISTS:
 * Figma shows "body/md · 16/150" but code needs "var(--body-md)".
 * This file makes that conversion instant — import and use, no guessing.
 *
 * USAGE:
 *   import { font, color, space, gap, radius, border } from '@/lib/tokens';
 *   style={{ fontSize: font.size.body.md, color: color.text.primary }}
 *
 * DO NOT hardcode px values or hex colors. If a token is missing, add it here
 * and reference the BDS TOKEN-REFERENCE.md for the correct variable name.
 */

// ─── Typography ──────────────────────────────────────────────────────

export const font = {
  family: {
    body: 'var(--font-family-body)',
    heading: 'var(--font-family-heading)',
    label: 'var(--font-family-label)',
    subtitle: 'var(--font-family-subtitle)',
    display: 'var(--font-family-display)',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },

  /** Label casing — applied to Tags, Badges, subtitles. Controlled by --text-transform-label in theme-renew.css */
  transform: {
    label: 'var(--text-transform-label)' as 'uppercase' | 'lowercase' | 'capitalize' | 'none',
  },

  /**
   * Font sizes — maps to Figma typography styles
   *
   * Figma style        → Token                    → Resolved (Base)
   * ─────────────────────────────────────────────────────────────────
   * ── Body (font-family-body · Avenir) ─────────────────────────────────────
   * body/tiny           → --body-tiny              → 10.26px
   * body/xs             → --body-xs                → 11.54px
   * body/sm (14/150)    → --body-sm                → 14px
   * body/md (16/150)    → --body-md                → 16px  ← font-size/100
   * body/lg (18/150)    → --body-lg                → 18px
   * body/xl (20/150)    → --body-xl                → 20px
   *
   * ── Label (font-family-label · Avenir) ────────────────────────────────────
   * label/sm            → --label-sm               → 14px
   * label/md            → --label-md               → 16px
   * label/lg            → --label-lg               → 18px
   * label/xl            → --label-xl               → 20px
   *
   * ── Subtitle (font-family-label · Avenir, small caps context) ─────────────
   * subtitle/sm         → --subtitle-sm            → 10.26px  (font-size/25)
   * subtitle/md         → --subtitle-md            → 11.54px  (font-size/50)
   * subtitle/lg         → --subtitle-lg            → 16px     (font-size/100)
   *
   * ── Heading (font-family-heading · Century Schoolbook) ────────────────────
   * NOTE: Heading scale starts at font-size/200 (18px). font-size/100 (16px)
   *       is body/label territory — there is NO heading at 16px.
   * heading/xs  (tiny)  → --heading-tiny           → 18px   (font-size/200)
   * heading/sm          → --heading-sm             → 20px   (font-size/300)
   * heading/md          → --heading-md             → 22.5px (font-size/400)
   * heading/lg          → --heading-lg             → 28.5px (font-size/600)
   * heading/xl          → --heading-xl             → 32px   (font-size/700)
   * heading/xxl         → --heading-xxl            → 36px   (font-size/800)
   * heading/huge        → --heading-huge           → 40.5px (font-size/900)
   */
  size: {
    body: {
      tiny: 'var(--body-tiny)',
      xs: 'var(--body-xs)',
      sm: 'var(--body-sm)',
      md: 'var(--body-md)',
      lg: 'var(--body-lg)',
      xl: 'var(--body-xl)',
    },
    label: {
      sm: 'var(--label-sm)',   // 14px
      md: 'var(--label-md)',   // 16px
      lg: 'var(--label-lg)',   // 18px
      xl: 'var(--label-xl)',   // 20px
    },
    /** Subtitle sizes — smaller caps labels (font-family-label, no weight emphasis) */
    subtitle: {
      sm: 'var(--subtitle-sm)',  // 10.26px
      md: 'var(--subtitle-md)',  // 11.54px
      lg: 'var(--subtitle-lg)',  // 16px
    },
    heading: {
      /** 18px (font-size/200) — smallest heading; do NOT use font-size/100 (16px) for headings */
      tiny: 'var(--heading-tiny)',
      small: 'var(--heading-sm)',    // 20px
      medium: 'var(--heading-md)',   // 22.5px
      large: 'var(--heading-lg)',    // 28.5px
      xLarge: 'var(--heading-xl)',   // 32px
      xxLarge: 'var(--heading-xxl)', // 36px
      xxxLarge: 'var(--heading-huge)', // 40.5px
    },
    icon: {
      sm: 'var(--icon-sm)',
      md: 'var(--icon-md)',
      lg: 'var(--icon-lg)',
    },
  },

  lineHeight: {
    none: 'var(--font-line-height-none)',
    tight: 'var(--font-line-height-tight)',
    snug: 'var(--font-line-height-snug)',
    normal: 'var(--font-line-height-normal)',
    relaxed: 'var(--font-line-height-relaxed)',
    loose: 'var(--font-line-height-loose)',
  },

  weight: {
    light: 300 as const,
    regular: 400 as const,
    medium: 500 as const,
    semibold: 600 as const,
    bold: 700 as const,
  },
} as const;

// ─── Colors ──────────────────────────────────────────────────────────

export const color = {
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-muted)',
    brand: 'var(--text-brand-primary)',
    inverse: 'var(--text-inverse)',
    onColorDark: 'var(--text-on-color-dark)',
    onColorLight: 'var(--text-on-color-light)',
    negative: 'var(--text-negative)',
    warning: 'var(--text-warning)',
    success: 'var(--text-success)',
  },
  surface: {
    primary: 'var(--surface-primary)',
    secondary: 'var(--surface-secondary)',
    tertiary: 'var(--surface-tertiary)',
    negative: 'var(--surface-negative)',
    warning: 'var(--surface-warning)',
    success: 'var(--surface-success)',
    overlay: 'var(--surface-overlay)',
    brandPrimary: 'var(--surface-brand-primary)',
    brandSecondary: 'var(--surface-brand-secondary)',
    nav: 'var(--surface-nav)',
    accent: 'var(--surface-accent)',
  },
  background: {
    primary: 'var(--background-primary)',
    secondary: 'var(--background-secondary)',
    brandPrimary: 'var(--background-brand-primary)',
    inverse: 'var(--background-inverse)',
    elevated: 'var(--background-elevated)',
    input: 'var(--background-input)',
    onColorDark: 'var(--background-on-color-dark)',
    muted: 'var(--background-muted)',
    accent: 'var(--background-accent)',
  },
  border: {
    primary: 'var(--border-primary)',
    secondary: 'var(--border-secondary)',
    muted: 'var(--border-muted)',
    brand: 'var(--border-brand-primary)',
    negative: 'var(--border-negative)',
    input: 'var(--border-input)',
    inverse: 'var(--border-inverse)',
  },
  brand: {
    primary: 'var(--background-brand-primary)',
  },
  page: {
    primary: 'var(--page-primary)',
    secondary: 'var(--page-secondary)',
    accent: 'var(--page-accent)',
  },
  system: {
    link: 'var(--color-system-link)',
    red: 'var(--color-system-red)',
    green: 'var(--color-system-green)',
    yellow: 'var(--color-system-yellow)',
    blue: 'var(--color-system-blue)',
    orange: 'var(--color-system-orange)',
    purple: 'var(--color-system-purple)',
  },
  department: {
    blue:   { base: 'var(--color-department-blue)',   light: 'var(--color-department-blue-light)',   text: 'var(--color-department-blue-text)' },
    green:  { base: 'var(--color-department-green)',  light: 'var(--color-department-green-light)',  text: 'var(--color-department-green-text)' },
    purple: { base: 'var(--color-department-purple)', light: 'var(--color-department-purple-light)', text: 'var(--color-department-purple-text)' },
    pink:   { base: 'var(--color-department-pink)',   light: 'var(--color-department-pink-light)',   text: 'var(--color-department-pink-text)' },
    gold:   { base: 'var(--color-department-gold)',   light: 'var(--color-department-gold-light)',   text: 'var(--color-department-gold-text)' },
    red:    { base: 'var(--color-department-red)',     light: 'var(--color-department-red-light)',     text: 'var(--color-department-red-text)' },
    teal:   { base: 'var(--color-department-teal)',   light: 'var(--color-department-teal-light)',   text: 'var(--color-department-teal-text)' },
  },
} as const;

// ─── Interaction States ──────────────────────────────────────────────

export const state = {
  hover: {
    overlay: 'var(--state-hover-overlay)',
    brandPrimary: 'var(--background-brand-primary-hover)',
  },
  pressed: {
    overlay: 'var(--state-pressed-overlay)',
    brandPrimary: 'var(--background-brand-primary-pressed)',
  },
  focus: 'var(--state-focus)',
  disabled: {
    opacity: 'var(--state-disabled-opacity)',
  },
} as const;

export type DepartmentColorKey = keyof typeof color.department;

/** Look up department color tokens by color key */
export function departmentColor(colorKey: string) {
  const key = colorKey as DepartmentColorKey;
  return color.department[key] ?? color.department.blue;
}

// ─── Spacing (Padding) ──────────────────────────────────────────────

export const space = {
  none: 'var(--padding-none)',
  tiny: 'var(--padding-tiny)',
  xs: 'var(--padding-xs)',
  sm: 'var(--padding-sm)',
  md: 'var(--padding-md)',
  lg: 'var(--padding-lg)',
  xl: 'var(--padding-xl)',
  xxl: 'var(--padding-xl)',
  huge: 'var(--padding-huge)',
  button: 'var(--padding-tiny)',
  input: 'var(--padding-tiny)',
} as const;

// ─── Gap (between elements) ─────────────────────────────────────────

export const gap = {
  none: 'var(--gap-none)',
  tiny: 'var(--gap-tiny)',
  xs: 'var(--gap-xs)',
  sm: 'var(--gap-sm)',
  md: 'var(--gap-md)',
  lg: 'var(--gap-lg)',
  xl: 'var(--gap-xl)',
  huge: 'var(--gap-huge)',
} as const;

// ─── Border ──────────────────────────────────────────────────────────

export const border = {
  width: {
    none: 'var(--border-width-none)',
    sm: 'var(--border-width-sm)',
    md: 'var(--border-width-md)',
    lg: 'var(--border-width-lg)',
    xl: 'var(--border-width-xl)',
    huge: 'var(--border-width-huge)',
  },
  radius: {
    none: 'var(--border-radius-none)',
    sm: 'var(--border-radius-sm)',
    md: 'var(--border-radius-md)',
    lg: 'var(--border-radius-lg)',
    button: 'var(--border-radius-50)',
    input: 'var(--border-radius-50)',
    pill: '9999px',
    circle: '50%',
  },
} as const;

// ─── Motion ──────────────────────────────────────────────────────────

export const motion = {
  ease: {
    in: 'var(--ease-in)',
    out: 'var(--ease-out)',
    inOut: 'var(--ease-in-out)',
  },
  duration: {
    fast: 'var(--duration-fast)',       // 100ms
    normal: 'var(--duration-normal)',   // 200ms
    slow: 'var(--duration-slow)',       // 300ms
  },
  stagger: {
    1: 'var(--stagger-1)',  // 0ms
    2: 'var(--stagger-2)',  // 50ms
    3: 'var(--stagger-3)',  // 100ms
    4: 'var(--stagger-4)',  // 150ms
    5: 'var(--stagger-5)',  // 200ms
    6: 'var(--stagger-6)',  // 250ms
  },
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────

export const shadow = {
  none: 'var(--box-shadow-none)',
  sm: 'var(--box-shadow-sm)',
  md: 'var(--box-shadow-md)',
  lg: 'var(--box-shadow-lg)',
} as const;
