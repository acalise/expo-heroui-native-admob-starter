/**
 * constants/config.ts: every environment variable the app reads, in one place.
 *
 * Why centralise instead of sprinkling `process.env.EXPO_PUBLIC_*` around:
 *
 * 1. `process.env.EXPO_PUBLIC_X` is **inlined at build time** by Metro. It is not
 *    a real object lookup, so `process.env[someVariable]` silently yields
 *    `undefined` and destructuring `process.env` returns an empty object. Every
 *    read has to be a literal member expression, easy to get wrong once, hard
 *    to notice. Doing it exactly once per variable, here, removes the footgun.
 *
 * 2. Each integration derives an `*_ENABLED` boolean from whether its key is
 *    present. Nothing in this starter throws or blocks when a key is missing,
 *    it no-ops. A fresh clone runs with an empty .env, and you switch each
 *    service on by pasting in a key. No code changes, no feature flags to find.
 *
 * ⚠️  EXPO_PUBLIC_* values are embedded in the app bundle and are readable by
 *    anyone who downloads your app. That is fine for the keys used here: they
 *    are all *publishable* client keys (RevenueCat SDK keys, the AppsFlyer dev
 *    key, PostHog project API keys, AdMob unit IDs) and every one of those
 *    vendors documents them as client-side values. It is NOT fine for a
 *    RevenueCat *secret* key, a PostHog personal API key, or anything that can
 *    write on your behalf. Those belong on a server, never in this file.
 */

import { Platform } from 'react-native';

// ── App ───────────────────────────────────────────────────────────────────────
export const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || 'My App';

/**
 * Numeric Apple App ID (the digits in every App Store URL: /id1234567890).
 * Needed by AppsFlyer for SKAdNetwork attribution and by the rating prompt's
 * "write a review" deep link. Public information, safe to hardcode as a
 * fallback so a missing env var can't silently break attribution in a release.
 */
export const APPLE_APP_ID = process.env.EXPO_PUBLIC_APPLE_APP_ID || '';

// ── RevenueCat (subscriptions) ────────────────────────────────────────────────
const RC_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

/** Platform-correct RevenueCat *public* SDK key (`appl_…` / `goog_…`). */
export const REVENUECAT_KEY = Platform.select({
  ios: RC_IOS_KEY,
  android: RC_ANDROID_KEY,
  default: '',
});
export const REVENUECAT_ENABLED = Boolean(REVENUECAT_KEY);

/** Entitlement identifier as spelled in the RevenueCat dashboard. */
export const RC_ENTITLEMENT = process.env.EXPO_PUBLIC_RC_ENTITLEMENT || 'pro';

/** Offering identifier, or '' to use whichever offering RC marks as current. */
export const RC_OFFERING = process.env.EXPO_PUBLIC_RC_OFFERING || '';

// ── AppsFlyer (ad attribution) ────────────────────────────────────────────────
export const APPSFLYER_DEV_KEY = process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY || '';
export const APPSFLYER_ENABLED = Boolean(APPSFLYER_DEV_KEY);

// ── PostHog (product analytics) ───────────────────────────────────────────────
export const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY || '';
export const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
export const POSTHOG_ENABLED = Boolean(POSTHOG_KEY);

// ── AdMob (ads) ───────────────────────────────────────────────────────────────
/**
 * Ads are opt-in even when the SDK is installed, because most apps ship ads to
 * free users only and you usually want them off while building.
 */
export const ADS_ENABLED = process.env.EXPO_PUBLIC_ADS_ENABLED === 'true';

// ── App Tracking Transparency ─────────────────────────────────────────────────
/**
 * Whether to show Apple's ATT prompt. Only meaningful on iOS.
 *
 * Leaving this false does NOT break attribution: AppsFlyer, SKAdNetwork and
 * RevenueCat all keep working without IDFA. What you lose is device-level
 * (deterministic) matching for the minority of users who would have said yes.
 * See docs/appsflyer.md for the trade-off in full.
 */
export const ATT_ENABLED = process.env.EXPO_PUBLIC_ATT_ENABLED === 'true';
