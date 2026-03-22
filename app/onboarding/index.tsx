/**
 * app/onboarding/index.tsx — Onboarding Step 1: Welcome
 *
 * Replace the copy and illustration with your own content.
 * Wire up "Get Started" to your actual auth / setup flow.
 *
 * Navigation: index → step-two → step-three → (tabs)
 */

import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Button } from 'heroui-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { haptics } from '@/lib/haptics';
import { OnboardingDots } from '@/components/OnboardingDots';

const { height } = Dimensions.get('window');

export default function OnboardingWelcome() {
  const { theme } = useTheme();
  const router = useRouter();
  const s = styles(theme);

  return (
    <SafeAreaView style={s.container}>
      {/* Illustration placeholder */}
      <View style={s.illustration}>
        <View style={s.illustrationInner}>
          <Text style={s.illustrationEmoji}>✨</Text>
        </View>
      </View>

      {/* Copy */}
      <View style={s.copy}>
        <Text style={s.heading}>Welcome to{'\n'}Your New App</Text>
        <Text style={s.body}>
          A beautifully designed starter template powered by Expo and HeroUI
          Native. Replace this copy with your own value proposition.
        </Text>
      </View>

      {/* Navigation */}
      <View style={s.footer}>
        <OnboardingDots total={3} current={0} />
        <Button
          variant="primary"
          size="lg"
          onPress={() => {
            haptics.medium();
            router.push('/onboarding/step-two');
          }}
        >
          Get Started
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => {
            haptics.light();
            router.replace('/(tabs)');
          }}
        >
          Skip intro
        </Button>
      </View>
    </SafeAreaView>
  );
}

function styles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingHorizontal: 28,
    },
    illustration: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    illustrationInner: {
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: theme.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    illustrationEmoji: { fontSize: 80 },
    copy: { paddingBottom: 32 },
    heading: {
      fontSize: 34,
      fontWeight: '800',
      color: theme.textPrimary,
      lineHeight: 42,
      marginBottom: 16,
    },
    body: {
      fontSize: 16,
      color: theme.textSecondary,
      lineHeight: 26,
    },
    footer: {
      paddingBottom: 16,
      gap: 12,
      alignItems: 'center',
    },
  });
}
