# expo-heroui-native-admob-starter

> An Expo starter with the boring, load-bearing parts already done: theming that doesn't drift, a paywall that passes App Review, subscriptions, attribution, analytics, and ads. **Every integration is optional and inert until you add a key.**

Clone it, run it, change the accent color, ship.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61dafb?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org)

---

## Why this exists

Most starters give you navigation, a theme toggle and a component showcase, then stop exactly where the tedious work begins. The parts that actually take a week and are easy to get subtly wrong are:

- a **paywall** that satisfies the four things App Review checks for,
- **subscription state** that survives reinstalls, cold starts and offline launches,
- **attribution** wired so ad spend can be judged against revenue rather than installs,
- **analytics** that answers _where people give up_,
- and a **theme** that doesn't drift out of sync the first time you change a color.

Those are here, working, with the reasoning written down in the files themselves. So is a [launch checklist](./docs/launch-checklist.md) of the dashboard settings that silently break attribution, none of which live in code, and all of which cost real money to discover late.

**Everything is optional.** With an empty `.env`, purchases grant a local dev unlock, analytics and attribution no-op, ads stay off, and the app runs end to end. Add a key to switch a service on. No feature flags to hunt for, no code to uncomment.

---

## Quick start

```bash
git clone https://github.com/acalise/expo-heroui-native-admob-starter.git my-app
cd my-app
npm install
cp .env.example .env

npx expo run:ios       # or: npx expo run:android
```

Requires Xcode (iOS) or Android Studio. **A native build is required**: RevenueCat, AppsFlyer and AdMob are native modules that don't exist in Expo Go.

You can still use Expo Go for UI work (`npm run start:go`): the whole interface runs, with those three inert. See [`lib/native.ts`](./lib/native.ts) for how that's done.

---

## What's in the box

### Foundation

- **Expo SDK 57** · React Native 0.86 · React 19.2 · New Architecture
- **expo-router** file-based routing with typed routes
- **HeroUI Native 1.0** with 40+ components: Button, Card, Input, Select, Switch, Slider, Tabs, Accordion, Dialog, BottomSheet, Menu, Popover, Toast, Skeleton, …
- **Uniwind + Tailwind v4**: `className` styling for React Native
- **TypeScript strict** with `@/` path aliases, ESLint and Prettier configured

### Theming that stays in sync

- **One file, one color.** Change `--accent` in [`theme.css`](./theme.css) and everything updates: components, tab bar, status bar, both color schemes.
- No duplicated palette object. The few places that need a JS color read the same CSS variables at runtime.
- **Light / dark / system** as three real choices, persisted, with no flash on launch.

### Monetisation

- **RevenueCat**: entitlement-based subscriptions, cached for offline, cross-device sync, restore, dev overrides
- **A real paywall** (`app/paywall.tsx`) with the four App Review requirements handled and explained
- **Google AdMob**: banner / interstitial / rewarded, automatically suppressed for subscribers

### Growth

- **PostHog**: product analytics, one `track()` call, funnel-ready event naming
- **AppsFlyer**: ad attribution wired to avoid the three silent double-counting and dropped-event traps
- **153 SKAdNetwork IDs** pre-loaded (you cannot add these retroactively without a new submission)
- **App Tracking Transparency**, off by default, with the trade-off documented
- **Rating prompts** timed against Apple's invisible three-per-year cap

### Screens

- 3-step **onboarding** with per-step funnel events and a properly-placed permission ask
- 4 tabs: component showcase · integration status dashboard · profile layout · settings
- A **Growth tab** that tells you, live, which integrations are actually wired in _this_ build, because the failure mode for all of them is silence

---

## Documentation

|                                                    |                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [**Theming**](./docs/theming.md)                   | How one CSS file drives everything; adding brand themes and fonts                           |
| [**RevenueCat**](./docs/revenuecat.md)             | Why not raw StoreKit; setup; the two calls that fail silently; paywall rules                |
| [**AppsFlyer**](./docs/appsflyer.md)               | Whether you need an MMP at all; SKAdNetwork; the double-counting traps                      |
| [**PostHog**](./docs/posthog.md)                   | Event naming that survives six months; replay; feature flags                                |
| [**AdMob**](./docs/admob.md)                       | Whether ads are worth it; placement; consent; removal                                       |
| [**Launch checklist**](./docs/launch-checklist.md) | ⚠️ The dashboard settings that silently break attribution. Read before your first campaign. |
| [**iOS widgets**](./docs/widget-guide.md)          | Adding a home-screen widget                                                                 |

Every `lib/` file also carries a header explaining _why_ it's built the way it is. Those headers are the real documentation: the docs above are the setup steps.

---

## Configuration

Everything is driven by `.env`. See [`.env.example`](./.env.example) for the annotated list and [`constants/config.ts`](./constants/config.ts) for how it's read.

| Variable                         | Turns on                                     |
| -------------------------------- | -------------------------------------------- |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | Real purchases (otherwise: local dev unlock) |
| `EXPO_PUBLIC_POSTHOG_KEY`        | Product analytics                            |
| `EXPO_PUBLIC_APPSFLYER_DEV_KEY`  | Ad attribution + the SKAN report endpoint    |
| `EXPO_PUBLIC_ADS_ENABLED=true`   | Ads (Google's test unit IDs are pre-wired)   |
| `EXPO_PUBLIC_ATT_ENABLED=true`   | Apple's tracking prompt                      |

> `EXPO_PUBLIC_*` values are **inlined into the app bundle** and readable by anyone who downloads your app. Every key above is a publishable client key, which is why they can live there. Never put a RevenueCat _secret_ key or a PostHog _personal_ API key in `.env`.
>
> Env values are baked in at bundle time, restart with `npx expo start -c` after editing.

---

## Project structure

```
├── app/                      # expo-router screens
│   ├── _layout.tsx           # providers + SDK bootstrap (the ordering matters, see the file)
│   ├── onboarding.tsx        # 3-step paged flow with funnel events
│   ├── paywall.tsx           # subscription screen, App Review compliant
│   └── (tabs)/               # components · growth · profile · settings
│
├── components/
│   ├── AppText.tsx           # Text + a font-scaling cap
│   ├── BannerAd.tsx          # collapses to nothing when ads are off or user pays
│   ├── Icons.tsx             # inline SVG, className-aware, no icon font
│   ├── OnboardingDots.tsx
│   ├── Screen.tsx            # safe-area container (className can't reach SafeAreaView)
│   ├── ScreenHeader.tsx
│   └── SectionLabel.tsx
│
├── constants/
│   ├── config.ts             # every env var, read once, typed
│   ├── skadnetwork.ts        # 153 SKAdNetwork IDs + why they're all there
│   └── skadnetwork-ids.json
│
├── context/ThemeContext.tsx  # light/dark/system, persisted
├── hooks/useAppTheme.ts      # CSS variables → JS colors
│
├── lib/
│   ├── ads.ts                # AdMob, gated on subscription
│   ├── analytics.ts          # PostHog + AppsFlyer behind one track()
│   ├── subscription.ts       # RevenueCat entitlements
│   ├── native.ts             # load native modules without crashing Expo Go
│   ├── tracking.ts           # ATT
│   ├── review.ts             # rating prompts, timed properly
│   ├── notifications.ts      # local notifications
│   ├── haptics.ts            # semantic haptic feedback
│   └── storage.ts            # typed AsyncStorage
│
├── theme.css                 # ← the file you edit to rebrand
├── global.css                # CSS entry point
├── app.json                  # static Expo config
├── app.config.ts             # dynamic config: SKAdNetwork, conditional plugins
└── scripts/                  # postinstall workaround (see Troubleshooting)
```

---

## Common tasks

**Rebrand.** Change `--accent` and `--accent-foreground` in `theme.css`. That's it. ([details](./docs/theming.md))

**Add a tab.** Create `app/(tabs)/thing.tsx`, add a `<Tabs.Screen name="thing">` in `app/(tabs)/_layout.tsx`.

**Gate a feature**

```tsx
const { isPro } = useSubscription();
if (!isPro) return <UpgradePrompt onPress={() => router.push('/paywall')} />;
```

**Track an event.** `track('thing_happened', { where: 'settings' })`. Goes to PostHog and AppsFlyer; no-ops if neither is configured.

**Remove an integration.** Each doc ends with an exact removal checklist.

---

## Troubleshooting

**Build fails with `type of expression is ambiguous` in `expo-modules-jsi`**
An upstream Expo SDK 57 incompatibility with Xcode 26.3 / Swift 6.2. Swift/C++ interop makes `abs()` ambiguous. `scripts/patch-expo-swift-interop.js` runs on `postinstall` and fixes the one line. If you cloned and skipped install scripts, run `node scripts/patch-expo-swift-interop.js`. Delete the script and its `postinstall` entry once Expo ships a fix.

**App crashes instantly with `GADInvalidInitializationException`**
The Google Mobile Ads SDK hard-crashes when `GADApplicationIdentifier` is missing from Info.plist, even if you never show an ad. `app.config.ts` therefore adds the AdMob plugin unconditionally. Run `npx expo prebuild --clean`. To be rid of it entirely, uninstall the package ([steps](./docs/admob.md#removing-ads-entirely)).

**Env changes have no effect**: `npx expo start -c`. Values are inlined at bundle time.

**A Tailwind class does nothing**: Tailwind only emits classes it sees used. For components in `node_modules`, add them to `@source` in `global.css`.

**`className` is ignored on a component and the layout collapses**
Uniwind teaches React Native's _core_ components (View, Text, ScrollView, Pressable) to understand `className`. It cannot do that for arbitrary third-party components, including `SafeAreaView` from `react-native-safe-area-context`. The classes are silently dropped, so `flex-1` never applies and the container shrinks to its content. Use `components/Screen.tsx`, or wrap the component with `withUniwind()`. ([why](./components/Screen.tsx))

**Native module errors in Expo Go**: expected. Use `npx expo run:ios`. ([why](./lib/native.ts))

---

## Tech stack

| Layer         | Choice                                                              |
| ------------- | ------------------------------------------------------------------- |
| Framework     | [Expo](https://expo.dev) SDK 57                                     |
| Routing       | [expo-router](https://docs.expo.dev/router/introduction/)           |
| Components    | [HeroUI Native](https://heroui.com/docs/native/getting-started)     |
| Styling       | [Uniwind](https://docs.uniwind.dev) + Tailwind CSS v4               |
| Animation     | [Reanimated](https://docs.swmansion.com/react-native-reanimated/) 4 |
| Subscriptions | [RevenueCat](https://www.revenuecat.com)                            |
| Analytics     | [PostHog](https://posthog.com)                                      |
| Attribution   | [AppsFlyer](https://www.appsflyer.com)                              |
| Ads           | [Google AdMob](https://admob.google.com)                            |
| Storage       | AsyncStorage                                                        |
| Language      | TypeScript (strict)                                                 |

---

## Contributing

Issues and PRs welcome. Please keep PRs focused, and update the relevant doc when you change behaviour: the explanations are the point of this repo, not a side effect.

## License

MIT. See [LICENSE](./LICENSE).
