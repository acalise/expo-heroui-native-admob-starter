/**
 * hooks/useAppTheme.ts: read theme.css from JavaScript.
 *
 * ── Why you need this at all ────────────────────────────────────────────────
 * Almost everything in this app is styled with `className`, which reads the CSS
 * variables in theme.css directly. But a few things take colors as JS values
 * and cannot use classes:
 *
 *   - the tab bar's active/inactive tint (expo-router `Tabs` options)
 *   - the native Stack's `contentStyle` background
 *   - the status bar style
 *   - any third-party component with a `color` prop
 *
 * The tempting fix is a `constants/theme.ts` listing the same hex codes a
 * second time. That's what this starter used to do, and it drifts: you change
 * the accent, every button updates, the tab bar doesn't, and you notice in a
 * screenshot a week later. So we resolve the same CSS variables at runtime and
 * theme.css stays the only place a color is written down.
 *
 * ── This is a thin wrapper, on purpose ──────────────────────────────────────
 * The real work is HeroUI's `useThemeColor`, which is typed against the full
 * token list and re-renders on theme change. Use it directly wherever you want
 * one or two colors:
 *
 *   const accent = useThemeColor('accent');
 *   const [bg, border] = useThemeColor(['background', 'border']);
 *
 * `useAppTheme()` exists only so the handful of places that want a whole
 * palette object can have one, without listing token names at each call site.
 * If you only need one color, prefer `useThemeColor`, it's cheaper.
 */

import { useThemeColor } from 'heroui-native';

/** Resolved colors for the current color scheme. */
export type AppTheme = {
  accent: string;
  accentForeground: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  foreground: string;
  muted: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
};

/**
 * @example
 *   const theme = useAppTheme();
 *   <Tabs screenOptions={{ tabBarActiveTintColor: theme.accent }} />
 */
export function useAppTheme(): AppTheme {
  const [
    accent,
    accentForeground,
    background,
    surface,
    surfaceSecondary,
    foreground,
    muted,
    border,
    success,
    warning,
    danger,
  ] = useThemeColor([
    'accent',
    'accent-foreground',
    'background',
    'surface',
    'surface-secondary',
    'foreground',
    'muted',
    'border',
    'success',
    'warning',
    'danger',
  ]);

  return {
    accent,
    accentForeground,
    background,
    surface,
    surfaceSecondary,
    foreground,
    muted,
    border,
    success,
    warning,
    danger,
  };
}
