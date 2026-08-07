/**
 * components/OnboardingDots.tsx: animated page indicator.
 *
 * The active dot stretches into a pill rather than just changing color. It's a
 * small thing, but it makes position legible at a glance even for someone who
 * can't distinguish the two colors, which is the accessible version of the
 * same design.
 */

import { View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useThemeColor } from 'heroui-native';

interface OnboardingDotsProps {
  total: number;
  current: number;
}

export function OnboardingDots({ total, current }: OnboardingDotsProps) {
  const [accent, border] = useThemeColor(['accent', 'border']);

  return (
    <View className="flex-row items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <Dot key={i} isActive={i === current} activeColor={accent} inactiveColor={border} />
      ))}
    </View>
  );
}

function Dot({
  isActive,
  activeColor,
  inactiveColor,
}: {
  isActive: boolean;
  activeColor: string;
  inactiveColor: string;
}) {
  const style = useAnimatedStyle(() => ({
    width: withSpring(isActive ? 24 : 8, { damping: 15 }),
    backgroundColor: withSpring(isActive ? activeColor : inactiveColor, { damping: 15 }),
  }));

  return <Animated.View style={[{ height: 8, borderRadius: 4 }, style]} />;
}
