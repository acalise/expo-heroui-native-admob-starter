/**
 * app.config.ts: the dynamic half of the Expo config.
 *
 * Expo reads app.json first, then hands it to this file as `config`. Static,
 * human-editable values (name, bundle id, icons, splash) stay in app.json where
 * they're easy to find. Everything that needs code: a 153-entry array, a
 * plugin that should only be added when a key is present, lives here.
 *
 * Anything conditional in here is driven by .env, so a fresh clone builds
 * without an AdMob account, an AppsFlyer key, or an ATT prompt.
 */

import type { ConfigContext, ExpoConfig } from 'expo/config';

// Imported as JSON, not from constants/skadnetwork.ts: this file is transpiled
// and executed by plain Node before Metro is involved, so it can require a .json
// but not a .ts. See the header of constants/skadnetwork.ts.
import SKADNETWORK_IDS from './constants/skadnetwork-ids.json';

export default ({ config }: ConfigContext): ExpoConfig => {
  const attEnabled = process.env.EXPO_PUBLIC_ATT_ENABLED === 'true';

  const plugins: NonNullable<ExpoConfig['plugins']> = [...(config.plugins ?? [])];

  // ── AdMob ─────────────────────────────────────────────────────────────────
  // Added UNCONDITIONALLY, even when EXPO_PUBLIC_ADS_ENABLED is false. That
  // looks wrong; it isn't, and the reason is worth knowing.
  //
  // Autolinking pulls the Google Mobile Ads pod into the binary purely because
  // `react-native-google-mobile-ads` is in package.json. Once it's in the
  // binary, the SDK runs its own launch-time check and, if
  // GADApplicationIdentifier is missing from Info.plist, throws
  // GADInvalidInitializationException: a hard, uncatchable crash on every
  // launch, before any of your JavaScript runs. It does this deliberately: from
  // Google's perspective a silently ad-less app loses more money than a crash
  // you'll notice immediately.
  //
  // So the plugin (which writes that key) has to run whenever the package is
  // installed. `EXPO_PUBLIC_ADS_ENABLED` then gates whether ads are ever
  // *requested*, see `adsAllowed()` in lib/ads.ts. Uninstall the package if
  // you want it truly gone; docs/admob.md has the full removal steps.
  //
  // The fallbacks are Google's public *sample app* IDs, so a fresh clone builds
  // and runs with no AdMob account. Replace them with your own before shipping
  // (AdMob → Apps → App settings → App ID: the `~` one, not the `/` ad-unit one).
  plugins.push([
    'react-native-google-mobile-ads',
    {
      androidAppId:
        process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ?? 'ca-app-pub-3940256099942544~3347511713',
      iosAppId:
        process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ?? 'ca-app-pub-3940256099942544~1458002511',
      // Hold off starting measurement until we call initAds() ourselves, after
      // the ATT decision (see the bootstrap ordering in app/_layout.tsx).
      delayAppMeasurementInit: true,
    },
  ]);

  // ── App Tracking Transparency ─────────────────────────────────────────────
  // Only add the plugin when the prompt is actually enabled. Shipping
  // NSUserTrackingUsageDescription in an app that never prompts is harmless but
  // untidy; showing a *prompt* with no description string is an instant crash.
  if (attEnabled) {
    plugins.push(['expo-tracking-transparency', { userTrackingPermission: ATT_REASON }]);
  }

  return {
    ...config,
    name: config.name ?? 'Expo HeroUI Starter',
    slug: config.slug ?? 'expo-heroui-starter',
    plugins,
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,

        // Every ad network's SKAdNetwork id. See constants/skadnetwork.ts for
        // why the list is exhaustive rather than "the networks we use today".
        SKAdNetworkItems: SKADNETWORK_IDS.map((id) => ({ SKAdNetworkIdentifier: id })),

        // Tells iOS to send a copy of every SKAdNetwork postback to AppsFlyer.
        // Without it, Apple posts only to the ad network and your MMP's SKAN
        // dashboards stay empty forever, with no error anywhere to explain it.
        // Remove this line if you use a different MMP, and set that MMP's
        // endpoint instead; there can only be one.
        ...(process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY
          ? { NSAdvertisingAttributionReportEndpoint: 'https://appsflyer-skadnetwork.com/' }
          : {}),

        // Required from iOS 14 for the encryption-export question in App Store
        // Connect. `false` is correct for apps that only use HTTPS, which is
        // every app in this template. It saves you answering the same question
        // on every single submission.
        ITSAppUsesNonExemptEncryption: false,
      },
    },
  };
};

/**
 * The ATT prompt's explanation string.
 *
 * App Review rejects generic text here. Say what the user gets, not what you
 * get. Rewrite this for your app before submitting.
 */
const ATT_REASON =
  'Allow tracking so we can keep the app free, show you more relevant content, and measure which recommendations actually help.';
