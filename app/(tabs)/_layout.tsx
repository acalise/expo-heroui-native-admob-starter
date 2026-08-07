/**
 * app/(tabs)/_layout.tsx: bottom tab navigator.
 *
 * The tab bar is one of the few things that can't be styled with `className`,
 * expo-router takes colors as JS values, so it reads them from theme.css via
 * `useAppTheme()`. That's the entire reason that hook exists; see its header.
 */

import { Platform, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';

import {
  ComponentsIcon,
  ExploreIcon,
  ProfileIcon,
  SettingsIcon,
  type IconProps,
} from '@/components/Icons';
import { useAppTheme } from '@/hooks/useAppTheme';
import { haptics } from '@/lib/haptics';

export default function TabLayout() {
  const theme = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          // iOS needs room for the home indicator; Android doesn't.
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 84 : 64,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
      // A tick of feedback on tab change. Cheap, and the app feels noticeably
      // more responsive with it than without.
      screenListeners={{ tabPress: () => haptics.select() }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Components', tabBarIcon: icon(ComponentsIcon) }}
      />
      <Tabs.Screen name="growth" options={{ title: 'Growth', tabBarIcon: icon(ExploreIcon) }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon(ProfileIcon) }} />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: icon(SettingsIcon) }}
      />
    </Tabs>
  );
}

/**
 * Adapts our icon components to the `tabBarIcon` signature, which hands you a
 * resolved color rather than letting you use a class.
 */
function icon(Icon: React.ComponentType<IconProps>) {
  return function TabBarIcon({ color, size }: { color: ColorValue; size: number }) {
    // `color` is typed as ColorValue (it can be an opaque platform color), but
    // react-native-svg wants a string. Tabs only ever hands us the two tint
    // values we set above, both plain strings.
    return <Icon color={String(color)} size={size} />;
  };
}
