/**
 * lib/analytics.ts: two providers behind one `track()` call.
 *
 *   PostHog   → product analytics. "Where do people drop out of onboarding?"
 *   AppsFlyer → ad attribution.    "Which ad did this paying user come from?"
 *
 * They answer different questions and neither replaces the other, which is why
 * both are here. PostHog can't tell you a user came from a TikTok ad. AppsFlyer
 * can't tell you they abandoned onboarding on step 2. Sending one event to both
 * costs one function call.
 *
 * Both no-op when unconfigured. With an empty .env this file does nothing at
 * all, and every call site stays free of `if (analyticsEnabled)` guards.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Three non-obvious things this file exists to get right. Each one has cost a
 * real app real money; none of them produce an error message when wrong.
 *
 * 1. `getAppsFlyerUID()` feeds `Purchases.setAppsflyerID()` in lib/subscription.
 *    RevenueCat keys every server-side event it forwards to AppsFlyer
 *    (af_start_trial / af_purchase) on the `$appsflyerId` subscriber attribute.
 *    Leave it unset and RevenueCat drops all of them silently, while the
 *    dashboard integration still reads "Active". Installs keep attributing
 *    (that's the AppsFlyer SDK's own postback), which is exactly what hides the
 *    gap: the funnel looks alive right up to the revenue events that matter.
 *
 * 2. `af_app_opened` fires on every launch. Meta's AppsFlyer integration has no
 *    install postback, mapped in-app events are its only inbound signal, and
 *    af_app_opened → fb_mobile_activate_app is the one event that fires for
 *    every user. Without it, Meta's "Last iOS Install" goes stale and app
 *    install campaigns fail validation with error #1815437, whose message
 *    ("application_id needs to be valid") points at entirely the wrong thing.
 *    TikTok maps the same event to LaunchAPP.
 *
 * 3. Revenue events are NOT sent to AppsFlyer from here. RevenueCat sends the
 *    server-verified copy. AppsFlyer does not de-duplicate SDK events against
 *    server-to-server events, so logging both doubles every purchase and its
 *    revenue, which halves your apparent cost-per-paying-user: the exact number
 *    you scale ad spend on. See RC_FORWARDED_EVENTS below.
 *
 * The dashboard-side half of all this (toggles in the AppsFlyer, Meta and
 * TikTok consoles that no amount of correct code can substitute for) is
 * docs/launch-checklist.md. Read it before your first campaign, not after.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import PostHog from 'posthog-react-native';

import {
  APPLE_APP_ID,
  APPSFLYER_DEV_KEY,
  APPSFLYER_ENABLED,
  POSTHOG_ENABLED,
  POSTHOG_HOST,
  POSTHOG_KEY,
} from '@/constants/config';
import { optionalRequire } from './native';

// ── PostHog ───────────────────────────────────────────────────────────────────
/**
 * Constructed at module load, *not* inside `initAnalytics()`. The constructor
 * is synchronous and queues events until the client is ready, so anything you
 * track during the first render, before or without AppsFlyer init: is kept
 * rather than dropped.
 */
export const posthog: PostHog | null = POSTHOG_ENABLED
  ? new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      // Application Opened / Backgrounded / Installed, for retention curves you
      // get without instrumenting anything yourself.
      captureAppLifecycleEvents: true,
    })
  : null;

/**
 * Super-properties attached to every event. Useful when several apps report
 * into one PostHog project, without a discriminator, two apps that both emit
 * `onboarding_step` produce one meaningless funnel.
 */
posthog?.register({ platform: 'mobile' });

// ── AppsFlyer, loaded only if linked ─────────────────────────────────────────
type AppsFlyerModule = typeof import('react-native-appsflyer').default;
const appsFlyer = APPSFLYER_ENABLED
  ? optionalRequire<AppsFlyerModule>('react-native-appsflyer', (m) => m.default)
  : null;

// ── Event names ───────────────────────────────────────────────────────────────
/**
 * The `af_`-prefixed names are AppsFlyer's standard event vocabulary, which Meta
 * and TikTok recognise natively. Using them means the ad networks can optimise
 * toward these events with no custom mapping on your side. Rename them and you
 * inherit a mapping chore in three dashboards.
 *
 * Product-analytics-only events (`paywall_dismissed`, `settings_opened`, …)
 * don't need to be here, pass plain strings to `track()`.
 */
export const EVENT = {
  /** Onboarding finished. Meta reads this as activation. */
  TUTORIAL_COMPLETION: 'af_tutorial_completion',
  COMPLETE_REGISTRATION: 'af_complete_registration',
  /** Paywall shown. */
  CONTENT_VIEW: 'af_content_view',
  /** Subscribe button tapped, intent, not yet money. */
  INITIATED_CHECKOUT: 'af_initiated_checkout',
  /** Store granted a free trial. */
  START_TRIAL: 'af_start_trial',
  /** Paid subscription began with no trial. */
  SUBSCRIBE: 'af_subscribe',
  /** Any completed purchase. */
  PURCHASE: 'af_purchase',
} as const;

/**
 * Events RevenueCat forwards to AppsFlyer server-side. `track()` still sends
 * these to PostHog: it just refuses to double-report them to AppsFlyer.
 * See header note 3.
 */
const RC_FORWARDED_EVENTS: ReadonlySet<string> = new Set([
  EVENT.START_TRIAL,
  EVENT.SUBSCRIBE,
  EVENT.PURCHASE,
]);

// ── Init ──────────────────────────────────────────────────────────────────────
let initialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Boot AppsFlyer. Called once from app/_layout.tsx.
 *
 * Memoised so `getAppsFlyerUID()` can await an in-flight init rather than race
 * it. RevenueCat's bootstrap runs concurrently and needs the UID.
 */
export function initAnalytics(): Promise<void> {
  initPromise ??= doInitAnalytics();
  return initPromise;
}

async function doInitAnalytics(): Promise<void> {
  if (initialized) return;

  if (!appsFlyer) {
    // Mark initialised anyway: without it, every getAppsFlyerUID() call would
    // re-enter this function forever.
    initialized = true;
    if (__DEV__ && APPSFLYER_ENABLED) {
      console.log('[analytics] AppsFlyer key set but SDK not linked, make a dev build.');
    }
    return;
  }

  await new Promise<void>((resolve) => {
    appsFlyer.initSdk(
      {
        devKey: APPSFLYER_DEV_KEY,
        isDebug: __DEV__,
        appId: APPLE_APP_ID,
        onInstallConversionDataListener: true,
        onDeepLinkListener: true,
        // Hold the install postback for up to 60s waiting on the ATT prompt, so
        // a user who grants tracking still gets full IDFA-level attribution.
        //
        // This only pays off if you show the ATT prompt *early*. Prompt after
        // onboarding and a paywall and you'll routinely blow past 60s: the
        // postback fires without IDFA and you lose deterministic matching on
        // first launch. SKAdNetwork and the AppsFlyer ID are unaffected either
        // way. Set to 0 if you never show an ATT prompt at all.
        timeToWaitForATTUserAuthorization: 60,
      },
      (result) => {
        if (__DEV__) console.log('[analytics] AppsFlyer init', result);
        initialized = true;
        resolve();
      },
      (err) => {
        if (__DEV__) console.warn('[analytics] AppsFlyer init failed', err);
        // Resolve rather than reject: attribution failing must never block app
        // startup, and callers awaiting the UID need to be released.
        initialized = true;
        resolve();
      },
    );
  });

  // See header note 2: this single line is Meta's entire install signal.
  // Logged directly rather than through track(), since PostHog already captures
  // Application Opened natively and we don't want it twice.
  logToAppsFlyer('af_app_opened', {});
}

/**
 * AppsFlyer's device id for this install, or `null` when AppsFlyer is off.
 *
 * Consumed by `Purchases.setAppsflyerID()` in lib/subscription.ts (header note
 * 1). Awaits SDK init, which itself can wait up to 60s behind the ATT prompt,
 * never block your UI on this promise.
 */
export async function getAppsFlyerUID(): Promise<string | null> {
  if (!appsFlyer) return null;
  await initAnalytics();
  return new Promise((resolve) => {
    try {
      appsFlyer.getAppsFlyerUID((err, uid) => resolve(err || !uid ? null : uid));
    } catch {
      resolve(null);
    }
  });
}

// ── Track ─────────────────────────────────────────────────────────────────────
type EventProps = Record<string, unknown>;

/** Fire-and-forget event capture, fanned out to both providers. Safe anywhere. */
export function track(event: string, props?: EventProps): void {
  posthog?.capture(event, props as Record<string, any> | undefined);

  if (RC_FORWARDED_EVENTS.has(event)) return; // header note 3
  logToAppsFlyer(event, props ?? {});
}

function logToAppsFlyer(event: string, props: EventProps): void {
  if (!appsFlyer || !initialized) {
    if (__DEV__) console.log('[analytics] (appsflyer no-op)', event, props);
    return;
  }
  appsFlyer.logEvent(
    event,
    props as Record<string, any>,
    () => undefined,
    (err) => {
      if (__DEV__) console.warn('[analytics] event failed', event, err);
    },
  );
}

/**
 * Tie events to a stable user id (your auth id, not a device id).
 *
 * Call after login, and call `resetUser()` on logout, otherwise the next
 * account inherits the previous one's event history.
 */
export function identifyUser(userId: string, traits?: EventProps): void {
  posthog?.identify(userId, traits as Record<string, any> | undefined);
  appsFlyer?.setCustomerUserId(userId);
}

/** Forget the current user. Call on logout. */
export function resetUser(): void {
  posthog?.reset();
}

/** Manual screen view. `<PostHogProvider>` can do this automatically, see docs/posthog.md. */
export function trackScreen(name: string, props?: EventProps): void {
  posthog?.screen(name, props as Record<string, any> | undefined);
}

// ── SKAdNetwork conversion events ────────────────────────────────────────────
/**
 * On-device twins of RevenueCat's server-side trial/purchase events.
 *
 * SKAdNetwork conversion values can only be set by the on-device SDK, at the
 * moment *it* logs an event. RevenueCat's server-side events can never touch
 * them. Without these calls, every SKAN postback your app generates says
 * "install" and nothing more, so iOS campaigns on TikTok and Meta have no
 * signal to optimise toward trials or purchases, which is most of the value of
 * running them.
 *
 * The names are deliberately distinct from the standard ones. AppsFlyer does
 * not de-duplicate SDK events against server-to-server events, so reusing
 * `af_purchase` here would double-count every purchase (header note 3). Map
 * `af_skan_*` **only** in SKAN Conversion Studio's schema, never in a partner
 * postback mapping.
 */
export function logSKANConversion(
  name: 'af_skan_trial' | 'af_skan_purchase',
  revenue?: number,
  currency = 'USD',
): void {
  if (!appsFlyer || !initialized) return;
  const values: Record<string, unknown> = {};
  if (revenue != null) values.af_revenue = revenue;
  if (revenue != null) values.af_currency = currency;
  logToAppsFlyer(name, values);
}

// ── Revenue helpers ───────────────────────────────────────────────────────────
/**
 * These land in PostHog only; AppsFlyer receives RevenueCat's server-verified
 * copy. The `af_revenue` / `af_currency` property shape is kept anyway so
 * PostHog funnels stay directly comparable with the AppsFlyer numbers.
 */
type RevenueParams = {
  /** What the plan costs. Pass 0 for the trial itself. */
  amount: number;
  currency?: string;
  productId?: string;
  /** Your own label, 'monthly' | 'annual' | … */
  plan?: string;
};

export function trackTrialStart({
  amount,
  currency = 'USD',
  productId,
  plan,
}: RevenueParams): void {
  track(EVENT.START_TRIAL, {
    af_revenue: 0, // the trial is free; `will_convert_to` is what it becomes
    af_currency: currency,
    af_content_id: productId,
    plan,
    will_convert_to: amount,
  });
  logSKANConversion('af_skan_trial');
  posthog?.capture('purchase_completed', { plan: plan ?? null, is_trial: true });
}

export function trackPurchase({ amount, currency = 'USD', productId, plan }: RevenueParams): void {
  const props = {
    af_revenue: amount,
    af_currency: currency,
    af_content_id: productId,
    plan,
  };
  track(EVENT.SUBSCRIBE, props);
  // Also log af_purchase: some networks optimise on that name specifically.
  track(EVENT.PURCHASE, props);
  logSKANConversion('af_skan_purchase', amount, currency);
  posthog?.capture('purchase_completed', { plan: plan ?? null, is_trial: false });
}
