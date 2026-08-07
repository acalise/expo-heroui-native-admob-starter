/**
 * lib/ads.ts: Google AdMob, optional and off by default.
 *
 * ── Should you even use ads? ────────────────────────────────────────────────
 * For most consumer apps, subscriptions out-earn ads by an order of magnitude
 * per user. Ads make sense when you have real volume and a use case people
 * won't pay for, or as the free tier under a subscription, which is the shape
 * wired up here: `adsAllowed()` returns false for subscribers, so the paywall
 * gets a genuine benefit to sell ("remove ads") at no extra work.
 *
 * If you're not shipping ads at all, `docs/admob.md` has the four-step removal.
 *
 * ── What's already handled ──────────────────────────────────────────────────
 * Google's official *test* ad unit IDs are wired in, so ads work immediately
 * without an AdMob account. Serving real ads to yourself against your own live
 * unit IDs is how accounts get banned for invalid traffic, keep the test IDs
 * until you ship.
 *
 * Every function here no-ops when ads are disabled, when the SDK isn't linked
 * (Expo Go), or when the user is a subscriber. Call sites need no guards.
 */

import { Platform } from 'react-native';

import { ADS_ENABLED } from '@/constants/config';
import { optionalRequire } from './native';
import { isPro } from './subscription';

type AdMobModule = typeof import('react-native-google-mobile-ads');

const admob = ADS_ENABLED
  ? optionalRequire<AdMobModule>('react-native-google-mobile-ads', (m) => m)
  : null;

export { ADS_ENABLED };

/**
 * The single question every ad site should ask.
 *
 * Ads off, SDK missing, running on web, or the user pays: all one answer.
 * Keeping subscriber checks here rather than at each call site is what stops
 * the one banner someone forgot to gate from showing up in a paying customer's
 * screenshot.
 */
export function adsAllowed(): boolean {
  return Boolean(admob) && Platform.OS !== 'web' && !isPro();
}

/**
 * Google's official test ad unit IDs.
 *
 * Replace with your own from https://admob.google.com before release, and note
 * they are per-platform *and* per-format: a banner ID in an interstitial slot
 * fails to fill with an unhelpful error.
 */
export const AD_UNIT_IDS = {
  banner: Platform.select({
    ios: 'ca-app-pub-3940256099942544/2934735716',
    android: 'ca-app-pub-3940256099942544/6300978111',
    default: 'ca-app-pub-3940256099942544/6300978111',
  }) as string,
  interstitial: Platform.select({
    ios: 'ca-app-pub-3940256099942544/4411468910',
    android: 'ca-app-pub-3940256099942544/1033173712',
    default: 'ca-app-pub-3940256099942544/1033173712',
  }) as string,
  rewarded: Platform.select({
    ios: 'ca-app-pub-3940256099942544/1712485313',
    android: 'ca-app-pub-3940256099942544/5224354917',
    default: 'ca-app-pub-3940256099942544/5224354917',
  }) as string,
};

// ── Init ──────────────────────────────────────────────────────────────────────
let initPromise: Promise<void> | null = null;

/**
 * Start the Mobile Ads SDK. Called once from app/_layout.tsx.
 *
 * On iOS, call this *after* your ATT decision if you show one: the SDK reads
 * the tracking status at initialisation to decide whether it may request
 * personalised ads, and initialising first permanently costs you the higher
 * personalised-ad rate for that session.
 */
export function initAds(): Promise<void> {
  initPromise ??= (async () => {
    if (!admob) return;
    try {
      await admob.default().initialize();
    } catch (e) {
      if (__DEV__) console.warn('[ads] initialize failed:', e);
    }
  })();
  return initPromise;
}

// ── Interstitials ─────────────────────────────────────────────────────────────
let interstitial: import('react-native-google-mobile-ads').InterstitialAd | null = null;
let interstitialReady = false;

/**
 * Pre-load an interstitial so it can appear instantly later.
 *
 * Interstitials take seconds to fetch. Requesting one at the moment you want to
 * show it means either a frozen UI or an ad that never appears, so load ahead
 * of the moment you plan to use.
 */
export async function loadInterstitial(): Promise<void> {
  if (!adsAllowed() || !admob) return;

  try {
    const { InterstitialAd, AdEventType } = admob;
    interstitial = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial, {
      requestNonPersonalizedAdsOnly: true,
    });

    await new Promise<void>((resolve) => {
      const unsubLoaded = interstitial!.addAdEventListener(AdEventType.LOADED, () => {
        unsubLoaded();
        interstitialReady = true;
        resolve();
      });
      const unsubError = interstitial!.addAdEventListener(AdEventType.ERROR, (err) => {
        unsubError();
        if (__DEV__) console.warn('[ads] interstitial failed to load:', err);
        interstitialReady = false;
        // Resolve rather than reject: a missing ad is not an app error, and an
        // unhandled rejection here would be.
        resolve();
      });
      interstitial!.load();
    });
  } catch (e) {
    if (__DEV__) console.warn('[ads] loadInterstitial failed:', e);
  }
}

/**
 * Show the pre-loaded interstitial, and start loading the next one.
 * Returns whether an ad was actually shown.
 *
 * Be sparing. Interstitials at a natural pause (level complete, task saved)
 * are tolerated; interstitials on app open or mid-task are a leading cause of
 * one-star reviews, and Apple rejects ads that appear before the user has done
 * anything. Never show one during onboarding.
 */
export async function showInterstitial(): Promise<boolean> {
  if (!adsAllowed() || !admob) return false;

  try {
    if (!interstitialReady) await loadInterstitial();
    if (!interstitial || !interstitialReady) return false;

    const unsub = interstitial.addAdEventListener(admob.AdEventType.CLOSED, () => {
      unsub();
      interstitialReady = false;
      void loadInterstitial(); // warm the next one
    });

    interstitial.show();
    return true;
  } catch (e) {
    if (__DEV__) console.warn('[ads] showInterstitial failed:', e);
    return false;
  }
}

// ── Rewarded ──────────────────────────────────────────────────────────────────
/**
 * Show a rewarded ad; resolves true only if the user earned the reward.
 *
 * The highest-value ad format and the only one users generally like, because
 * it's an explicit trade. Grant the reward on `EARNED_REWARD` only: a user who
 * closes the ad early has not earned it, and `CLOSED` fires either way.
 */
export async function showRewarded(): Promise<boolean> {
  if (!adsAllowed() || !admob) return false;

  try {
    const { RewardedAd, RewardedAdEventType, AdEventType } = admob;
    const ad = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded, {
      requestNonPersonalizedAdsOnly: true,
    });

    return await new Promise<boolean>((resolve) => {
      let earned = false;
      const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => ad.show());
      const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      });
      const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        unsubLoaded();
        unsubEarned();
        unsubClosed();
        resolve(earned);
      });
      const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
        unsubError();
        resolve(false);
      });
      ad.load();
    });
  } catch (e) {
    if (__DEV__) console.warn('[ads] showRewarded failed:', e);
    return false;
  }
}
