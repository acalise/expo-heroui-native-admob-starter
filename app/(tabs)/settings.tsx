/**
 * app/(tabs)/settings.tsx: appearance, notifications, subscription, dev tools.
 *
 * Also the reference for the two things every shipping app's settings screen
 * needs and most starters omit: a *three-way* appearance control (System is a
 * real choice, not the absence of one), and a restore-purchases row.
 */

import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import * as Application from 'expo-application';
import { Button, Card, ControlField, Description, Label, Separator } from 'heroui-native';

import { AppText } from '@/components/AppText';
import { ChevronRightIcon } from '@/components/Icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { useColorMode, type ColorModePreference } from '@/context/ThemeContext';
import { track } from '@/lib/analytics';
import { haptics } from '@/lib/haptics';
import { notifications } from '@/lib/notifications';
import { openStorePage } from '@/lib/review';
import { storage } from '@/lib/storage';
import { restore, setDevOverride, useSubscription } from '@/lib/subscription';

const NOTIF_ENABLED_KEY = 'settings:notifEnabled';
const NOTIF_HOUR_KEY = 'settings:notifHour';
const DEFAULT_HOUR = 9;

const APPEARANCE_OPTIONS: { value: ColorModePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export default function SettingsScreen() {
  const { preference, setPreference } = useColorMode();
  const { isPro } = useSubscription();

  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifHour, setNotifHour] = useState(DEFAULT_HOUR);

  useEffect(() => {
    void Promise.all([
      storage.getOrDefault<boolean>(NOTIF_ENABLED_KEY, false),
      storage.getOrDefault<number>(NOTIF_HOUR_KEY, DEFAULT_HOUR),
    ]).then(([enabled, hour]) => {
      setNotifEnabled(enabled);
      setNotifHour(hour);
    });
  }, []);

  const applyReminder = useCallback(async (enabled: boolean, hour: number) => {
    // Always clear before rescheduling. iOS keeps every scheduled notification
    // you ever created, so toggling a reminder a few times without cancelling
    // leaves the user with a pile of duplicates firing at old times.
    await notifications.cancelAll();
    if (!enabled) return;
    await notifications.scheduleDailyReminder({
      title: 'Daily check-in',
      body: 'Two minutes is all it takes.',
      hour,
      minute: 0,
    });
  }, []);

  const onNotifToggle = useCallback(
    async (value: boolean) => {
      haptics.light();
      if (value) {
        const granted = await notifications.requestPermission();
        if (!granted) {
          // A denied permission can only be changed in Settings: the OS will
          // never show the prompt again. Say so, and offer the shortcut.
          Alert.alert(
            'Notifications are off',
            'Turn them on for this app in iOS Settings to get reminders.',
            [
              { text: 'Not now', style: 'cancel' },
              { text: 'Open Settings', onPress: () => void Linking.openSettings() },
            ],
          );
          return;
        }
      }
      setNotifEnabled(value);
      void storage.set(NOTIF_ENABLED_KEY, value);
      void applyReminder(value, notifHour);
      track('reminder_toggled', { enabled: value });
    },
    [notifHour, applyReminder],
  );

  const onHourChange = useCallback(
    (hour: number) => {
      haptics.select();
      setNotifHour(hour);
      void storage.set(NOTIF_HOUR_KEY, hour);
      void applyReminder(notifEnabled, hour);
    },
    [notifEnabled, applyReminder],
  );

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 pb-10"
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Settings" subtitle="Preferences and account" />

      {/* ── Appearance ──────────────────────────────────────────────────── */}
      <SectionLabel>Appearance</SectionLabel>
      <Card>
        <Card.Body className="gap-3">
          <AppText className="text-sm text-muted">
            &ldquo;System&rdquo; follows the device and keeps following it, that&apos;s why
            it&apos;s a third option rather than just the default.
          </AppText>
          <View className="flex-row gap-2">
            {APPEARANCE_OPTIONS.map((option) => {
              const active = preference === option.value;
              return (
                <Button
                  key={option.value}
                  size="sm"
                  variant={active ? 'primary' : 'tertiary'}
                  className="flex-1"
                  onPress={() => {
                    haptics.select();
                    setPreference(option.value);
                  }}
                >
                  <Button.Label>{option.label}</Button.Label>
                </Button>
              );
            })}
          </View>
          <Separator />
          <AppText className="text-sm leading-5 text-muted">
            To rebrand the app, edit{' '}
            <AppText className="font-mono text-xs text-foreground">--accent</AppText> in{' '}
            <AppText className="font-mono text-xs text-foreground">theme.css</AppText>. Every
            component here, and the tab bar, reads that one value.
          </AppText>
        </Card.Body>
      </Card>

      {/* ── Notifications ───────────────────────────────────────────────── */}
      <SectionLabel>Notifications</SectionLabel>
      <Card>
        <Card.Body className="gap-3">
          <ControlField isSelected={notifEnabled} onSelectedChange={onNotifToggle}>
            <View className="flex-1">
              <Label>
                <Label.Text>Daily reminder</Label.Text>
              </Label>
              <Description>A nudge at the same time each day.</Description>
            </View>
            <ControlField.Indicator />
          </ControlField>

          {notifEnabled && (
            <>
              <Separator />
              <AppText className="text-sm text-foreground">Reminder time</AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
                <View className="flex-row gap-2 px-1">
                  {Array.from({ length: 24 }, (_, hour) => (
                    <Pressable
                      key={hour}
                      onPress={() => onHourChange(hour)}
                      className={`h-10 w-14 items-center justify-center rounded-lg ${
                        hour === notifHour ? 'bg-accent' : 'bg-surface-secondary'
                      }`}
                    >
                      <AppText
                        className={`text-sm ${
                          hour === notifHour ? 'text-accent-foreground' : 'text-foreground'
                        }`}
                      >
                        {formatHour(hour)}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </>
          )}
        </Card.Body>
      </Card>

      {/* ── Subscription ────────────────────────────────────────────────── */}
      <SectionLabel>Subscription</SectionLabel>
      <Card>
        <Card.Body className="gap-3">
          <View className="flex-row items-center justify-between">
            <AppText className="text-base text-foreground">Plan</AppText>
            <AppText className="text-base font-semibold text-foreground">
              {isPro ? 'Pro' : 'Free'}
            </AppText>
          </View>
          <Separator />
          {/* Apple requires a restore control wherever a subscription is sold or
              managed. It also has to work for a reviewer on a clean device. */}
          <Row
            label="Restore purchases"
            onPress={async () => {
              haptics.light();
              const result = await restore();
              Alert.alert(
                result.status === 'success' ? 'Restored' : 'Nothing to restore',
                result.status === 'error' ? result.message : 'Your subscription is active.',
              );
            }}
          />
          <Separator />
          <Row
            label="Manage subscription"
            onPress={() => {
              // Deep link straight into the App Store's subscription management.
              // Sending people to "Settings → tap your name → Subscriptions" is
              // a support ticket generator.
              void Linking.openURL('https://apps.apple.com/account/subscriptions');
            }}
          />
        </Card.Body>
      </Card>

      {/* ── About ───────────────────────────────────────────────────────── */}
      <SectionLabel>About</SectionLabel>
      <Card>
        <Card.Body className="gap-3">
          <View className="flex-row items-center justify-between">
            <AppText className="text-base text-foreground">Version</AppText>
            <AppText className="text-sm text-muted">
              {Application.nativeApplicationVersion ?? '1.0.0'} (
              {Application.nativeBuildVersion ?? '1'})
            </AppText>
          </View>
          <Separator />
          <Row
            label="Rate this app"
            onPress={() => {
              haptics.light();
              void openStorePage();
            }}
          />
          <Separator />
          <Row
            label="Privacy policy"
            onPress={() => void Linking.openURL('https://example.com/privacy')}
          />
        </Card.Body>
      </Card>

      {/* ── Dev tools ───────────────────────────────────────────────────── */}
      {__DEV__ && (
        <>
          <SectionLabel>Developer</SectionLabel>
          <Card>
            <Card.Body className="gap-3">
              <AppText className="text-sm leading-5 text-muted">
                Debug builds only: this block is compiled out of release bundles.
              </AppText>
              <View className="flex-row gap-2">
                <Button
                  size="sm"
                  variant="tertiary"
                  className="flex-1"
                  onPress={() => void setDevOverride('pro')}
                >
                  <Button.Label>Force Pro</Button.Label>
                </Button>
                <Button
                  size="sm"
                  variant="tertiary"
                  className="flex-1"
                  onPress={() => void setDevOverride('free')}
                >
                  <Button.Label>Force Free</Button.Label>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                  onPress={() => void setDevOverride(null)}
                >
                  <Button.Label>Clear</Button.Label>
                </Button>
              </View>
              <Button
                size="sm"
                variant="danger"
                onPress={() => {
                  Alert.alert('Reset all local data?', 'Clears storage and restarts onboarding.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reset',
                      style: 'destructive',
                      onPress: async () => {
                        await storage.clear();
                        haptics.warning();
                        Alert.alert('Cleared', 'Restart the app to see onboarding again.');
                      },
                    },
                  ]);
                }}
              >
                <Button.Label>Reset local data</Button.Label>
              </Button>
            </Card.Body>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

function Row({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-between py-1">
      <AppText className="text-base text-foreground">{label}</AppText>
      <ChevronRightIcon className="text-muted" size={18} />
    </Pressable>
  );
}

function formatHour(hour: number): string {
  const period = hour < 12 ? 'am' : 'pm';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}${period}`;
}
