# AppsFlyer: ad attribution

**Files:** `lib/analytics.ts`, `lib/tracking.ts`, `constants/skadnetwork.ts`
**Env:** `EXPO_PUBLIC_APPSFLYER_DEV_KEY`, `EXPO_PUBLIC_APPLE_APP_ID`
**Cost:** free up to 12k conversions/month, then paid.

> Before your first paid campaign, read **[docs/launch-checklist.md](./launch-checklist.md)**. The code in this repo is the easy half. The dashboard toggles in that checklist are where attribution actually breaks, and every one of them fails silently.

---

## Why use it

**Only if you spend money on ads.** If all your installs are organic, skip this entirely: it adds a native dependency and buys you nothing.

If you do run ads, the question you need answered is _"which campaign, ad set, and creative produced people who pay?"_ Nothing on the device knows that. The App Store install is a black box: a user taps an ad in TikTok, gets handed to the App Store, installs, and opens your app with no memory of where they came from.

A Mobile Measurement Partner is the piece that reconstructs the link. AppsFlyer receives an install postback from Apple (SKAdNetwork) and its own probabilistic match, joins them to the click, and tells the ad network "this install came from you" so the network can optimise. It's the same job for Meta, TikTok, Google and Apple Search Ads: one integration instead of four.

### Alternatives

|               | Notes                                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| **AppsFlyer** | Best free tier, best partner coverage. What this starter wires.                                                   |
| **Adjust**    | Comparable. No free tier.                                                                                         |
| **Singular**  | Strong on cost aggregation across networks.                                                                       |
| **Branch**    | Deep linking first, attribution second. Pick it if links matter more than ads.                                    |
| **None**      | Perfectly reasonable with no paid acquisition. SKAdNetwork alone still gives ad networks a coarse install signal. |

---

## Setup

1. Sign up at [appsflyer.com](https://www.appsflyer.com) and add your app (needs the App Store URL: an unreleased app can be added by bundle ID).
2. **Settings → App settings → Dev key**: one key per _account_, shared by all your apps.
3. ```bash
   # .env
   EXPO_PUBLIC_APPSFLYER_DEV_KEY=your_dev_key
   EXPO_PUBLIC_APPLE_APP_ID=1234567890   # digits from your App Store URL
   ```
4. `npx expo prebuild --clean && npx expo run:ios`

**Then go do [docs/launch-checklist.md](./launch-checklist.md).** The single most common outcome of "I set up AppsFlyer" is a perfectly configured SDK sending events into a pipe that a dashboard default has switched off.

---

## Using it

Everything goes through `track()`, which fans out to PostHog _and_ AppsFlyer:

```ts
import { track, EVENT } from '@/lib/analytics';

track('feature_used', { feature: 'export' }); // custom. PostHog + AppsFlyer
track(EVENT.TUTORIAL_COMPLETION); // standard AppsFlyer name
```

### Use the standard event names

`EVENT` in `lib/analytics.ts` holds AppsFlyer's standard vocabulary (`af_tutorial_completion`, `af_content_view`, `af_purchase`, …). Meta and TikTok recognise these natively, so they can optimise toward them with **no mapping work on your side**. Invent your own names and you inherit a mapping chore in three dashboards, forever.

Product-analytics-only events don't need to be in `EVENT`, pass any string.

---

## Three things that are easy to get wrong

### 1. Never send revenue events from the client

RevenueCat already sends server-verified `af_start_trial` and `af_purchase` to AppsFlyer. **AppsFlyer does not de-duplicate SDK events against server-to-server events.** Send them from both and every purchase counts twice, its revenue counts twice, and your cost-per-paying-user reads at half its real value: the exact number you scale ad spend on.

`track()` enforces this: events in `RC_FORWARDED_EVENTS` go to PostHog only. Use `trackPurchase()` / `trackTrialStart()` and let it handle the split.

### 2. SKAdNetwork conversion values are client-only

Server-side events can never set a SKAN conversion value. Without on-device events, every SKAN postback your app produces says "install" and nothing more, so iOS campaigns have no trial or purchase signal to optimise toward, which is most of the value of running them.

`logSKANConversion()` sends deliberately-distinct `af_skan_trial` / `af_skan_purchase` events for this. Map those **only** in SKAN Conversion Studio, never in a partner postback mapping, reusing the standard names there recreates problem #1.

### 3. `af_app_opened` is Meta's entire install signal

Meta's AppsFlyer integration has **no install postback**. Mapped in-app events are its only inbound signal, and `af_app_opened` → `fb_mobile_activate_app` is the one that fires for every user. Without it, Meta's "Last iOS Install" goes stale and app-install campaigns fail validation with error `#1815437`, whose message, "application_id needs to be valid", points at completely the wrong thing.

`initAnalytics()` fires it on every launch. Don't remove it.

---

## SKAdNetwork

`constants/skadnetwork-ids.json` holds 153 advertiser IDs, injected into `Info.plist` by `app.config.ts`.

An ad network can only be credited with an install if its ID is in **your** Info.plist at the moment the ad is shown. The list is baked into the binary, add a network later and you need a new build, a new submission, and a review cycle before that channel can attribute anything. Including a network you never use costs nothing. So ship them all, before your first submission, even with no plans to advertise.

`app.config.ts` also sets `NSAdvertisingAttributionReportEndpoint` (when an AppsFlyer key is present), which tells iOS to send AppsFlyer a copy of every SKAN postback. Without it Apple posts only to the ad network, and AppsFlyer's SKAN dashboards stay empty forever with no error to explain why.

---

## App Tracking Transparency

See the header of `lib/tracking.ts` for the full reasoning. The short version:

- ATT gates **only** the IDFA. AppsFlyer, PostHog, RevenueCat, SKAdNetwork and your ads all work without it.
- Saying yes buys deterministic user-level attribution. Saying no leaves you SKAdNetwork plus probabilistic matching, enough to optimise campaigns, not enough to reconcile individual users.
- Opt-in rates run ~20–40%.
- **Don't show the prompt unless you spend on ads.**
- If you do show it, show it **early**: AppsFlyer holds its install postback up to 60s waiting on the answer, and a prompt after onboarding plus a paywall routinely blows past that window, wasting the "yes" you worked for.
- `NSUserTrackingUsageDescription` must describe a benefit to the _user_. Generic wording is a routine rejection. Edit `ATT_REASON` in `app.config.ts`.

Enable with `EXPO_PUBLIC_ATT_ENABLED=true`, then `npx expo prebuild --clean`.

---

## Verifying it works

1. **Growth tab → Fetch AppsFlyer ID.** A value means the SDK initialised.
2. **AppsFlyer dashboard → Overview.** Installs appear within an hour or so.
3. **A fresh install on a device that has never had the app.** AppsFlyer dedupes per device, so reinstalls don't produce a new install event: the same Apple ID on a different device is fine.

If the dashboard is empty but the ID resolves, the problem is almost always in [docs/launch-checklist.md](./launch-checklist.md), not in your code.

---

## Removing AppsFlyer

1. In `lib/analytics.ts`, delete the `appsFlyer` import and every reference (`initAnalytics`, `getAppsFlyerUID`, `logToAppsFlyer`, `logSKANConversion`). Keep `track()`. PostHog still uses it.
2. Remove `getAppsFlyerUID()` / `setAppsflyerID()` from `configure()` in `lib/subscription.ts`.
3. Remove the `react-native-appsflyer` case from `requireByName()` in `lib/native.ts`.
4. Remove `NSAdvertisingAttributionReportEndpoint` from `app.config.ts`.
5. `npm uninstall react-native-appsflyer`
6. `npx expo prebuild --clean`

**Keep `constants/skadnetwork-ids.json`.** It costs nothing and you cannot add it retroactively without a new submission.
