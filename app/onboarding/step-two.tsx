/**
 * app/onboarding/step-two.tsx — Onboarding Step 2
 *
 * Example: permissions / feature highlight step.
 * Customize for notifications opt-in, location, contacts, etc.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Button, Card } from 'heroui-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { haptics } from '@/lib/haptics';
import { notifications } from '@/lib/notifications';
import { OnboardingDots } from '@/components/OnboardingDots';

const FEATURES = [
  { emoji: '🔔', title: 'Smart Reminders', desc: 'Get notified at the right time.' },
  { emoji: '🌙', title: 'Dark Mode', desc: 'Easy on the eyes, day or night.' },
  { emoji: '⚡', title: 'Blazing Fast', desc: 'Built on Expo for native performance.' },
];

export default function OnboardingStepTwo() {
  const { theme } = useTheme();
  const router = useRouter();
  const s = styles(theme);

  async function handleEnableNotifications() {
    haptics.medium();
    await notifications.requestPermission();
    router.push('/onboarding/step-three');
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => {
            haptics.light();
            router.back();
          }}
        >
          ← Back
        </Button>
      </View>

      <View style={s.illustration}>
        <View style={s.illustrationInner}>
          <Text style={s.illustrationEmoji}>🚀</Text>
        </View>
      </View>

      <View style={s.copy}>
        <Text style={s.heading}>Everything{'\n'}You Need</Text>
        <Text style={s.body}>
          This starter includes all the building blocks for a production app.
        </Text>
      </View>

      <View style={s.featureList}>
        {FEATURES.map((f) => (
          <Card key={f.title} style={s.featureCard}>
            <Card.Body style={s.featureBody}>
              <Text style={s.featureEmoji}>{f.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
            </Card.Body>
          </Card>
        ))}
      </View>

      <View style={s.footer}>
        <OnboardingDots total={3} current={1} />
        <Button
          variant="primary"
          size="lg"
          onPress={handleEnableNotifications}
        >
          Enable Notifications
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => {
            haptics.light();
            router.push('/onboarding/step-three');
          }}
        >
          Maybe later
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
      paddingHorizontal: 20,
    },
    header: { paddingTop: 8 },
    illustration: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    illustrationInner: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    illustrationEmoji: { fontSize: 56 },
    copy: { marginBottom: 16 },
    heading: {
      fontSize: 30,
      fontWeight: '800',
      color: theme.textPrimary,
      lineHeight: 38,
      marginBottom: 10,
    },
    body: { fontSize: 15, color: theme.textSecondary, lineHeight: 24 },
    featureList: { gap: 10, marginBottom: 16 },
    featureCard: {
      backgroundColor: theme.backgroundElevated,
      borderRadius: 14,
      borderColor: theme.border,
    },
    featureBody: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 12,
    },
    featureEmoji: { fontSize: 28 },
    featureTitle: { fontSize: 14, fontWeight: '600', color: theme.textPrimary },
    featureDesc: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
    footer: { gap: 12, paddingBottom: 16, alignItems: 'center' },
  });
}
