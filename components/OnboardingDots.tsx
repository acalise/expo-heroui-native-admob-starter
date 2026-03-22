/**
 * components/OnboardingDots.tsx
 *
 * Animated step indicator for onboarding screens.
 */

import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';

interface OnboardingDotsProps {
  total: number;
  current: number;
}

export function OnboardingDots({ total, current }: OnboardingDotsProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => (
        <Dot key={i} isActive={i === current} theme={theme} />
      ))}
    </View>
  );
}

function Dot({
  isActive,
  theme,
}: {
  isActive: boolean;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const animStyle = useAnimatedStyle(() => ({
    width: withSpring(isActive ? 24 : 8, { damping: 15 }),
    backgroundColor: withSpring(
      isActive ? theme.accent : theme.border,
      { damping: 15 },
    ),
  }));

  return <Animated.View style={[styles.dot, animStyle]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
});
