/**
 * lib/subscription.ts: RevenueCat subscriptions behind a small, honest API.
 *
 * ── Why RevenueCat rather than StoreKit / Play Billing directly ─────────────
 * You can absolutely ship IAP without it. What you'd then own yourself:
 * receipt validation against Apple's servers (including the sandbox-vs-prod
 * endpoint dance), a server to hold the receipts, renewal and cancellation
 * webhooks, grace periods and billing-retry states, restore-purchases across
 * devices, entitlement checks that survive a reinstall, and the same again for
 * Google Play with a completely different API. That is weeks of work whose
 * failure mode is "paying customers lose access", and it earns you nothing a
 * user can see.
 *
 * RevenueCat replaces all of it with one `getCustomerInfo()` call and is free
 * below a meaningful revenue threshold. Its other real advantage is being the
 * join point between purchases and ad spend: the AppsFlyer and Apple Search Ads
 * integrations below are what let you measure cost-per-*paying-user* instead of
 * cost-per-install, and installs are a vanity metric for a subscription app.
 *
 * ── The model ───────────────────────────────────────────────────────────────
 * One entitlement (`RC_ENTITLEMENT`, default 'pro'). Products map to it in the
 * RevenueCat dashboard, so adding a plan: a lifetime tier, a regional price,
 * is dashboard config, not an app release. Never check product identifiers in
 * app code; check the entitlement.
 *
 * ── Without a RevenueCat key ────────────────────────────────────────────────
 * Everything still runs. `purchase()` flips a local override so the paywall and
 * every gated feature can be exercised end-to-end before you've touched App
 * Store Connect. That local unlock is DEV-only, see `isPro()`.
 */

import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import {
  RC_ENTITLEMENT,
  RC_OFFERING,
  REVENUECAT_ENABLED,
  REVENUECAT_KEY,
} from '@/constants/config';
import { getAppsFlyerUID, trackPurchase, trackTrialStart } from './analytics';
import { optionalRequire } from './native';
import { storage } from './storage';

type PurchasesModule = typeof import('react-native-purchases').default;
type PurchasesPackage = import('react-native-purchases').PurchasesPackage;
type CustomerInfo = import('react-native-purchases').CustomerInfo;

const Purchases = REVENUECAT_ENABLED
  ? optionalRequire<PurchasesModule>('react-native-purchases', (m) => m.default)
  : null;

/** True when the SDK is both keyed and linked, i.e. purchases can really happen. */
export const RC_ACTIVE = Boolean(Purchases);

// ── Storage keys ──────────────────────────────────────────────────────────────
/**
 * Dev override. 'pro' force-unlocks; 'free' force-locks even over a real
 * entitlement, so you can test the free experience without cancelling a sandbox
 * subscription. Both are ignored outside __DEV__.
 */
const KEY_OVERRIDE = 'pro:override';
/**
 * Last known entitlement state, so a cold start on a plane doesn't show a
 * paying customer a paywall. Optimistic and intentionally so: the worst case is
 * a churned user keeping access until their next online launch, which is a far
 * cheaper mistake than locking out someone who paid.
 */
const KEY_CACHED = 'pro:cached';

// ── State ─────────────────────────────────────────────────────────────────────
export type Tier = 'free' | 'pro';

let cachedTier: Tier = 'free';
const listeners = new Set<() => void>();

function setTier(tier: Tier): void {
  if (tier === cachedTier) return;
  cachedTier = tier;
  listeners.forEach((notify) => notify());
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
let configured = false;

/**
 * Configure the SDK. Idempotent; safe to call from several places.
 *
 * Two of the calls in here are the ones people skip, and neither failure is
 * visible from the dashboard:
 *
 *   `enableAdServicesAttributionTokenCollection()`: without it, Apple Search
 *   Ads conversions never reach RevenueCat, so you get cost-per-install per
 *   keyword and never cost-per-subscriber per keyword. Toggling the Apple Ads
 *   integration on in the RevenueCat dashboard does nothing on its own.
 *
 *   `setAppsflyerID()`: without it, RevenueCat silently drops every revenue
 *   event it would have forwarded to AppsFlyer. See lib/analytics.ts note 1.
 */
async function configure(): Promise<void> {
  if (configured || !Purchases) return;
  configured = true;

  try {
    if (__DEV__) {
      // Verbose logging is how you verify the two calls above actually landed:
      // RevenueCat prints the synced subscriber attributes, and seeing
      // `$appsflyerId` there with a real value is the single line that proves
      // the whole attribution pipe works. It works even with ATT denied.
      Purchases.setLogLevel('DEBUG' as Parameters<typeof Purchases.setLogLevel>[0]);
    }

    Purchases.configure({ apiKey: REVENUECAT_KEY });

    if (Platform.OS === 'ios') {
      Purchases.enableAdServicesAttributionTokenCollection();
    }

    // Fire-and-forget: getAppsFlyerUID() waits out AppsFlyer's init, which can
    // sit behind the ATT prompt for up to 60s. Blocking startup on an
    // attribution detail would be the wrong trade. The attribute persists on
    // the RevenueCat user once set.
    getAppsFlyerUID()
      .then((uid) => (uid ? Purchases.setAppsflyerID(uid) : undefined))
      .catch((e) => __DEV__ && console.warn('[sub] setAppsflyerID failed:', e));

    // Push entitlement changes into our state as they happen: a purchase made
    // on another device, a renewal, a cancellation, a Family Sharing grant.
    Purchases.addCustomerInfoUpdateListener((info) => {
      applyCustomerInfo(info).catch(() => undefined);
    });
  } catch (e) {
    if (__DEV__) console.warn('[sub] configure failed:', e);
  }
}

// ── Reading entitlement state ─────────────────────────────────────────────────
async function applyCustomerInfo(info: CustomerInfo): Promise<Tier> {
  const active = Boolean(info?.entitlements?.active?.[RC_ENTITLEMENT]);
  const tier = await resolveTier(active);
  await storage.set(KEY_CACHED, tier);
  setTier(tier);
  return tier;
}

/** Applies the dev override on top of RevenueCat's answer. */
async function resolveTier(rcActive: boolean): Promise<Tier> {
  const override = await storage.get<Tier>(KEY_OVERRIDE);
  if (__DEV__ && override === 'free') return 'free'; // force-lock wins over everything
  if (override === 'pro' && (__DEV__ || !RC_ACTIVE)) return 'pro';
  return rcActive ? 'pro' : 'free';
}

/**
 * Load the cached tier, then refresh from RevenueCat.
 *
 * Call once at startup. The cached read resolves in milliseconds so the first
 * frame is correct; the network refresh corrects it a moment later. Never
 * blocks rendering.
 */
export async function initSubscription(): Promise<Tier> {
  const cached = await storage.get<Tier>(KEY_CACHED);
  if (cached) setTier(cached);

  await refreshSubscription();
  return cachedTier;
}

/** Re-read entitlement state from RevenueCat. Cheap: the SDK caches. */
export async function refreshSubscription(): Promise<Tier> {
  if (!Purchases) {
    const tier = await resolveTier(false);
    setTier(tier);
    return tier;
  }
  try {
    await configure();
    return await applyCustomerInfo(await Purchases.getCustomerInfo());
  } catch (e) {
    if (__DEV__) console.warn('[sub] refresh failed:', e);
    return cachedTier; // keep the last known good state
  }
}

/** Synchronous read of the last known tier. */
export function getTier(): Tier {
  return cachedTier;
}

/** Synchronous entitlement check. Use this to gate features. */
export function isPro(): boolean {
  return cachedTier === 'pro';
}

// ── Offerings (what the paywall renders) ─────────────────────────────────────
export type Plan = {
  /** RevenueCat package identifier, pass back to `purchase()`. */
  id: string;
  /** Localised price string, already formatted for the user's store front. */
  price: string;
  /** Raw price for analytics. */
  amount: number;
  currency: string;
  /** 'MONTHLY' | 'ANNUAL' | 'LIFETIME' | … */
  period: string;
  title: string;
  description: string;
  /** Free-trial length in days, 0 when there's no introductory offer. */
  trialDays: number;
  /** The underlying RC object, needed by `purchase()`. */
  raw: PurchasesPackage;
};

/**
 * Fetch the current offering's packages.
 *
 * Returns `[]` when RevenueCat isn't configured, which is what lets the paywall
 * fall back to hardcoded placeholder copy in development.
 *
 * Always render the price string RevenueCat gives you (`plan.price`) rather
 * than one you hardcode. It arrives already localised and currency-correct for
 * the user's store front, and hardcoded prices are how apps end up showing "$9.99"
 * to someone whose store will charge them ¥1,500.
 */
export async function getPlans(): Promise<Plan[]> {
  if (!Purchases) return [];
  try {
    await configure();
    const offerings = await Purchases.getOfferings();
    const offering = RC_OFFERING ? offerings.all[RC_OFFERING] : offerings.current;
    if (!offering) {
      if (__DEV__) {
        console.warn(
          `[sub] no offering found${RC_OFFERING ? ` named "${RC_OFFERING}"` : ' marked current'}. ` +
            'Check RevenueCat → Offerings.',
        );
      }
      return [];
    }

    return offering.availablePackages.map((pkg) => {
      const product = pkg.product;
      const intro = product.introPrice;
      return {
        id: pkg.identifier,
        price: product.priceString,
        amount: product.price,
        currency: product.currencyCode,
        period: pkg.packageType,
        title: product.title,
        description: product.description,
        trialDays: intro && intro.price === 0 ? introPeriodInDays(intro) : 0,
        raw: pkg,
      };
    });
  } catch (e) {
    if (__DEV__) console.warn('[sub] getOfferings failed:', e);
    return [];
  }
}

function introPeriodInDays(intro: { periodUnit: string; periodNumberOfUnits: number }): number {
  const n = intro.periodNumberOfUnits;
  switch (intro.periodUnit) {
    case 'DAY':
      return n;
    case 'WEEK':
      return n * 7;
    case 'MONTH':
      return n * 30;
    case 'YEAR':
      return n * 365;
    default:
      return 0;
  }
}

// ── Purchase / restore ────────────────────────────────────────────────────────
export type PurchaseResult =
  | { status: 'success'; tier: Tier }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

/**
 * Buy a plan.
 *
 * User cancellation is reported as `'cancelled'`, not as an error, showing an
 * error alert to someone who deliberately tapped "Cancel" is a small thing that
 * reliably annoys people.
 *
 * With no RevenueCat key, this flips the local dev override so the whole flow
 * stays testable before App Store Connect exists.
 */
export async function purchase(plan?: Plan): Promise<PurchaseResult> {
  if (!Purchases || !plan) {
    if (__DEV__) {
      await storage.set(KEY_OVERRIDE, 'pro');
      setTier('pro');
      console.log('[sub] no RevenueCat key, granted local dev unlock');
      return { status: 'success', tier: 'pro' };
    }
    return { status: 'error', message: 'Purchases are unavailable right now.' };
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(plan.raw);
    const tier = await applyCustomerInfo(customerInfo);

    // Report to analytics only on a real entitlement grant, so a purchase that
    // somehow fails to entitle doesn't inflate the revenue numbers.
    if (tier === 'pro') {
      const params = {
        amount: plan.amount,
        currency: plan.currency,
        productId: plan.raw.product.identifier,
        plan: plan.period.toLowerCase(),
      };
      if (plan.trialDays > 0) trackTrialStart(params);
      else trackPurchase(params);
    }

    return { status: 'success', tier };
  } catch (e: any) {
    if (e?.userCancelled) return { status: 'cancelled' };
    if (__DEV__) console.warn('[sub] purchase failed:', e);
    return {
      status: 'error',
      message: e?.message ?? 'Something went wrong. Please try again.',
    };
  }
}

/**
 * Restore purchases.
 *
 * Apple requires a visible restore control anywhere you sell a subscription,
 * a missing one is a routine App Review rejection (guideline 3.1.1). Keep the
 * button on the paywall even if you also put one in Settings.
 */
export async function restore(): Promise<PurchaseResult> {
  if (!Purchases) {
    if (__DEV__) {
      const override = await storage.get<Tier>(KEY_OVERRIDE);
      return override === 'pro'
        ? { status: 'success', tier: 'pro' }
        : { status: 'error', message: 'Nothing to restore.' };
    }
    return { status: 'error', message: 'Purchases are unavailable right now.' };
  }

  try {
    await configure();
    const tier = await applyCustomerInfo(await Purchases.restorePurchases());
    return tier === 'pro'
      ? { status: 'success', tier }
      : { status: 'error', message: 'No previous purchases found for this Apple ID.' };
  } catch (e: any) {
    return { status: 'error', message: e?.message ?? 'Restore failed.' };
  }
}

/** Dev-only: force a tier, or pass `null` to hand control back to RevenueCat. */
export async function setDevOverride(tier: Tier | null): Promise<void> {
  if (!__DEV__) return;
  if (tier) await storage.set(KEY_OVERRIDE, tier);
  else await storage.remove(KEY_OVERRIDE);
  await refreshSubscription();
}

/**
 * Link purchases to your own user id, so one account's subscription follows
 * them across devices and platforms. Only call this if you have real accounts,
 * with anonymous users, RevenueCat's own id is already the right identity.
 */
export async function loginUser(appUserId: string): Promise<void> {
  if (!Purchases) return;
  try {
    await configure();
    const { customerInfo } = await Purchases.logIn(appUserId);
    await applyCustomerInfo(customerInfo);
  } catch (e) {
    if (__DEV__) console.warn('[sub] logIn failed:', e);
  }
}

/** Detach from the current user id. Call on logout. */
export async function logoutUser(): Promise<void> {
  if (!Purchases) return;
  try {
    await applyCustomerInfo(await Purchases.logOut());
  } catch (e) {
    if (__DEV__) console.warn('[sub] logOut failed:', e);
  }
}

// ── React binding ─────────────────────────────────────────────────────────────
/**
 * Subscribe a component to entitlement changes.
 *
 * @example
 *   const { isPro } = useSubscription();
 *   if (!isPro) return <UpgradePrompt />;
 *
 * ── Why `useSyncExternalStore` and not `useState` + `useEffect` ─────────────
 * The tier lives outside React. RevenueCat's listener can change it at any
 * moment, including between a render and the effect that would have subscribed.
 * The useState/useEffect version silently misses that window and renders a stale
 * tier, which here means briefly showing a paywall to someone who just paid.
 *
 * `useSyncExternalStore` is built for exactly this shape: it reads the current
 * value during render and guarantees no update is lost between subscribing and
 * reading. It also keeps every subscribed component consistent within a single
 * render pass, so two components can't disagree about whether the user is Pro.
 */
export function useSubscription(): { tier: Tier; isPro: boolean } {
  const tier = useSyncExternalStore(subscribeToTier, getTier, getTier);
  return { tier, isPro: tier === 'pro' };
}

function subscribeToTier(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}
