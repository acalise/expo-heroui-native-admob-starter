/**
 * components/Screen.tsx: a full-height, safe-area-aware screen container.
 *
 * ── The gotcha this exists to avoid ─────────────────────────────────────────
 * Uniwind teaches React Native's **core** components (View, Text, ScrollView,
 * Pressable, Image…) to understand `className`. It does not, and cannot, do
 * that for arbitrary third-party components, including
 * `<SafeAreaView>` from react-native-safe-area-context.
 *
 * So this looks completely reasonable and is completely broken:
 *
 *   <SafeAreaView className="flex-1 bg-background">   // ❌ className ignored
 *
 * There is no warning. The classes are simply dropped, the container gets no
 * `flex: 1`, and it collapses to the height of its content, which usually
 * shows up as a footer stuck under the header and an empty screen below it.
 * The background often still looks right (inherited from the navigator), which
 * makes it read as a layout bug rather than a styling one.
 *
 * ── The two fixes ───────────────────────────────────────────────────────────
 * 1. `withUniwind(SomeComponent)`, wraps a third-party component so it accepts
 *    `className`. Right when you need the component's own behaviour:
 *
 *      const StyledIcon = withUniwind(Ionicons);
 *      <StyledIcon name="heart" className="text-accent" />
 *
 * 2. Read the insets and apply them to a plain `View`, which is what this
 *    component does. Fewer moving parts, and it lets each screen choose which
 *    edges to inset: a screen with a tab bar shouldn't pad its bottom, and a
 *    scrolling screen wants the top inset on its *content*, not its container.
 */

import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ScreenProps extends ViewProps {
  className?: string;
  /**
   * Which edges get safe-area padding.
   * @default ['top', 'bottom']
   */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function Screen({ edges = ['top', 'bottom'], className, style, ...props }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`flex-1 bg-background ${className ?? ''}`}
      style={[
        {
          paddingTop: edges.includes('top') ? insets.top : 0,
          paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
          paddingLeft: edges.includes('left') ? insets.left : 0,
          paddingRight: edges.includes('right') ? insets.right : 0,
        },
        style,
      ]}
      {...props}
    />
  );
}
