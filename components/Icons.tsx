/**
 * components/Icons.tsx: the app's icon set, as inline SVG.
 *
 * ── Why not an icon library ─────────────────────────────────────────────────
 * `@expo/vector-icons` is convenient and bundles several megabytes of font
 * files, of which a typical app uses eight glyphs. Hand-rolled SVG paths cost
 * bytes proportional to what you actually use and give you exact control over
 * stroke weight, which is what makes an icon set look designed rather than
 * borrowed.
 *
 * If you'd rather have thousands of icons than a small consistent set, install
 * `@expo/vector-icons` and delete this file, nothing else depends on it beyond
 * the imports in the screens.
 *
 * ── The className bit ───────────────────────────────────────────────────────
 * These take a `className` and read `color` from it via Uniwind's
 * `useResolveClassNames`, so `<CheckIcon className="text-accent" />` follows
 * theme.css like every other element. `react-native-svg` has no idea what a
 * class is: the hook resolves the class to a style object and we pull the
 * color out. That is the general recipe for using Tailwind classes with any
 * third-party component that only accepts props.
 */

import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useResolveClassNames } from 'uniwind';

export interface IconProps {
  /** Tailwind classes. Only the resolved text color is used. */
  className?: string;
  /** Explicit color; wins over `className`. */
  color?: string;
  size?: number;
  /** Stroke thickness. 1.75 reads well at 24px; go thinner as size grows. */
  strokeWidth?: number;
}

/** Resolve `className` → a concrete color string for react-native-svg. */
function useIconColor(className?: string, color?: string): string {
  const style = useResolveClassNames(className ?? '');
  return color ?? (style?.color as string) ?? 'currentColor';
}

export function ComponentsIcon({ className, color, size = 24, strokeWidth = 1.75 }: IconProps) {
  const c = useIconColor(className, color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="2" width="9" height="9" rx="2.5" stroke={c} strokeWidth={strokeWidth} />
      <Rect x="13" y="2" width="9" height="9" rx="2.5" stroke={c} strokeWidth={strokeWidth} />
      <Rect x="2" y="13" width="9" height="9" rx="2.5" stroke={c} strokeWidth={strokeWidth} />
      <Rect x="13" y="13" width="9" height="9" rx="2.5" stroke={c} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function ExploreIcon({ className, color, size = 24, strokeWidth = 1.75 }: IconProps) {
  const c = useIconColor(className, color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={c} strokeWidth={strokeWidth} />
      <Path d="m21 21-4.35-4.35" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function ProfileIcon({ className, color, size = 24, strokeWidth = 1.75 }: IconProps) {
  const c = useIconColor(className, color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={c} strokeWidth={strokeWidth} />
      <Path
        d="M4 20c0-4 3.58-7 8-7s8 3 8 7"
        stroke={c}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SettingsIcon({ className, color, size = 24, strokeWidth = 1.75 }: IconProps) {
  const c = useIconColor(className, color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={c} strokeWidth={strokeWidth} />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={c}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckIcon({ className, color, size = 24, strokeWidth = 2.5 }: IconProps) {
  const c = useIconColor(className, color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12.5 9.5 18 20 6.5"
        stroke={c}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CloseIcon({ className, color, size = 24, strokeWidth = 2 }: IconProps) {
  const c = useIconColor(className, color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function SparkleIcon({ className, color, size = 24, strokeWidth = 1.75 }: IconProps) {
  const c = useIconColor(className, color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3z"
        stroke={c}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronRightIcon({ className, color, size = 24, strokeWidth = 2 }: IconProps) {
  const c = useIconColor(className, color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m9 5 7 7-7 7"
        stroke={c}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BellIcon({ className, color, size = 24, strokeWidth = 1.75 }: IconProps) {
  const c = useIconColor(className, color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"
        stroke={c}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
