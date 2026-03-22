# expo-heroui-native-admob-starter

> A **production-ready Expo starter template** with HeroUI Native components, dark/light mode, a one-line accent color system, bottom tab navigation, a polished onboarding flow, and optional Google AdMob integration.

**Clone it. Change the accent color. Ship.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2053-000020?logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org)
[![HeroUI Native](https://img.shields.io/badge/HeroUI-Native-blueviolet)](https://heroui.com/docs/native/getting-started)

---

## Features

### Core
- **Expo SDK 53** with file-based routing via `expo-router` v4
- **HeroUI Native** — component library: Button, Card, Input, Switch, Avatar, Chip, Dialog, Select, TextArea, RadioGroup, ControlField, Skeleton, Spinner, Separator, and more
- **Dark & Light mode** — system-aware, toggle persisted to device, zero flash on launch
- **One-line accent color** — change `ACCENT_COLOR` in one file; both modes update across the entire app
- **Uniwind + Tailwind CSS v4** — utility-first styling for React Native via `className` props
- **TypeScript strict mode** throughout with `@/` path aliases

### Screens & Navigation
- **Bottom tab navigation** — 4 pre-configured tabs with custom SVG icons (no icon font dependency)
- **Component showcase** — two full screens demonstrating every HeroUI Native component, ready to reference or delete
- **Profile screen** — polished real-world layout example with avatar, stats, achievements, and activity bars
- **Settings screen** — dark mode toggle, notification time picker, accent color preview, ads demo

### Onboarding
- **3-step onboarding flow** — welcome screen, feature highlights + permission opt-ins, all-set confirmation
- **Animated step indicator** — spring-animated dots using `react-native-reanimated`
- **Storage gate** — persist completion flag and skip on subsequent launches

### Utilities
- **`lib/storage.ts`** — typed AsyncStorage wrapper (`get`, `set`, `remove`, `has`, `keys`, `clear`)
- **`lib/haptics.ts`** — semantic haptic feedback (`light`, `medium`, `heavy`, `success`, `warning`, `error`, `select`)
- **`lib/notifications.ts`** — local notifications helper (daily reminders, one-off, permission handling)
- **`context/ThemeContext.tsx`** — theme provider with `useTheme()` hook, persistence, system fallback

### Optional Modules
- **Google AdMob** — pre-configured `BannerAd` component + `showInterstitial()` helper; disabled by default, enabled with a single env variable
- **iOS Widget guide** — step-by-step walkthrough in `docs/widget-guide.md`

---

## Quick Start

### 1. Clone

```bash
git clone https://github.com/acalise/expo-heroui-native-admob-starter.git
cd expo-heroui-native-admob-starter
```

### 2. Install dependencies

```bash
npm install
# or
pnpm install
```

### 3. Set up environment

```bash
cp .env.example .env
```

### 4. Start the dev server

```bash
npx expo start
```

Scan the QR code with [Expo Go](https://expo.dev/client) (iOS / Android), or press `i` / `a` to open in a simulator.

> **First run on iOS Simulator?** Run `npx expo run:ios` (requires Xcode).

---

## Customization

- **Accent color** — update `ACCENT_COLOR` in `constants/theme.ts` and the matching `ACCENT` in `tailwind.config.js`
- **Default color mode** — change the fallback in `context/ThemeContext.tsx`
- **Add/remove tabs** — edit `app/(tabs)/_layout.tsx` and add a matching file in `app/(tabs)/`
- **Skip onboarding** — check the `onboarding:complete` storage flag in your root layout and redirect accordingly

---

## Optional: Google AdMob

This starter ships with AdMob pre-wired but **disabled by default**. Google's official test ad unit IDs are pre-configured, so you can enable and test ads immediately without an AdMob account.

### Enable ads

```bash
# .env
EXPO_PUBLIC_ADS_ENABLED=true
```

Then build natively (ads require a native build — they will not work in Expo Go):

```bash
npx expo run:ios   # or: eas build --platform ios
npx expo run:android
```

### Replace test IDs with your real ad unit IDs

Edit `lib/ads.ts` and swap in the IDs from your [AdMob dashboard](https://admob.google.com):

```ts
// lib/ads.ts
export const AD_UNIT_IDS = {
  banner: Platform.select({
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',     // your real iOS banner ID
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // your real Android banner ID
  }),
  interstitial: Platform.select({
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  }),
};
```

Also update `app.json` with your real app IDs:

```json
["react-native-google-mobile-ads", {
  "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
  "iosAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
}]
```

### Use the BannerAd component

```tsx
import { BannerAd } from '@/components/BannerAd';

// Drop anywhere in a screen — renders nothing when ads are disabled
<BannerAd />
<BannerAd marginHorizontal={16} marginVertical={12} />
```

### Show an interstitial ad

```ts
import { loadInterstitial, showInterstitial } from '@/lib/ads';

// Pre-load early (e.g. on app launch)
await loadInterstitial();

// Show when ready (e.g. on button press, between levels, etc.)
await showInterstitial();
```

### Remove ads entirely

1. Delete `lib/ads.ts` and `components/BannerAd.tsx`
2. Remove `<BannerAd />` from `app/(tabs)/index.tsx`
3. Remove the Ads section from `app/(tabs)/settings.tsx`
4. Remove `react-native-google-mobile-ads` from `package.json`
5. Remove the plugin entry from `app.json`

---

## Folder Structure

```
expo-heroui-native-admob-starter/
├── app/                            # expo-router screens
│   ├── _layout.tsx                 # Root layout — ThemeProvider + HeroUIProvider
│   ├── +not-found.tsx              # 404 screen
│   ├── (tabs)/
│   │   ├── _layout.tsx             # Tab navigator (4 tabs + custom SVG icons)
│   │   ├── index.tsx               # Components showcase (tab 1)
│   │   ├── explore.tsx             # More components (tab 2)
│   │   ├── profile.tsx             # Profile layout demo (tab 3)
│   │   └── settings.tsx            # Dark mode + notifications + ads demo (tab 4)
│   └── onboarding/
│       ├── _layout.tsx
│       ├── index.tsx               # Step 1 — Welcome
│       ├── step-two.tsx            # Step 2 — Features + notification opt-in
│       └── step-three.tsx          # Step 3 — All set
│
├── components/
│   ├── BannerAd.tsx                # AdMob banner (optional, no-op when disabled)
│   ├── OnboardingDots.tsx          # Animated step indicator
│   ├── ScreenHeader.tsx            # Consistent in-screen header
│   ├── SectionLabel.tsx            # Uppercase section divider
│   └── TabIcons.tsx                # Custom SVG icons for tab bar
│
├── constants/
│   └── theme.ts                    # ACCENT_COLOR lives here
│
├── context/
│   └── ThemeContext.tsx            # Theme provider + useTheme() hook
│
├── lib/
│   ├── ads.ts                      # AdMob helpers + ADS_ENABLED flag (optional)
│   ├── haptics.ts                  # Semantic haptic feedback
│   ├── notifications.ts            # Local notifications helper
│   └── storage.ts                  # Typed AsyncStorage wrapper
│
├── docs/
│   └── widget-guide.md             # iOS widget integration walkthrough
│
├── global.css                      # Uniwind + HeroUI Native theme imports
├── theme-base.css                  # Tailwind v4 theme variables + variants
├── tailwind.config.js              # Tailwind config (accent color here too)
├── babel.config.js
├── metro.config.js                 # Uniwind metro transformer
├── app.json                        # Expo config (AdMob plugin included)
├── tsconfig.json                   # TypeScript (strict, @/ paths)
├── .env.example                    # Environment variable template
└── package.json
```

---

## Adding New Screens

1. Create a file in `app/` (or a subfolder for grouping).
2. Export a default React component.
3. Navigate to it with `useRouter().push('/your-screen')` or a `<Link>`.

For new tab screens, add a `<Tabs.Screen>` entry in `app/(tabs)/_layout.tsx` and a matching file in `app/(tabs)/`.

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `EXPO_PUBLIC_APP_NAME` | `My App` | App display name |
| `EXPO_PUBLIC_ADS_ENABLED` | `false` | Enable Google AdMob |

Variables prefixed with `EXPO_PUBLIC_` are inlined at build time and accessible via `process.env.EXPO_PUBLIC_*`.

---

## Building for Production

### EAS Build (recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure your project
eas build:configure

# Build for iOS / Android
eas build --platform ios
eas build --platform android
```

### Local builds

```bash
npx expo run:ios      # requires Xcode
npx expo run:android  # requires Android Studio
```

> **AdMob note:** Ads require a native build. Run `npx expo run:ios` or use EAS — Expo Go will not load the AdMob native module.

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 53 |
| Navigation | [expo-router](https://expo.github.io/router) v4 |
| UI Components | [heroui-native](https://heroui.com/docs/native/getting-started) |
| Styling | [Uniwind](https://docs.uniwind.dev) + Tailwind CSS v4 |
| Animations | [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) |
| Gestures | [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/) |
| Storage | [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) |
| Haptics | [expo-haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) |
| Notifications | [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) |
| Ads _(optional)_ | [react-native-google-mobile-ads](https://rnfirebase.io/admob/usage) |
| Language | TypeScript (strict) |

---

## Contributing

Contributions are welcome!

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to your fork: `git push origin feat/your-feature`
5. Open a Pull Request

Please keep PRs focused and include documentation updates for any new features or options.

---

## License

MIT © expo-heroui-native-admob-starter contributors. See [LICENSE](./LICENSE).

