/**
 * lib/ads.ts — Google AdMob helper (optional module)
 *
 * Set ADS_ENABLED=true in your .env to activate ads.
 * Set to false (default) to disable ads entirely — no SDK calls are made.
 *
 * Test ad unit IDs are pre-configured so ads work out of the box
 * in development. Replace with your real ad unit IDs before shipping.
 *
 * To remove ads entirely from your project:
 *   1. Delete this file and components/BannerAd.tsx
 *   2. Remove BannerAd usage from your screens
 *   3. Remove react-native-google-mobile-ads from package.json
 *   4. Remove the plugin from app.json
 */

import { Platform } from 'react-native';

// ── Configuration ──────────────────────────────────────────────────────────────

/**
 * Toggle ads on/off. Set EXPO_PUBLIC_ADS_ENABLED=true in your .env file.
 * Defaults to false so the starter works without any ad setup.
 */
export const ADS_ENABLED =
  process.env.EXPO_PUBLIC_ADS_ENABLED === 'true';

/**
 * Google's official test ad unit IDs.
 * Replace with your real IDs from https://admob.google.com before release.
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

// ── Interstitial helper ────────────────────────────────────────────────────────

let interstitialLoaded = false;
let interstitialAd: import('react-native-google-mobile-ads').InterstitialAd | null = null;

/**
 * Pre-load an interstitial ad so it's ready to show immediately.
 * Call this early (e.g. on app launch) if you plan to show one later.
 *
 * No-op if ADS_ENABLED is false.
 */
export async function loadInterstitial(): Promise<void> {
  if (!ADS_ENABLED) return;

  try {
    const { InterstitialAd, AdEventType } = await import(
      'react-native-google-mobile-ads'
    );
    interstitialAd = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial, {
      requestNonPersonalizedAdsOnly: true,
    });

    await new Promise<void>((resolve) => {
      const unsubscribe = interstitialAd!.addAdEventListener(AdEventType.LOADED, () => {
        unsubscribe();
        interstitialLoaded = true;
        resolve();
      });
      interstitialAd!.load();
    });
  } catch {
    // Silently fail — ads should never crash the app
  }
}

/**
 * Show the pre-loaded interstitial ad.
 * Automatically reloads after it closes so the next call is ready.
 * Returns true if the ad was shown, false otherwise.
 *
 * No-op if ADS_ENABLED is false.
 */
export async function showInterstitial(): Promise<boolean> {
  if (!ADS_ENABLED) return false;

  try {
    if (!interstitialLoaded || !interstitialAd) {
      await loadInterstitial();
    }
    if (!interstitialAd) return false;

    const { AdEventType } = await import('react-native-google-mobile-ads');
    interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialLoaded = false;
      loadInterstitial(); // pre-load next ad
    });

    interstitialAd.show();
    return true;
  } catch {
    return false;
  }
}
