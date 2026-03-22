/**
 * ─────────────────────────────────────────────────────────────────────────────
 * constants/theme.ts
 *
 * THE single source of truth for your app's accent color.
 *
 * To retheme the entire app, change ACCENT_COLOR below — both light and dark
 * mode variants will update automatically.
 *
 * Pair with tailwind.config.js (which reads the same value) so className-based
 * components and JS-based StyleSheet components stay in sync.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Change this one value to retheme the whole app ──────────────────────────
export const ACCENT_COLOR = '#3b82f6'; // blue-500

// ── Derived accent shades (generated at build time) ─────────────────────────
export const ACCENT_LIGHT = `${ACCENT_COLOR}26`; // 15% opacity — tint backgrounds
export const ACCENT_MUTED = `${ACCENT_COLOR}99`; // 60% opacity — subdued accents

// ── Light theme surface/text tokens ─────────────────────────────────────────
export const lightTheme = {
  background: '#ffffff',
  backgroundSecondary: '#f5f5f5',
  backgroundTertiary: '#ebebeb',
  backgroundElevated: '#ffffff',
  surface: '#f9f9f9',
  surfaceElevated: '#ffffff',

  textPrimary: '#09090b',
  textSecondary: '#71717a',
  textMuted: '#a1a1aa',
  textInverse: '#ffffff',

  border: '#e4e4e7',
  borderStrong: '#d4d4d8',
  divider: '#f4f4f5',

  accent: ACCENT_COLOR,
  accentLight: ACCENT_LIGHT,
  accentMuted: ACCENT_MUTED,

  shadow: 'rgba(0,0,0,0.08)',
  overlay: 'rgba(0,0,0,0.4)',
} as const;

// ── Dark theme surface/text tokens ───────────────────────────────────────────
export const darkTheme = {
  background: '#0f0f0f',
  backgroundSecondary: '#1a1a1a',
  backgroundTertiary: '#252525',
  backgroundElevated: '#1c1c1e',
  surface: '#161616',
  surfaceElevated: '#1c1c1e',

  textPrimary: '#fafafa',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  textInverse: '#09090b',

  border: '#27272a',
  borderStrong: '#3f3f46',
  divider: '#1f1f1f',

  accent: ACCENT_COLOR,
  accentLight: ACCENT_LIGHT,
  accentMuted: ACCENT_MUTED,

  shadow: 'rgba(0,0,0,0.4)',
  overlay: 'rgba(0,0,0,0.7)',
} as const;

export type AppTheme = {
  [K in keyof typeof lightTheme]: string;
};
export type ColorMode = 'light' | 'dark';
