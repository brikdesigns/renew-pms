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
 *   import { font, color, space, gap, size, border } from '@/lib/tokens';
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
   * NOTE: Heading scale starts at font-size/300 (20px). font-size/100 (16px)
   *       is body/label territory — there is NO heading at 16px.
   * heading/tiny        → --heading-tiny           → 20px   (font-size/300)
   * heading/sm          → --heading-sm             → 22.5px (font-size/400)
   * heading/md          → --heading-md             → 25.3px (font-size/500)
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
      /** 20px (font-size/300) — smallest heading; do NOT use font-size/100 (16px) for headings */
      tiny: 'var(--heading-tiny)',
      small: 'var(--heading-sm)',    // 22.5px
      medium: 'var(--heading-md)',   // 25.3px
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
    positive: 'var(--text-positive)',
    warning: 'var(--text-warning)',
    success: 'var(--text-positive)',  // alias — Figma canonical name is "positive"
  },
  surface: {
    primary: 'var(--surface-primary)',
    secondary: 'var(--surface-secondary)',
    muted: 'var(--surface-muted)',
    accent: 'var(--surface-brand-accent)',
    negative: 'var(--surface-negative)',
    positive: 'var(--surface-positive)',
    warning: 'var(--surface-warning)',
    success: 'var(--surface-positive)',  // alias — Figma canonical name is "positive"
    overlay: 'var(--surface-overlay)',
    brandPrimary: 'var(--surface-brand-primary)',
    brandSecondary: 'var(--surface-brand-secondary)',
    nav: 'var(--surface-navigation)',
  },
  background: {
    primary: 'var(--background-primary)',
    secondary: 'var(--background-secondary)',
    brandPrimary: 'var(--background-brand-primary)',
    inverse: 'var(--background-inverse)',
    input: 'var(--background-input)',
    onColorDark: 'var(--background-on-color-dark)',
    muted: 'var(--background-muted)',
    positive: 'var(--background-positive)',
    status: {
      success:       'var(--background-status-success)',
      successSubtle: 'var(--background-status-success-subtle)',
      error:         'var(--background-status-error)',
      errorSubtle:   'var(--background-status-error-subtle)',
      warning:       'var(--background-status-warning)',
      warningSubtle: 'var(--background-status-warning-subtle)',
    },
  },
  border: {
    primary: 'var(--border-primary)',
    secondary: 'var(--border-secondary)',
    muted: 'var(--border-muted)',
    brand: 'var(--border-brand-primary)',
    negative: 'var(--border-negative)',
    positive: 'var(--border-positive)',
    input: 'var(--border-input)',
    inverse: 'var(--border-inverse)',
    focus: 'var(--border-focus)',
  },
  brand: {
    primary: 'var(--background-brand-primary)',
  },
  page: {
    primary: 'var(--page-primary)',
    secondary: 'var(--page-secondary)',
  },
  system: {
    link:        'var(--color-system-link)',
    error:       'var(--color-system-error)',
    errorLight:  'var(--color-system-error-light)',
    green:       'var(--color-system-green)',
    greenLight:  'var(--color-system-green-light)',
    yellow:      'var(--color-system-yellow)',
    yellowLight: 'var(--color-system-yellow-light)',
    red:         'var(--color-system-error)',   // alias — prefer .error
    blue:        'var(--color-system-blue)',
    orange:      'var(--color-system-orange)',
  },
  department: {
    blue:   { base: 'var(--background-department-blue)',   light: 'var(--background-department-blue-light)',   text: 'var(--text-department-blue)',   border: 'var(--border-department-blue)' },
    green:  { base: 'var(--background-department-green)',  light: 'var(--background-department-green-light)',  text: 'var(--text-department-green)',  border: 'var(--border-department-green)' },
    purple: { base: 'var(--background-department-purple)', light: 'var(--background-department-purple-light)', text: 'var(--text-department-purple)', border: 'var(--border-department-purple)' },
    gold:   { base: 'var(--background-department-gold)',   light: 'var(--background-department-gold-light)',   text: 'var(--text-department-gold)',   border: 'var(--border-department-gold)' },
    red:    { base: 'var(--background-department-red)',    light: 'var(--background-department-red-light)',    text: 'var(--text-department-red)',    border: 'var(--border-department-red)' },
    taupe:  { base: 'var(--background-department-taupe)',  light: 'var(--background-department-taupe-light)',  text: 'var(--text-department-taupe)',  border: 'var(--border-department-taupe)' },
    brown:  { base: 'var(--background-department-taupe)',  light: 'var(--background-department-taupe-light)',  text: 'var(--text-department-brown)',  border: 'var(--border-department-taupe)' },
  },
} as const;

// ─── Interaction States ──────────────────────────────────────────────

export const state = {
  hover: {
    background: 'var(--background-primary-hover)',   // solid bg hover (ghost buttons, nav items)
    brandPrimary: 'var(--background-brand-primary-hover)',
    subtle: 'var(--surface-primary-hover)',          // surface-level ghost/outline hover
    secondary: 'var(--surface-secondary-hover)',     // secondary surface hover
  },
  pressed: {
    background: 'var(--background-primary-pressed)',
    brandPrimary: 'var(--background-brand-primary-pressed)',
    secondary: 'var(--surface-secondary-pressed)',
  },
  focus: 'var(--border-focus)',
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
  // Extended — references space primitives not aliased in BDS padding tokens
  '2xl': 'var(--space-1000)',   // 40px
  '3xl': 'var(--space-1600)',   // 64px
} as const;

// ─── Gap (between elements) ─────────────────────────────────────────

export const gap = {
  none: 'var(--gap-none)',
  tiny: 'var(--gap-tiny)',   // 2px
  xs: 'var(--gap-xs)',       // 4px
  sm: 'var(--gap-sm)',       // 6px
  md: 'var(--gap-md)',       // 8px
  lg: 'var(--gap-lg)',       // 16px
  xl: 'var(--gap-xl)',       // 24px
  huge: 'var(--gap-huge)',   // 32px
  // Extended — references space primitives (no --gap-* alias in BDS for these steps)
  section: 'var(--space-1200)', // 48px — large section/column separation
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
    none: 'var(--border-radius-none)', // 0
    xs: 'var(--border-radius-100)',    // 4px — progress bars, count badges
    sm: 'var(--border-radius-sm)',     // 8px
    md: 'var(--border-radius-md)',     // 12px
    lg: 'var(--border-radius-lg)',     // 16px
    button: 'var(--border-radius-50)', // 2px
    input: 'var(--border-radius-50)',  // 2px
    pill: '9999px',
    circle: '50%',
  },
} as const;

// ─── Size (structural dimensions) ───────────────────────────────────
//
// Use these for widths, heights, and fixed-size elements (icons, dots,
// progress bars, avatars, dividers). These map to raw --space-* primitives
// on the 4-point grid. Do NOT hardcode px values for these — reach for
// the closest token instead.
//
// Scale reference (px):
//   xs=4  sm=8  md=12  lg=16  xl=20  xxl=24  3xl=28  4xl=32  5xl=40  6xl=48  7xl=64

export const size = {
  xs:  'var(--space-100)',   // 4px  — micro indicators, tight gaps
  sm:  'var(--space-200)',   // 8px  — small icons, progress tracks
  md:  'var(--space-300)',   // 12px — color dots, compact chips
  lg:  'var(--space-400)',   // 16px — standard icons
  xl:  'var(--space-500)',   // 20px — medium icons
  xxl: 'var(--space-600)',   // 24px — large icons, avatar-sm
  '3xl': 'var(--space-700)', // 28px — avatar-md, progress bars
  '4xl': 'var(--space-800)', // 32px — avatar-lg, button-height-sm
  '5xl': 'var(--space-1000)', // 40px — button-height-md, empty state icon
  '6xl': 'var(--space-1200)', // 48px — section spacing, hero icons
  '7xl': 'var(--space-1600)', // 64px — full-page loading padding
  /** 1px — hairline dividers and separators; use border.width.sm for borders */
  hairline: 'var(--space-25)',
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
