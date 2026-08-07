/**
 * app/paywall.tsx: the subscription screen.
 *
 * ── Why this is hand-built and not RevenueCat Paywalls ──────────────────────
 * RevenueCat ships `react-native-purchases-ui`, which renders paywalls you
 * design in their dashboard and can change without an app release. That is a
 * genuinely good product and worth adopting once you're iterating on pricing.
 *
 * It's not the default here because a starter's paywall should be *readable*.
 * This file shows the full purchase flow in ~200 lines of ordinary components:
 * fetch offerings → render plans → buy → handle cancel → close. Once you
 * understand that, swapping in the remote-config version is a small change,
 * documented at the bottom of docs/revenuecat.md.
 *
 * ── The App Review rules baked in here ──────────────────────────────────────
 * These are the routine rejection causes for a subscription screen. All four
 * are handled below; keep them if you rewrite the layout.
 *
 *   1. A visible **Restore Purchases** control (guideline 3.1.1). Someone who
 *      already paid and reinstalled must be able to get back in without paying
 *      twice, and a reviewer on a fresh device WILL look for this.
 *   2. A visible **dismiss** control (3.1.2). Hard paywalls are allowed, but a
 *      screen with no way out is not.
 *   3. **Price, period and renewal terms** next to the buy button. "$29.99/year,
 *      auto-renews, cancel anytime", not just "$29.99".
 *   4. Links to **Terms** and **Privacy Policy**. Apple requires functioning
 *      URLs here and in App Store Connect. Placeholders below, replace them.
 *
 * And the one that isn't a rule but costs the most conversions: never show
 * price alone. Show what the money buys, first.
 */

import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Chip, Spinner, Surface } from 'heroui-native';

import { AppText } from '@/components/AppText';

import { CheckIcon, CloseIcon } from '@/components/Icons';
import { EVENT, track } from '@/lib/analytics';
import { haptics } from '@/lib/haptics';
import { getPlans, purchase, restore, type Plan } from '@/lib/subscription';

// ── Replace these with your real URLs before submitting ──────────────────────
const TERMS_URL = 'https://example.com/terms';
const PRIVACY_URL = 'https://example.com/privacy';

/** What the user is actually buying. Lead with these, not with the price. */
const BENEFITS = [
  'Unlimited everything, no daily caps',
  'No ads, anywhere in the app',
  'Sync across all your devices',
  'Priority support from a human',
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Fires af_content_view, which is the event ad networks optimise toward
    // when you're running "reach people likely to view a paywall" campaigns.
    track(EVENT.CONTENT_VIEW, { screen: 'paywall' });

    getPlans()
      .then((fetched) => {
        setPlans(fetched);
        // Pre-select the best-value plan. Users overwhelmingly take the
        // default, so this single line moves annual-vs-monthly mix more than
        // most copy changes.
        const annual = fetched.find((p) => p.period === 'ANNUAL');
        setSelectedId((annual ?? fetched[0])?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const selected = plans.find((p) => p.id === selectedId);

  const close = useCallback(() => {
    track('paywall_dismissed');
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  const onBuy = useCallback(async () => {
    haptics.medium();
    track(EVENT.INITIATED_CHECKOUT, { plan: selected?.period ?? 'dev' });
    setBusy(true);

    const result = await purchase(selected);
    setBusy(false);

    if (result.status === 'success') {
      haptics.success();
      close();
      return;
    }
    // A user who tapped Cancel does not need an alert telling them they
    // cancelled. Silence is the correct response.
    if (result.status === 'cancelled') return;

    haptics.error();
    Alert.alert('Purchase failed', result.message);
  }, [selected, close]);

  const onRestore = useCallback(async () => {
    haptics.light();
    setBusy(true);
    const result = await restore();
    setBusy(false);

    if (result.status === 'success') {
      haptics.success();
      Alert.alert('Restored', 'Your subscription is active again.');
      close();
    } else if (result.status === 'error') {
      Alert.alert('Nothing to restore', result.message);
    }
  }, [close]);

  return (
    <View className="flex-1 bg-background">
      {/* Rule 2: always a way out. */}
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row justify-end px-4">
        <Pressable
          onPress={close}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
          className="h-9 w-9 items-center justify-center rounded-full bg-surface-secondary"
        >
          <CloseIcon className="text-muted" size={16} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-6 pb-6" showsVerticalScrollIndicator={false}>
        <View className="items-center pb-6 pt-2">
          <Chip variant="primary" size="sm">
            <Chip.Label>Pro</Chip.Label>
          </Chip>
          <AppText className="pt-4 text-center text-3xl font-bold text-foreground">
            Everything unlocked
          </AppText>
          <AppText className="pt-2 text-center text-base text-muted">
            Cancel anytime. Takes two taps.
          </AppText>
        </View>

        {/* Value before price. */}
        <View className="gap-3 pb-7">
          {BENEFITS.map((benefit) => (
            <View key={benefit} className="flex-row items-center gap-3">
              <View className="h-6 w-6 items-center justify-center rounded-full bg-accent">
                <CheckIcon className="text-accent-foreground" size={13} />
              </View>
              <AppText className="flex-1 text-base text-foreground">{benefit}</AppText>
            </View>
          ))}
        </View>

        {loading ? (
          <View className="items-center py-10">
            <Spinner size="lg" />
          </View>
        ) : plans.length > 0 ? (
          <View className="gap-3">
            {plans.map((plan) => (
              <PlanRow
                key={plan.id}
                plan={plan}
                selected={plan.id === selectedId}
                onSelect={() => {
                  haptics.select();
                  setSelectedId(plan.id);
                }}
              />
            ))}
          </View>
        ) : (
          <DevPlaceholder />
        )}
      </ScrollView>

      <View
        className="gap-3 border-t border-border px-6 pt-4"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Button size="lg" isDisabled={busy} onPress={onBuy}>
          <Button.Label>
            {busy ? 'Please wait…' : selected?.trialDays ? 'Start free trial' : 'Continue'}
          </Button.Label>
        </Button>

        {/* Rule 3: the terms, in plain words, next to the button. */}
        <AppText className="text-center text-xs leading-4 text-muted">
          {renderTerms(selected)}
        </AppText>

        <View className="flex-row items-center justify-center gap-5 pt-1">
          {/* Rule 1: restore. */}
          <Pressable onPress={onRestore} hitSlop={8} disabled={busy}>
            <AppText className="text-xs text-muted underline">Restore purchases</AppText>
          </Pressable>
          {/* Rule 4: the legal links. */}
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}>
            <AppText className="text-xs text-muted underline">Terms</AppText>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8}>
            <AppText className="text-xs text-muted underline">Privacy</AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ── Plan row ──────────────────────────────────────────────────────────────────
function PlanRow({
  plan,
  selected,
  onSelect,
}: {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
}) {
  const isAnnual = plan.period === 'ANNUAL';

  return (
    <Pressable onPress={onSelect} accessibilityRole="radio" accessibilityState={{ selected }}>
      <Surface
        variant="secondary"
        className={`flex-row items-center gap-3 rounded-xl border p-4 ${
          selected ? 'border-accent' : 'border-transparent'
        }`}
      >
        <View
          className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
            selected ? 'border-accent bg-accent' : 'border-border'
          }`}
        >
          {selected && <View className="h-1.5 w-1.5 rounded-full bg-accent-foreground" />}
        </View>

        <View className="flex-1">
          <AppText className="text-base font-semibold text-foreground">
            {labelForPeriod(plan.period)}
          </AppText>
          {plan.trialDays > 0 && (
            <AppText className="text-sm text-accent">{plan.trialDays}-day free trial</AppText>
          )}
        </View>

        <View className="items-end">
          {/* Always RevenueCat's localised string, never a hardcoded price. */}
          <AppText className="text-base font-semibold text-foreground">{plan.price}</AppText>
          {isAnnual && <AppText className="text-xs text-muted">Best value</AppText>}
        </View>
      </Surface>
    </Pressable>
  );
}

function labelForPeriod(period: string): string {
  switch (period) {
    case 'ANNUAL':
      return 'Yearly';
    case 'MONTHLY':
      return 'Monthly';
    case 'WEEKLY':
      return 'Weekly';
    case 'LIFETIME':
      return 'Lifetime';
    default:
      return period.charAt(0) + period.slice(1).toLowerCase();
  }
}

function renderTerms(plan?: Plan): string {
  if (!plan) {
    return 'Subscription renews automatically until cancelled. Manage or cancel anytime in your App Store settings.';
  }
  const period = labelForPeriod(plan.period).toLowerCase();
  const trial = plan.trialDays > 0 ? `${plan.trialDays} days free, then ` : '';
  return `${trial}${plan.price} per ${period === 'yearly' ? 'year' : period.replace('ly', '')}. Renews automatically until cancelled. Manage or cancel anytime in your App Store settings.`;
}

/**
 * Shown when RevenueCat has no offerings to return, no key configured, or the
 * dashboard isn't set up yet. Keeping the screen usable in this state is what
 * lets you design the paywall before touching App Store Connect; `purchase()`
 * grants a local dev unlock so the flow still completes.
 */
function DevPlaceholder() {
  return (
    <Surface variant="secondary" className="gap-2 rounded-xl p-4">
      <AppText className="text-sm font-semibold text-foreground">No offerings loaded</AppText>
      <AppText className="text-sm leading-5 text-muted">
        Set EXPO_PUBLIC_REVENUECAT_IOS_KEY in .env and configure an offering in the RevenueCat
        dashboard to see real plans and prices here.
      </AppText>
      <AppText className="text-sm leading-5 text-muted">
        In the meantime, &ldquo;Continue&rdquo; grants a local unlock so you can test everything
        behind the paywall. See docs/revenuecat.md.
      </AppText>
    </Surface>
  );
}
