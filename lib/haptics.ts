/**
 * lib/haptics.ts
 *
 * Centralised haptics utility built on expo-haptics.
 * Wraps each feedback type so you call semantic names instead of raw constants.
 *
 * Usage:
 *   import { haptics } from '@/lib/haptics';
 *
 *   haptics.light();    // subtle tap
 *   haptics.medium();   // standard button press
 *   haptics.heavy();    // important action / confirmation
 *   haptics.success();  // task completed
 *   haptics.warning();  // caution
 *   haptics.error();    // something went wrong
 *   haptics.select();   // list item selected / picker changed
 */

import * as ExpoHaptics from 'expo-haptics';
import { Platform } from 'react-native';

// Guard: haptics are iOS-only on Expo Go; silently no-op on Android/Web
const isSupported = Platform.OS === 'ios';

async function safe(fn: () => Promise<void>): Promise<void> {
  if (!isSupported) return;
  try {
    await fn();
  } catch {
    // Haptic failure is never fatal — swallow silently
  }
}

export const haptics = {
  /** Subtle — for micro-interactions, toggles, swipes */
  light: () =>
    safe(() =>
      ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light),
    ),

  /** Standard — for most button presses */
  medium: () =>
    safe(() =>
      ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium),
    ),

  /** Strong — for important confirmations, long-press activation */
  heavy: () =>
    safe(() =>
      ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy),
    ),

  /** Positive feedback — task completed, save successful */
  success: () =>
    safe(() =>
      ExpoHaptics.notificationAsync(
        ExpoHaptics.NotificationFeedbackType.Success,
      ),
    ),

  /** Caution — non-critical warnings */
  warning: () =>
    safe(() =>
      ExpoHaptics.notificationAsync(
        ExpoHaptics.NotificationFeedbackType.Warning,
      ),
    ),

  /** Error — destructive action, validation failure */
  error: () =>
    safe(() =>
      ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error),
    ),

  /** Selection feedback — picker/segmented control changed */
  select: () => safe(() => ExpoHaptics.selectionAsync()),
};
