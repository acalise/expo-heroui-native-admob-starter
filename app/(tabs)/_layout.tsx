/**
 * app/(tabs)/_layout.tsx — Bottom tab navigator
 *
 * 4 tabs: Components · Explore · Profile · Settings
 * All tab bar styling adapts to the current color mode.
 */

import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

// Inline SVG-based tab icons (no icon library dependency)
import {
  ComponentsIcon,
  ExploreIcon,
  ProfileIcon,
  SettingsIcon,
} from '@/components/TabIcons';

export default function TabLayout() {
  const { theme, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: isDark
            ? theme.backgroundElevated
            : theme.backgroundElevated,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 84 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Components',
          tabBarIcon: ({ color, size }) => (
            <ComponentsIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <ExploreIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <ProfileIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <SettingsIcon color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
