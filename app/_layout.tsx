/**
 * app/_layout.tsx: root layout and app bootstrap.
 *
 * Two jobs: assemble the provider stack, and start the SDKs in the one order
 * that works. The ordering is not arbitrary, see `bootstrap()` below.
 */

import '../global.css';

import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HeroUINativeProvider } from 'heroui-native';

import { ThemeProvider, useColorMode } from '@/context/ThemeContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { initAnalytics, trackScreen } from '@/lib/analytics';
import { initAds } from '@/lib/ads';
import { storage } from '@/lib/storage';
import { initSubscription } from '@/lib/subscription';
import { requestTrackingPermission } from '@/lib/tracking';

export { ErrorBoundary } from 'expo-router';

// Hold the splash screen until we know which screen to show first, otherwise
// the user sees the tab bar for a frame before being bounced into onboarding.
void SplashScreen.preventAutoHideAsync();

const ONBOARDING_KEY = 'onboarding:complete';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Inner component: everything here can read the theme. */
function App() {
  const { isDark } = useColorMode();
  const theme = useAppTheme();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const seenOnboarding = await storage.getOrDefault<boolean>(ONBOARDING_KEY, false);
      // Cached entitlement first, so a subscriber never sees a paywall flash on
      // a cold start. The network refresh happens inside and corrects it.
      await initSubscription();

      if (cancelled) return;
      if (!seenOnboarding) router.replace('/onboarding');
      setReady(true);

      void bootstrap();
    })();

    return () => {
      cancelled = true;
    };
    // Router identity is stable; re-running this would re-trigger the redirect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLayout = useCallback(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <HeroUINativeProvider>
      <View style={{ flex: 1, backgroundColor: theme.background }} onLayout={onLayout}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen
            name="paywall"
            options={{
              // A paywall you can't dismiss is a rejection (guideline 3.1.2);
              // the sheet presentation gives users the swipe-down out of the box.
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
      </View>
    </HeroUINativeProvider>
  );
}

/**
 * Start the third-party SDKs. Deliberately not awaited by the render path: a
 * slow network on first launch must never hold the UI hostage.
 *
 * The order is the whole point:
 *
 *   1. AppsFlyer first, but NOT awaited. Its `initSdk` is what opens the up-to-
 *      60s window during which it will hold the install postback waiting on the
 *      ATT answer. Start it after the prompt and there is no window left to
 *      wait in, so a granted IDFA arrives too late to attach to the install.
 *
 *   2. The ATT prompt second. iOS silently discards the request if the app is
 *      not yet foregrounded and active, which is why this runs after the first
 *      screen has mounted rather than at module scope.
 *
 *   3. AdMob last, after the ATT decision. The Mobile Ads SDK reads the
 *      tracking status when it initialises to decide whether it may request
 *      personalised ads. Initialise before the answer exists and you're locked
 *      into non-personalised (lower-paying) ads for the whole session.
 */
async function bootstrap(): Promise<void> {
  void initAnalytics(); // (1) start, don't await
  await requestTrackingPermission(); // (2) no-op unless EXPO_PUBLIC_ATT_ENABLED=true
  await initAds(); // (3) no-op unless EXPO_PUBLIC_ADS_ENABLED=true

  trackScreen('app_open');
}
