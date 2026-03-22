/**
 * app/_layout.tsx — Root layout
 *
 * Sets up:
 *   - ThemeProvider (dark/light mode + accent color)
 *   - HeroUI Provider
 *   - expo-router Stack
 *   - Splash screen control
 *   - Status bar (adapts to color mode)
 */

import '../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HeroUINativeProvider as HeroUIProvider } from 'heroui-native';

import { ThemeProvider, useTheme } from '@/context/ThemeContext';

// Keep splash visible until layout is ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

/** Inner component so we can read the theme after the provider mounts. */
function ThemedApp() {
  const { isDark, theme } = useTheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <HeroUIProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </HeroUIProvider>
  );
}
