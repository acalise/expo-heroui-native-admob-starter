/**
 * app/onboarding.tsx: the first-run flow.
 *
 * ── Why one screen and not three routes ─────────────────────────────────────
 * A paged ScrollView gives you swipe-back, a shared footer that doesn't remount
 * between steps, and one place to fire the funnel events. Three routes give you
 * three files, three copies of the footer, and a back gesture that pops you out
 * of onboarding entirely from step one.
 *
 * ── Why instrument every step ───────────────────────────────────────────────
 * Onboarding is where you lose most users, and the loss is invisible without
 * per-step events: the aggregate "50% finish" number tells you nothing about
 * *which* step to fix. `onboarding_step` on every advance turns PostHog's
 * funnel view into a list of exactly where people quit.
 *
 * `af_tutorial_completion` at the end is the AppsFlyer standard name for the
 * same milestone, which is what Meta reads as activation. Both fire from one
 * `track()` call, see lib/analytics.ts.
 *
 * ── Permission prompts belong here, but not on step one ─────────────────────
 * Ask for notifications *after* you've explained what they're for. A permission
 * dialog on first launch, before any context, is the reliable way to get denied
 *, and on iOS a denial is permanent: you cannot ask again, only send the user
 * to Settings.
 */

import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'heroui-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { BellIcon, CheckIcon, SparkleIcon, type IconProps } from '@/components/Icons';
import { OnboardingDots } from '@/components/OnboardingDots';
import { APP_NAME } from '@/constants/config';
import { EVENT, track } from '@/lib/analytics';
import { haptics } from '@/lib/haptics';
import { notifications } from '@/lib/notifications';
import { storage } from '@/lib/storage';

const ONBOARDING_KEY = 'onboarding:complete';

type Step = {
  id: string;
  icon: React.ComponentType<IconProps>;
  title: string;
  body: string;
  cta: string;
};

const STEPS: Step[] = [
  {
    id: 'welcome',
    icon: SparkleIcon,
    title: `Welcome to ${APP_NAME}`,
    body: 'Replace this copy with the one sentence that explains why someone should keep the app. Not a feature list: the outcome.',
    cta: 'Get started',
  },
  {
    id: 'notifications',
    icon: BellIcon,
    title: 'Stay on track',
    body: 'A single daily nudge, at a time you choose. You can change it or turn it off in Settings whenever you like.',
    cta: 'Enable reminders',
  },
  {
    id: 'ready',
    icon: CheckIcon,
    title: "You're all set",
    body: 'That’s everything. Have a look around, and delete this flow when you replace it with your own.',
    cta: 'Start using the app',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  /** Measured pager box. Null until the first layout pass, see the JSX below. */
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);

  const goTo = useCallback(
    (next: number) => {
      if (pageSize) scrollRef.current?.scrollTo({ x: next * pageSize.width, animated: true });
      setIndex(next);
    },
    [pageSize],
  );

  const finish = useCallback(async () => {
    await storage.set(ONBOARDING_KEY, true);
    // Both providers, one call: PostHog gets the funnel step, AppsFlyer gets
    // the standard activation event Meta and TikTok optimise toward.
    track(EVENT.TUTORIAL_COMPLETION, { steps: STEPS.length });
    haptics.success();
    router.replace('/(tabs)');
  }, [router]);

  const onPrimary = useCallback(async () => {
    haptics.medium();
    const step = STEPS[index];
    track('onboarding_step', { step: step.id, index });

    if (step.id === 'notifications') {
      setBusy(true);
      // A denial is fine and expected, never block progress on it.
      const granted = await notifications.requestPermission();
      track('notifications_permission', { granted });
      setBusy(false);
    }

    if (index === STEPS.length - 1) {
      await finish();
      return;
    }
    goTo(index + 1);
  }, [index, goTo, finish]);

  const onSkip = useCallback(() => {
    haptics.light();
    track('onboarding_skipped', { at_step: STEPS[index].id, index });
    void finish();
  }, [index, finish]);

  const isLast = index === STEPS.length - 1;

  return (
    <Screen>
      {/* Always allow an exit. A user forced through onboarding is a user who
          deletes the app instead of finishing it. */}
      <View className="h-11 flex-row justify-end px-5">
        {!isLast && (
          <Pressable onPress={onSkip} hitSlop={12} accessibilityRole="button">
            <AppText className="text-base text-muted">Skip</AppText>
          </Pressable>
        )}
      </View>

      {/* The pager gets an explicitly measured size rather than `flex-1` pages.
          Inside a *horizontal* ScrollView the content container is a flex ROW,
          so `flex: 1` on a page controls its WIDTH: it fights the page width
          and collapses the page to nothing, while contributing no height at all.
          Measuring the available box once and passing concrete numbers down is
          the reliable fix, and it costs one extra render on mount. */}
      <View className="flex-1" onLayout={(e) => setPageSize(e.nativeEvent.layout)}>
        {pageSize && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setIndex(Math.round(e.nativeEvent.contentOffset.x / pageSize.width))
            }
          >
            {STEPS.map((step) => (
              <View
                key={step.id}
                style={{ width: pageSize.width, height: pageSize.height }}
                className="items-center justify-center px-8"
              >
                <View className="h-24 w-24 items-center justify-center rounded-3xl bg-accent">
                  <step.icon className="text-accent-foreground" size={44} strokeWidth={2} />
                </View>
                <AppText className="pt-8 text-center text-3xl font-bold tracking-tight text-foreground">
                  {step.title}
                </AppText>
                <AppText className="pt-3 text-center text-base leading-6 text-muted">
                  {step.body}
                </AppText>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <View className="gap-5 px-6 pb-4">
        <View className="items-center">
          <OnboardingDots total={STEPS.length} current={index} />
        </View>
        <Button size="lg" isDisabled={busy} onPress={onPrimary}>
          <Button.Label>{busy ? 'One moment…' : STEPS[index].cta}</Button.Label>
        </Button>
      </View>
    </Screen>
  );
}
