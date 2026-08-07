/**
 * lib/tracking.ts: Apple's App Tracking Transparency prompt.
 *
 * ── What it actually controls ───────────────────────────────────────────────
 * ATT gates one thing: access to the IDFA, the device advertising identifier.
 * It does NOT gate AppsFlyer, PostHog, RevenueCat, SKAdNetwork, or your ability
 * to run ads. All of those work with the prompt denied, or never shown.
 *
 * What you gain from a "yes": deterministic, user-level ad attribution: you
 * can say *this exact install* came from *that exact ad*. What you get from a
 * "no" or from never asking: SKAdNetwork's privacy-preserving aggregate
 * attribution, plus AppsFlyer's own probabilistic matching. Good enough to
 * optimise campaigns; not good enough to reconcile individual users.
 *
 * ── Should you show it? ─────────────────────────────────────────────────────
 * Only if you spend on ads. Opt-in rates run roughly 20–40%, and the prompt
 * costs you a beat of user attention and a little trust on first launch. If you
 * have no paid acquisition, showing it buys you nothing, leave
 * `EXPO_PUBLIC_ATT_ENABLED` unset and the prompt never appears.
 *
 * ── If you do show it, show it EARLY ────────────────────────────────────────
 * AppsFlyer holds its install postback for up to 60 seconds waiting on the ATT
 * decision (`timeToWaitForATTUserAuthorization` in lib/analytics.ts). Prompt
 * after onboarding and a paywall and you routinely exceed that window: the
 * postback fires without the IDFA and the "yes" you worked for is wasted.
 *
 * ── App Review ──────────────────────────────────────────────────────────────
 * `NSUserTrackingUsageDescription` must be in Info.plist (app.config.ts sets
 * it) and must describe a real benefit to the user. A generic string is a
 * common rejection. Also: you may show a *pre-prompt* explaining why you're
 * asking, but it must not be styled to look like Apple's dialog and must not
 * offer any incentive for saying yes.
 */

import * as TrackingTransparency from 'expo-tracking-transparency';
import { Platform } from 'react-native';

import { ATT_ENABLED } from '@/constants/config';
import { track } from './analytics';

export type TrackingStatus = 'granted' | 'denied' | 'restricted' | 'not-determined' | 'unavailable';

/**
 * Request tracking permission if it hasn't been decided yet.
 *
 * No-ops on Android, on iOS below 14, when `ATT_ENABLED` is false, and when the
 * user has already answered, iOS only ever shows the prompt once per install,
 * so re-asking is impossible by design.
 *
 * Call this as early as you reasonably can (see the note above): this starter
 * calls it from app/_layout.tsx once the first screen has mounted, since iOS
 * silently discards the prompt if the app isn't yet in the foreground.
 */
export async function requestTrackingPermission(): Promise<TrackingStatus> {
  if (!ATT_ENABLED || Platform.OS !== 'ios') return 'unavailable';

  try {
    const { status: existing } = await TrackingTransparency.getTrackingPermissionsAsync();
    if (existing !== 'undetermined') return normalise(existing);

    const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
    const result = normalise(status);
    // Worth tracking: the opt-in rate is the number that tells you whether your
    // pre-prompt copy is doing anything.
    track('att_prompt_answered', { status: result });
    return result;
  } catch (e) {
    if (__DEV__) console.warn('[tracking] ATT request failed:', e);
    return 'unavailable';
  }
}

/** Current status without prompting. */
export async function getTrackingStatus(): Promise<TrackingStatus> {
  if (Platform.OS !== 'ios') return 'unavailable';
  try {
    const { status } = await TrackingTransparency.getTrackingPermissionsAsync();
    return normalise(status);
  } catch {
    return 'unavailable';
  }
}

function normalise(status: string): TrackingStatus {
  switch (status) {
    case 'granted':
      return 'granted';
    case 'denied':
      return 'denied';
    case 'restricted':
      return 'restricted';
    case 'undetermined':
      return 'not-determined';
    default:
      return 'unavailable';
  }
}
