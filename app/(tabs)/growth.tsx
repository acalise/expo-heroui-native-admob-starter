/**
 * app/(tabs)/growth.tsx: a live dashboard for the four growth integrations.
 *
 * Every row tells you whether that service is actually wired up in *this*
 * build, and gives you a button to exercise it. That's more useful than it
 * sounds: the failure mode for all four of these is silence. A missing
 * RevenueCat key, an AppsFlyer SDK that isn't linked because you're in Expo Go,
 * a PostHog host typo, none of them throw. They just quietly do nothing while
 * you assume they work, and you find out three weeks into an ad campaign.
 *
 * Delete this screen before shipping, or keep it behind a dev flag.
 */

import { useCallback, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Chip, Separator, Surface } from 'heroui-native';

import { AppText } from '@/components/AppText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import {
  ADS_ENABLED,
  APPSFLYER_ENABLED,
  POSTHOG_ENABLED,
  REVENUECAT_ENABLED,
} from '@/constants/config';
import { EVENT, getAppsFlyerUID, track } from '@/lib/analytics';
import { adsAllowed, showInterstitial, showRewarded } from '@/lib/ads';
import { haptics } from '@/lib/haptics';
import { IS_EXPO_GO } from '@/lib/native';
import { onPositiveMoment, resetReviewState } from '@/lib/review';
import { RC_ACTIVE, restore, useSubscription } from '@/lib/subscription';

export default function GrowthScreen() {
  const router = useRouter();
  const { isPro } = useSubscription();
  const [uid, setUid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const withBusy = useCallback(async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 pb-10"
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Growth"
        subtitle="Wiring status for every optional integration"
        accessory={
          <Chip size="sm" variant={isPro ? 'primary' : 'tertiary'}>
            <Chip.Label>{isPro ? 'Pro' : 'Free'}</Chip.Label>
          </Chip>
        }
      />

      {IS_EXPO_GO && (
        <Surface variant="secondary" className="mb-2 gap-1 rounded-xl p-4">
          <AppText className="text-sm font-semibold text-foreground">Running in Expo Go</AppText>
          <AppText className="text-sm leading-5 text-muted">
            RevenueCat, AppsFlyer and AdMob are native modules and aren&apos;t in this binary, so
            they no-op. Run <AppText className="font-mono text-xs">npx expo run:ios</AppText> for a
            dev build that includes them. PostHog is pure JS and works here.
          </AppText>
        </Surface>
      )}

      {/* ── Subscriptions ───────────────────────────────────────────────── */}
      <SectionLabel>RevenueCat · subscriptions</SectionLabel>
      <Card>
        <Card.Body className="gap-3">
          <StatusRow
            label="SDK key"
            ok={REVENUECAT_ENABLED}
            okText="configured"
            offText="not set, purchases grant a local dev unlock"
          />
          <StatusRow
            label="Native module"
            ok={RC_ACTIVE}
            okText="linked"
            offText={REVENUECAT_ENABLED ? 'not linked, make a dev build' : 'n/a until a key is set'}
          />
          <StatusRow label="Entitlement" ok={isPro} okText="active" offText="inactive" />
          <Separator />
          <View className="flex-row gap-2">
            <Button
              className="flex-1"
              onPress={() => {
                haptics.medium();
                router.push('/paywall');
              }}
            >
              <Button.Label>Open paywall</Button.Label>
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              isDisabled={busy}
              onPress={() =>
                withBusy(async () => {
                  const result = await restore();
                  Alert.alert(
                    result.status === 'success' ? 'Restored' : 'Nothing restored',
                    result.status === 'error' ? result.message : 'Your subscription is active.',
                  );
                })
              }
            >
              <Button.Label>Restore</Button.Label>
            </Button>
          </View>
        </Card.Body>
      </Card>

      {/* ── Analytics ───────────────────────────────────────────────────── */}
      <SectionLabel>PostHog · product analytics</SectionLabel>
      <Card>
        <Card.Body className="gap-3">
          <StatusRow
            label="Project key"
            ok={POSTHOG_ENABLED}
            okText="configured"
            offText="not set, track() is a no-op"
          />
          <AppText className="text-sm leading-5 text-muted">
            Events appear in PostHog → Activity within a few seconds. If nothing shows up, check the
            host region: EU projects need
            <AppText className="font-mono text-xs"> https://eu.i.posthog.com</AppText>.
          </AppText>
          <Button
            variant="secondary"
            onPress={() => {
              haptics.light();
              track('debug_test_event', { source: 'growth_screen', ts: Date.now() });
              Alert.alert(
                'Event sent',
                POSTHOG_ENABLED
                  ? 'Look for "debug_test_event" in PostHog → Activity.'
                  : 'No PostHog key set, so this went nowhere. That is the point of the row above.',
              );
            }}
          >
            <Button.Label>Send a test event</Button.Label>
          </Button>
        </Card.Body>
      </Card>

      {/* ── Attribution ─────────────────────────────────────────────────── */}
      <SectionLabel>AppsFlyer · ad attribution</SectionLabel>
      <Card>
        <Card.Body className="gap-3">
          <StatusRow
            label="Dev key"
            ok={APPSFLYER_ENABLED}
            okText="configured"
            offText="not set, attribution is off"
          />
          <StatusRow
            label="AppsFlyer ID"
            ok={Boolean(uid)}
            okText={uid ?? ''}
            offText="tap below to fetch"
          />
          <AppText className="text-sm leading-5 text-muted">
            This ID is what RevenueCat attaches to every revenue event it forwards. If it never
            resolves, RevenueCat silently drops those events, see docs/launch-checklist.md.
          </AppText>
          <Button
            variant="secondary"
            isDisabled={busy}
            onPress={() =>
              withBusy(async () => {
                haptics.light();
                const result = await getAppsFlyerUID();
                setUid(result);
                if (!result) {
                  Alert.alert(
                    'No AppsFlyer ID',
                    'Either no dev key is set, or the SDK is not linked in this build.',
                  );
                }
              })
            }
          >
            <Button.Label>Fetch AppsFlyer ID</Button.Label>
          </Button>
          <Button
            variant="ghost"
            onPress={() => {
              track(EVENT.TUTORIAL_COMPLETION, { source: 'growth_screen' });
              Alert.alert(
                'Sent af_tutorial_completion',
                'Standard AppsFlyer event name. Meta and TikTok recognise it without any mapping.',
              );
            }}
          >
            <Button.Label>Fire a standard event</Button.Label>
          </Button>
        </Card.Body>
      </Card>

      {/* ── Ads ─────────────────────────────────────────────────────────── */}
      <SectionLabel>AdMob · ads</SectionLabel>
      <Card>
        <Card.Body className="gap-3">
          <StatusRow
            label="EXPO_PUBLIC_ADS_ENABLED"
            ok={ADS_ENABLED}
            okText="true"
            offText="false, ads are off"
          />
          <StatusRow
            label="Serving right now"
            ok={adsAllowed()}
            okText="yes"
            offText={isPro ? 'no, user is a subscriber' : 'no'}
          />
          <AppText className="text-sm leading-5 text-muted">
            Google&apos;s test ad unit IDs are wired in, so these work without an AdMob account.
            Never point them at your real units in development, that&apos;s invalid traffic and it
            gets accounts banned.
          </AppText>
          <View className="flex-row gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              isDisabled={busy}
              onPress={() =>
                withBusy(async () => {
                  const shown = await showInterstitial();
                  if (!shown) Alert.alert('No ad shown', 'Ads are disabled or unavailable.');
                })
              }
            >
              <Button.Label>Interstitial</Button.Label>
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              isDisabled={busy}
              onPress={() =>
                withBusy(async () => {
                  const earned = await showRewarded();
                  Alert.alert(
                    earned ? 'Reward earned' : 'No reward',
                    earned
                      ? 'Grant the reward here. Only on EARNED_REWARD. CLOSED fires either way.'
                      : 'The user closed early, or ads are unavailable.',
                  );
                })
              }
            >
              <Button.Label>Rewarded</Button.Label>
            </Button>
          </View>
        </Card.Body>
      </Card>

      {/* ── Ratings ─────────────────────────────────────────────────────── */}
      <SectionLabel>Ratings</SectionLabel>
      <Card>
        <Card.Body className="gap-3">
          <AppText className="text-sm leading-5 text-muted">
            Apple caps the review prompt at three per user per year and gives you no way to know
            when you&apos;re over it: the call just does nothing. So spend the budget after
            something goes well, never after an error.
          </AppText>
          <View className="flex-row gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onPress={() => {
                haptics.success();
                void onPositiveMoment(5); // enough to trip the threshold immediately
              }}
            >
              <Button.Label>Trigger prompt</Button.Label>
            </Button>
            <Button variant="ghost" className="flex-1" onPress={() => void resetReviewState()}>
              <Button.Label>Reset counters</Button.Label>
            </Button>
          </View>
        </Card.Body>
      </Card>
    </ScrollView>
  );
}

// ── Status row ────────────────────────────────────────────────────────────────
function StatusRow({
  label,
  ok,
  okText,
  offText,
}: {
  label: string;
  ok: boolean;
  okText: string;
  offText: string;
}) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <AppText className="text-sm text-foreground">{label}</AppText>
      <View className="flex-1 flex-row items-center justify-end gap-2">
        <View className={`h-2 w-2 rounded-full ${ok ? 'bg-success' : 'bg-muted'}`} />
        <AppText
          numberOfLines={2}
          className={`flex-1 text-right text-sm ${ok ? 'text-foreground' : 'text-muted'}`}
        >
          {ok ? okText : offText}
        </AppText>
      </View>
    </View>
  );
}
