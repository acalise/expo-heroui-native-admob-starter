/**
 * app/onboarding/step-three.tsx — Onboarding Step 3: All Set
 *
 * Final onboarding step. Mark onboarding as complete in storage,
 * then navigate to the main app.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'heroui-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { haptics } from '@/lib/haptics';
import { storage } from '@/lib/storage';
import { OnboardingDots } from '@/components/OnboardingDots';

export const ONBOARDING_COMPLETE_KEY = 'onboarding:complete';

export default function OnboardingStepThree() {
  const { theme } = useTheme();
  const router = useRouter();
  const s = styles(theme);

  async function handleFinish() {
    haptics.success();
    await storage.set(ONBOARDING_COMPLETE_KEY, true);
    // Replace the onboarding stack so the user can't swipe back
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        {/* Success illustration */}
        <View style={s.illustrationOuter}>
          <View style={s.illustrationInner}>
            <Text style={s.illustrationEmoji}>🎉</Text>
          </View>
        </View>

        <Text style={s.heading}>You're All Set!</Text>
        <Text style={s.body}>
          Everything is configured and ready to go. Dive in and start building
          something great.
        </Text>

        {/* Summary chips */}
        <View style={s.checkList}>
          {[
            '✅  Dark & light mode ready',
            '✅  Notifications configured',
            '✅  Theme system in place',
            '✅  Storage layer set up',
          ].map((item) => (
            <Text key={item} style={s.checkItem}>
              {item}
            </Text>
          ))}
        </View>
      </View>

      <View style={s.footer}>
        <OnboardingDots total={3} current={2} />
        <Button variant="primary" size="lg" onPress={handleFinish}>
          Start Exploring →
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
    content: { flex: 1, justifyContent: 'center' },
    illustrationOuter: { alignItems: 'center', marginBottom: 32 },
    illustrationInner: {
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: theme.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    illustrationEmoji: { fontSize: 72 },
    heading: {
      fontSize: 34,
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: 14,
    },
    body: {
      fontSize: 16,
      color: theme.textSecondary,
      lineHeight: 26,
      marginBottom: 28,
    },
    checkList: { gap: 10 },
    checkItem: { fontSize: 15, color: theme.textPrimary, lineHeight: 22 },
    footer: { gap: 12, paddingBottom: 16, alignItems: 'center' },
  });
}
