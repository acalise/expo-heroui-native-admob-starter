# RevenueCat: subscriptions

**Files:** `lib/subscription.ts`, `app/paywall.tsx`
**Env:** `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`, `EXPO_PUBLIC_RC_ENTITLEMENT`, `EXPO_PUBLIC_RC_OFFERING`
**Cost:** free under $2.5k/month tracked revenue, then a percentage. Free tier is generous enough that most apps never pay.

---

## Why use it

You can ship in-app purchases with StoreKit 2 and Play Billing directly. Here's what you take on if you do:

- **Receipt validation.** Apple's `verifyReceipt` has separate sandbox and production endpoints, and you have to try one and fall back to the other. Get it wrong and TestFlight users appear unsubscribed.
- **A server.** Local receipt validation is trivially bypassed. Real validation needs a backend you now operate.
- **Renewal webhooks.** Subscriptions renew, lapse, enter billing retry, get refunded, get upgraded mid-period, and get shared through Family Sharing. Each is a different state your app has to understand.
- **Restore across devices and reinstalls.** Required by App Review, and the reviewer _will_ test it on a clean device.
- **All of it again for Google Play**, with an entirely different API and a different set of edge cases.

That's weeks of work whose failure mode is "a paying customer loses access", and no user can see any of it. RevenueCat replaces the lot with `getCustomerInfo()`.

**The reason that actually matters for this starter:** RevenueCat is the join point between purchases and ad spend. Its AppsFlyer and Apple Search Ads integrations are what let you measure _cost per paying subscriber_ rather than cost per install. For a subscription app, a cheap install that never converts is worth nothing, so cost-per-install is a number that can point you confidently in the wrong direction.

### When not to use it

- One-time non-consumable purchases with no renewal (a "remove ads" unlock). StoreKit alone is genuinely fine.
- You already run subscription infrastructure for a web product.
- You're at a revenue scale where the percentage exceeds the cost of owning it. You'll know.

---

## Setup

### 1. Dashboard

1. Create a project at [app.revenuecat.com](https://app.revenuecat.com).
2. **Apps** → add an iOS app. It needs your bundle ID and an App Store Connect **In-App Purchase Key** (App Store Connect → Users and Access → Integrations → In-App Purchase). Without that key RevenueCat can't validate receipts server-side.
3. **Products** → add the product identifiers you created in App Store Connect.
4. **Entitlements** → create one called `pro` and attach every product to it.
5. **Offerings** → create one, mark it **current**, and add packages (Monthly, Annual, …).

### 2. Keys

Project → **API keys** → copy the **public SDK key** (`appl_…`).

```bash
# .env
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxx
EXPO_PUBLIC_RC_ENTITLEMENT=pro
```

Then rebuild, env vars are inlined at build time, so a restart isn't enough:

```bash
npx expo start -c
```

### 3. Sandbox testing

Create a **Sandbox Apple ID** in App Store Connect → Users and Access → Sandbox. Sign into it on the device under _Settings → Developer → Sandbox Apple Account_, **not** the main App Store account, which will silently charge you real money.

Sandbox subscriptions renew on a compressed clock: a 1-month subscription renews every 5 minutes and auto-cancels after 6 renewals. Useful for testing renewals; confusing if you don't expect it.

---

## Using it

```ts
import { useSubscription } from '@/lib/subscription';

function Feature() {
  const { isPro } = useSubscription();
  if (!isPro) return <UpgradePrompt />;
  return <TheRealThing />;
}
```

Outside React:

```ts
import { isPro, refreshSubscription } from '@/lib/subscription';

if (isPro()) {
  /* … */
}
await refreshSubscription(); // force a re-read
```

Show the paywall:

```ts
router.push('/paywall');
```

### Check entitlements, never product IDs

```ts
if (isPro()) { … }                                    // ✅
if (productId === 'com.app.annual') { … }             // ❌
```

Entitlements are the indirection that lets you add a lifetime tier, run a regional price test, or grandfather old subscribers: all from the dashboard, with no app release. Product-ID checks force a release for each of those, and they get out of sync the moment a second product exists.

---

## Development without a key

With no RevenueCat key set, everything still runs:

- `getPlans()` returns `[]`, and the paywall shows a short explainer instead of plans.
- `purchase()` grants a **local dev unlock** so you can design and test everything behind the paywall before App Store Connect exists.
- Settings → Developer has **Force Pro** / **Force Free** / **Clear** buttons.

`Force Free` deliberately overrides a _real_ entitlement, so you can check the free experience without cancelling a sandbox subscription. Both overrides are ignored outside `__DEV__`: a release build always trusts RevenueCat.

---

## Two calls that fail silently if you skip them

Both are in `configure()` in `lib/subscription.ts`. Neither produces an error, and the dashboard reports "Active" in both broken cases.

### `enableAdServicesAttributionTokenCollection()`

Sends Apple's AdServices token to RevenueCat, which is what maps Apple Search Ads conversions to actual subscribers **per keyword**. Turning on the Apple Ads integration in the RevenueCat dashboard does nothing without this call, you'll get cost-per-install per keyword and never cost-per-subscriber.

### `setAppsflyerID()`

RevenueCat keys every event it forwards to AppsFlyer on the `$appsflyerId` subscriber attribute. Leave it unset and RevenueCat drops **all** of those revenue events. Installs keep attributing normally (that's AppsFlyer's own SDK), which is exactly what hides the gap: the funnel looks alive right up to the events you actually care about.

**How to verify both.** Run a debug build and watch the logs. RevenueCat prints its synced subscriber attributes. Seeing `$appsflyerId` with a real value is the single line that proves the pipe works. It works even with ATT denied.

---

## Paywall rules App Review enforces

`app/paywall.tsx` handles all four. Keep them if you rewrite the layout.

| #   | Requirement                                                | Guideline     |
| --- | ---------------------------------------------------------- | ------------- |
| 1   | Visible **Restore Purchases** control                      | 3.1.1         |
| 2   | Visible way to **dismiss** the screen                      | 3.1.2         |
| 3   | **Price, period and renewal terms** next to the buy button | 3.1.2         |
| 4   | Working **Terms** and **Privacy Policy** links             | 3.1.2 / 5.1.1 |

Also required in App Store Connect itself: a subscription **group display name**, and the same Terms/Privacy URLs on the app listing.

Replace the placeholder URLs at the top of `app/paywall.tsx` before submitting.

---

## Displaying prices

Always render `plan.price`: the localised string RevenueCat returns:

```ts
<AppText>{plan.price}</AppText>        // "$29.99", "¥3,000", "R$ 149,90"
```

Never hardcode. A hardcoded "$29.99" shown to a user whose store will charge ¥4,500 is both a bad experience and, if it's on the paywall, a rejection.

---

## Optional: RevenueCat's hosted paywalls

`react-native-purchases-ui` renders paywalls you design in the RevenueCat dashboard, so you can change layout, copy and pricing without an app release. That's worth a lot once you're iterating on conversion.

```bash
npx expo install react-native-purchases-ui
```

```tsx
import RevenueCatUI from 'react-native-purchases-ui';

export default function PaywallScreen() {
  return <RevenueCatUI.Paywall onDismiss={() => router.back()} />;
}
```

This starter ships the hand-built version instead, because a starter's paywall should be readable, `app/paywall.tsx` shows the whole flow (fetch offerings → render → buy → handle cancel → close) in plain components. Once that's clear, swapping in the hosted version is the five lines above.

---

## Removing RevenueCat

1. Delete `lib/subscription.ts` and `app/paywall.tsx`.
2. Remove the `paywall` entry from the `Stack` in `app/_layout.tsx`, and the `initSubscription()` call.
3. Remove `useSubscription` / `isPro` usage from `app/(tabs)/profile.tsx`, `settings.tsx`, `growth.tsx`, and `lib/ads.ts` (`adsAllowed()` calls `isPro()`).
4. Remove the `react-native-purchases` case from `requireByName()` in `lib/native.ts`.
5. `npm uninstall react-native-purchases`
6. `npx expo prebuild --clean`
