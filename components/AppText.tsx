/**
 * components/AppText.tsx: the text primitive every screen uses.
 *
 * ── Why wrap React Native's Text at all ─────────────────────────────────────
 * Two things you want in every app and get in neither RN's `Text` nor HeroUI:
 *
 *   1. **A font-scaling cap.** iOS accessibility text sizes go up to ~310%. At
 *      that size an uncapped layout doesn't degrade, it disintegrates, buttons
 *      overflow, rows collapse, tab labels overlap. `maxFontSizeMultiplier`
 *      keeps text growing (so you stay accessible) but stops it destroying the
 *      layout. Raise the cap for body copy, lower it for chrome; never remove
 *      it and never set `allowFontScaling={false}`, which ignores the user's
 *      setting entirely and is the accessibility bug people actually notice.
 *
 *   2. **One place to set the font family.** When you add a custom font you
 *      change it here, once, instead of in every StyleSheet in the project.
 *
 * Everything else is a plain RN `Text`, so `className` works exactly as usual.
 */

import { Text, type TextProps } from 'react-native';

export interface AppTextProps extends TextProps {
  className?: string;
}

/**
 * Cap on the accessibility text-size multiplier.
 *
 * 1.6 keeps large-text users well served while preventing a 3× blowup from
 * breaking every row. Pass your own `maxFontSizeMultiplier` to override per use.
 */
const MAX_FONT_SCALE = 1.6;

export function AppText({ maxFontSizeMultiplier = MAX_FONT_SCALE, ...props }: AppTextProps) {
  return <Text maxFontSizeMultiplier={maxFontSizeMultiplier} {...props} />;
}
