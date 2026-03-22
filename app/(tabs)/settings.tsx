/**
 * app/(tabs)/settings.tsx — Settings Screen
 *
 * Features:
 *   - Light / Dark mode toggle (persisted via ThemeContext + AsyncStorage)
 *   - Notification time picker
 *   - Demo: shows how to wire up settings to lib/notifications
 */

import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import {
  Card,
  Switch,
  Button,
  Separator,
  Select,
} from 'heroui-native';
import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { haptics } from '@/lib/haptics';
import { notifications } from '@/lib/notifications';
import { storage } from '@/lib/storage';
import { ScreenHeader } from '@/components/ScreenHeader';
import { BannerAd } from '@/components/BannerAd';
import { ACCENT_COLOR } from '@/constants/theme';
import { ADS_ENABLED, showInterstitial } from '@/lib/ads';

type SelectOption = { value: string; label: string } | undefined;

const NOTIFICATION_HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: `${String(i).padStart(2, '0')}:00 ${i < 12 ? 'AM' : 'PM'}`,
}));

const ACCENT_OPTIONS = [
  { key: '#3b82f6', label: 'Blue (default)' },
  { key: '#8b5cf6', label: 'Purple' },
  { key: '#10b981', label: 'Emerald' },
  { key: '#f59e0b', label: 'Amber' },
  { key: '#ef4444', label: 'Red' },
  { key: '#ec4899', label: 'Pink' },
];

const NOTIF_HOUR_KEY = 'settings:notifHour';
const NOTIF_ENABLED_KEY = 'settings:notifEnabled';

export default function SettingsScreen() {
  const { colorMode, toggleColorMode, isDark, theme } = useTheme();
  const [adShowing, setAdShowing] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifHour, setNotifHour] = useState<SelectOption>({ value: '9', label: '09:00 AM' });
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Load persisted settings
  useEffect(() => {
    Promise.all([
      storage.get<boolean>(NOTIF_ENABLED_KEY),
      storage.get<string>(NOTIF_HOUR_KEY),
    ]).then(([enabled, hour]) => {
      if (enabled !== null) setNotifEnabled(enabled);
      if (hour !== null) {
        const h = parseInt(hour, 10);
        setNotifHour({
          value: hour,
          label: `${String(h).padStart(2, '0')}:00 ${h < 12 ? 'AM' : 'PM'}`,
        });
      }
    });
  }, []);

  async function handleNotifToggle(value: boolean) {
    haptics.light();
    if (value && hasPermission === null) {
      const granted = await notifications.requestPermission();
      setHasPermission(granted);
      if (!granted) return;
    }
    setNotifEnabled(value);
    storage.set(NOTIF_ENABLED_KEY, value);

    const hour = parseInt(notifHour?.value ?? '9', 10);
    if (value) {
      await notifications.cancelAll();
      await notifications.scheduleDailyReminder({
        title: '👋 Daily Reminder',
        body: 'Your daily check-in is ready.',
        hour,
        minute: 0,
      });
    } else {
      await notifications.cancelAll();
    }
  }

  async function handleHourChange(opt: SelectOption) {
    if (!opt) return;
    haptics.select();
    setNotifHour(opt);
    storage.set(NOTIF_HOUR_KEY, opt.value);

    if (notifEnabled) {
      await notifications.cancelAll();
      await notifications.scheduleDailyReminder({
        title: '👋 Daily Reminder',
        body: 'Your daily check-in is ready.',
        hour: parseInt(opt.value, 10),
        minute: 0,
      });
    }
  }

  const s = styles(theme);

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Settings" subtitle="App preferences" />

      {/* ── Appearance ───────────────────────────────────────────────────── */}
      <Text style={s.sectionTitle}>Appearance</Text>

      <Card style={s.card}>
        <Card.Body style={s.cardBody}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>Dark Mode</Text>
              <Text style={s.rowSubtitle}>
                Currently: <Text style={s.accent}>{colorMode}</Text>
              </Text>
            </View>
            <Switch
              isSelected={isDark}
              onSelectedChange={() => {
                haptics.light();
                toggleColorMode();
              }}
            />
          </View>

          <Separator />

          {/* Accent preview swatches */}
          <View>
            <Text style={s.rowTitle}>Accent Color</Text>
            <Text style={s.rowSubtitle}>
              Change{' '}
              <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
                ACCENT_COLOR
              </Text>{' '}
              in constants/theme.ts to retheme the app.
            </Text>
            <View style={s.swatchRow}>
              {ACCENT_OPTIONS.map((opt) => (
                <Pressable key={opt.key}>
                  <View
                    style={[
                      s.swatch,
                      { backgroundColor: opt.key },
                      opt.key === ACCENT_COLOR && s.swatchActive,
                    ]}
                  />
                </Pressable>
              ))}
            </View>
            <Text style={[s.rowSubtitle, { marginTop: 6 }]}>
              Current accent:{' '}
              <Text style={s.accent}>{ACCENT_COLOR}</Text>
            </Text>
          </View>
        </Card.Body>
      </Card>

      {/* ── Notifications ────────────────────────────────────────────────── */}
      <Text style={s.sectionTitle}>Notifications</Text>

      <Card style={s.card}>
        <Card.Body style={s.cardBody}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>Daily Reminder</Text>
              <Text style={s.rowSubtitle}>
                Get a push notification each day
              </Text>
            </View>
            <Switch
              isSelected={notifEnabled}
              onSelectedChange={handleNotifToggle}
            />
          </View>

          {notifEnabled && (
            <>
              <Separator />
              <Text style={s.inputLabel}>Reminder Time</Text>
              <Select
                value={notifHour}
                onValueChange={(val: SelectOption) => handleHourChange(val)}
                presentation="dialog"
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select time" />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Overlay />
                  <Select.Content presentation="dialog">
                    {NOTIFICATION_HOURS.map((h) => (
                      <Select.Item key={h.value} value={h.value} label={h.label}>
                        <Select.ItemLabel />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Portal>
              </Select>
            </>
          )}

          {Platform.OS !== 'ios' && (
            <Text style={[s.rowSubtitle, s.noteText]}>
              Note: Push notifications require a physical iOS/Android device.
            </Text>
          )}
        </Card.Body>
      </Card>

      {/* ── About ────────────────────────────────────────────────────────── */}
      <Text style={s.sectionTitle}>About</Text>

      <Card style={[s.card, { marginBottom: 32 }]}>
        <Card.Body style={s.cardBody}>
          {[
            { label: 'Version', value: '1.0.0' },
            { label: 'Built with', value: 'Expo + HeroUI Native' },
            { label: 'License', value: 'MIT' },
          ].map((item, i, arr) => (
            <View key={item.label}>
              <View style={s.row}>
                <Text style={s.rowTitle}>{item.label}</Text>
                <Text style={s.rowSubtitle}>{item.value}</Text>
              </View>
              {i < arr.length - 1 && <Separator style={{ marginVertical: 8 }} />}
            </View>
          ))}
        </Card.Body>
      </Card>

      {/* ── Ads (optional module demo) ───────────────────────────────────── */}
      <Text style={s.sectionTitle}>Ads (Optional)</Text>

      <Card style={[s.card]}>
        <Card.Body style={s.cardBody}>
          <Text style={s.rowTitle}>Google AdMob</Text>
          <Text style={s.rowSubtitle}>
            Status:{' '}
            <Text style={[s.accent, { color: ADS_ENABLED ? theme.accent : theme.textMuted }]}>
              {ADS_ENABLED ? 'Enabled' : 'Disabled'}
            </Text>
          </Text>
          <Text style={[s.rowSubtitle, { marginTop: 4 }]}>
            Set{' '}
            <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
              EXPO_PUBLIC_ADS_ENABLED=true
            </Text>{' '}
            in your .env to activate. Test ad unit IDs are pre-configured.
          </Text>

          <Separator />

          {/* Banner ad rendered inline */}
          <View style={{ alignItems: 'center' }}>
            <Text style={[s.rowSubtitle, { marginBottom: 6 }]}>
              Banner Ad — renders below when enabled:
            </Text>
            <BannerAd />
            {!ADS_ENABLED && (
              <Text style={[s.rowSubtitle, { fontStyle: 'italic' }]}>
                (disabled — set ADS_ENABLED=true to see)
              </Text>
            )}
          </View>

          <Separator />

          {/* Interstitial ad trigger */}
          <Button
            variant="outline"
            isDisabled={adShowing}
            onPress={async () => {
              haptics.medium();
              setAdShowing(true);
              await showInterstitial();
              setAdShowing(false);
            }}
          >
            {adShowing ? 'Showing Ad…' : 'Show Interstitial Ad (Demo)'}
          </Button>
          {!ADS_ENABLED && (
            <Text style={[s.rowSubtitle, { fontStyle: 'italic', textAlign: 'center' }]}>
              No-op while ads are disabled
            </Text>
          )}
        </Card.Body>
      </Card>

      {/* ── Danger Zone ──────────────────────────────────────────────────── */}
      <Text style={s.sectionTitle}>Danger Zone</Text>
      <Card style={[s.card, { marginBottom: 40 }]}>
        <Card.Body>
          <Text style={[s.rowSubtitle, { marginBottom: 12 }]}>
            This will wipe all locally stored data. Cannot be undone.
          </Text>
          <Button
            variant="danger"
            onPress={() => haptics.error()}
          >
            Reset App Data
          </Button>
        </Card.Body>
      </Card>
    </ScrollView>
  );
}

function styles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: theme.background },
    content: { paddingHorizontal: 16, paddingBottom: 40 },

    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 8,
      marginTop: 4,
    },

    card: {
      backgroundColor: theme.backgroundElevated,
      borderRadius: 16,
      marginBottom: 16,
      borderColor: theme.border,
    },
    cardBody: { gap: 12 },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowTitle: { fontSize: 15, fontWeight: '500', color: theme.textPrimary },
    rowSubtitle: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
    accent: { color: theme.accent, fontWeight: '600' },
    inputLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.textPrimary,
      marginBottom: 4,
    },

    swatchRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    swatch: { width: 28, height: 28, borderRadius: 14 },
    swatchActive: {
      borderWidth: 3,
      borderColor: theme.textPrimary,
      transform: [{ scale: 1.15 }],
    },

    noteText: { fontStyle: 'italic', marginTop: 4 },
  });
}
