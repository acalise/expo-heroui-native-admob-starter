# Google AdMob: ads

**Files:** `lib/ads.ts`, `components/BannerAd.tsx`
**Env:** `EXPO_PUBLIC_ADS_ENABLED`, `EXPO_PUBLIC_ADMOB_IOS_APP_ID`, `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`
**Default:** off.

---

## Should you use ads at all?

Usually the honest answer is _not as your primary model_. For most consumer apps, a subscriber is worth 10–100× an ad-supported user. Rough numbers for a US audience:

|                | Revenue per user    |
| -------------- | ------------------- |
| Banner ad      | ~$0.02–0.20 / month |
| Interstitial   | ~$0.05–0.50 / month |
| Rewarded video | ~$0.10–1.00 / month |
| Subscription   | $3–100 / year       |

Ads make sense when:

- **You have real volume**: tens of thousands of DAU makes small numbers add up.
- **Nobody will pay for the use case**: utilities, casual games, one-off tools.
- **They're the free tier under a subscription.** This is the shape this starter wires up: `adsAllowed()` returns `false` for subscribers, so "remove ads" becomes a real benefit on the paywall at no extra work.

That last one is the most common good reason. Ads then serve two purposes: a little revenue from free users, and a visible reason to upgrade.

---

## Setup

### 1. Enable

```bash
# .env
EXPO_PUBLIC_ADS_ENABLED=true
```

Google's official **test** ad unit IDs are already wired in, so ads work immediately without an AdMob account.

```bash
npx expo prebuild --clean
npx expo run:ios
```

Native build required: the AdMob SDK doesn't exist in Expo Go.

### 2. Real IDs (only when you're ready to ship)

1. Create an app at [admob.google.com](https://admob.google.com).
2. **App settings → App ID**: the `~` one (`ca-app-pub-XXXX~YYYY`).
3. Create ad units. Each gives you a `/` unit ID (`ca-app-pub-XXXX/ZZZZ`). Separate units per platform _and_ per format: a banner ID in an interstitial slot fails to fill with an unhelpful error.

```bash
# .env
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-XXXX~YYYY
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-XXXX~YYYY
```

Then replace the unit IDs in `lib/ads.ts`.

> ⚠️ **Never load real ads against your own units in development.** Google calls that invalid traffic and bans accounts for it, not a warning, a ban, with unpaid earnings forfeited. Keep the test IDs until you ship, and add your device as a test device in the AdMob console if you need to check real units.

---

## Using it

```tsx
import { BannerAd } from '@/components/BannerAd';

<BannerAd />                    // adaptive width (better fill + revenue)
<BannerAd size="fixed" />       // classic 320×50
```

Safe to leave anywhere: it collapses to zero height when ads are off, when the SDK isn't linked, when the user subscribes, or when an ad fails to fill. The layout is identical for paying users.

```ts
import { loadInterstitial, showInterstitial, showRewarded } from '@/lib/ads';

await loadInterstitial(); // pre-load at a calm moment
await showInterstitial(); // show at a natural break

const earned = await showRewarded();
if (earned) grantReward(); // ONLY on true
```

### One question, one place

Every ad site should ask `adsAllowed()` rather than checking `ADS_ENABLED` directly. It folds in the SDK check, the platform check and the subscriber check, so the one banner someone forgot to gate can't show up in a paying customer's screenshot.

---

## Placement, which is most of the job

**Interstitials** are where apps earn one-star reviews. Rules that keep you out of trouble:

- At natural breaks only, level complete, task saved, article finished.
- Never on app open, never mid-task, never during onboarding. Apple rejects ads shown before the user has done anything.
- Frequency-cap them. Google's own guidance is no more than one per few minutes; users are less generous than that.
- Pre-load. They take seconds to fetch, so requesting one at the moment you want to show it means either a frozen UI or an ad that never appears.

**Rewarded** is the highest-value format and the only one users generally like, because it's an explicit trade. Grant the reward on `EARNED_REWARD` only, `CLOSED` fires whether or not they watched.

**Banners** are the least intrusive and the least lucrative. Anchor them at the bottom, out of the way of anything tappable.

---

## Privacy and consent

### iOS

- **ATT**: see `lib/tracking.ts` and [appsflyer.md](./appsflyer.md). Without tracking permission you serve non-personalised ads, which pay less but work fine.
- **Init order matters.** `initAds()` runs _after_ the ATT decision in `app/_layout.tsx`. The Mobile Ads SDK reads the tracking status when it initialises; start it first and you're locked into non-personalised ads for the whole session.

### EEA / UK

Google's own policy requires a consent message before serving ads there. Use Google's UMP SDK:

```bash
npx expo install react-native-google-mobile-ads
```

It bundles UMP, see the [consent docs](https://developers.google.com/admob/react-native/privacy). Not wired up here because it needs a message you configure in the AdMob console for your specific app. **Do it before serving ads in Europe.**

### App Store privacy labels

Ads mean you collect data for tracking. Declare it in App Store Connect → App Privacy, at minimum _Identifiers → Device ID_ under "Used for tracking". Getting this wrong is a rejection and, if it ships, a policy problem.

---

## Removing ads entirely

1. Delete `lib/ads.ts` and `components/BannerAd.tsx`.
2. Remove `<BannerAd />` from `app/(tabs)/index.tsx`.
3. Remove the AdMob card from `app/(tabs)/growth.tsx`.
4. Remove the `initAds()` import and call from `app/_layout.tsx`.
5. Remove the `react-native-google-mobile-ads` case from `requireByName()` in `lib/native.ts`.
6. Remove the AdMob plugin block from `app.config.ts`.
7. `npm uninstall react-native-google-mobile-ads`
8. `npx expo prebuild --clean`

Removing ads also removes one reason to subscribe, if "no ads" was on your paywall's benefit list in `app/paywall.tsx`, take it off.
