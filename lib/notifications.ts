/**
 * lib/notifications.ts
 *
 * Local notifications helper built on expo-notifications.
 *
 * Usage:
 *   import { notifications } from '@/lib/notifications';
 *
 *   // Request permission (call on app start or settings screen)
 *   const granted = await notifications.requestPermission();
 *
 *   // Schedule a daily reminder
 *   const id = await notifications.scheduleDailyReminder({
 *     title: 'Daily Check-in',
 *     body: 'Time to log your progress!',
 *     hour: 9,
 *     minute: 0,
 *   });
 *
 *   // Cancel a scheduled notification
 *   await notifications.cancel(id);
 *
 *   // Cancel all scheduled notifications
 *   await notifications.cancelAll();
 */

import * as ExpoNotifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// ── Default notification behaviour ───────────────────────────────────────────
ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Types ────────────────────────────────────────────────────────────────────
export interface DailyReminderOptions {
  title: string;
  body: string;
  hour: number;   // 0-23
  minute: number; // 0-59
  /** Optional data payload passed to notification handlers */
  data?: Record<string, unknown>;
}

export interface ScheduleOptions {
  title: string;
  body: string;
  /** Seconds from now */
  secondsFromNow: number;
  data?: Record<string, unknown>;
}

// ── Notification helpers ──────────────────────────────────────────────────────
export const notifications = {
  /**
   * Request notification permission.
   * Returns true if granted, false otherwise.
   * Must be called before scheduling.
   */
  async requestPermission(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('[notifications] Push notifications require a physical device.');
      return false;
    }

    if (Platform.OS === 'android') {
      await ExpoNotifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: ExpoNotifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
      });
    }

    const { status: existingStatus } = await ExpoNotifications.getPermissionsAsync();

    if (existingStatus === 'granted') return true;

    const { status } = await ExpoNotifications.requestPermissionsAsync();
    return status === 'granted';
  },

  /**
   * Schedule a daily repeating notification at a fixed time.
   * Returns the notification identifier (use to cancel later).
   */
  async scheduleDailyReminder(opts: DailyReminderOptions): Promise<string> {
    return ExpoNotifications.scheduleNotificationAsync({
      content: {
        title: opts.title,
        body: opts.body,
        data: opts.data ?? {},
        sound: true,
      },
      trigger: {
        type: ExpoNotifications.SchedulableTriggerInputTypes.CALENDAR,
        repeats: true,
        hour: opts.hour,
        minute: opts.minute,
      },
    });
  },

  /**
   * Schedule a one-off notification N seconds from now.
   */
  async scheduleOnce(opts: ScheduleOptions): Promise<string> {
    return ExpoNotifications.scheduleNotificationAsync({
      content: {
        title: opts.title,
        body: opts.body,
        data: opts.data ?? {},
      },
      trigger: {
        type: ExpoNotifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: opts.secondsFromNow,
      },
    });
  },

  /**
   * Cancel a notification by identifier.
   */
  async cancel(id: string): Promise<void> {
    await ExpoNotifications.cancelScheduledNotificationAsync(id);
  },

  /**
   * Cancel all scheduled notifications.
   */
  async cancelAll(): Promise<void> {
    await ExpoNotifications.cancelAllScheduledNotificationsAsync();
  },

  /**
   * List all currently scheduled notification identifiers.
   */
  async getScheduled(): Promise<ExpoNotifications.NotificationRequest[]> {
    return ExpoNotifications.getAllScheduledNotificationsAsync();
  },

  /**
   * Add a listener for received notifications (while app is foregrounded).
   * Returns the subscription — call `.remove()` on it to clean up.
   */
  onReceived(
    handler: (notification: ExpoNotifications.Notification) => void,
  ): ExpoNotifications.Subscription {
    return ExpoNotifications.addNotificationReceivedListener(handler);
  },

  /**
   * Add a listener for when the user taps a notification.
   */
  onTapped(
    handler: (response: ExpoNotifications.NotificationResponse) => void,
  ): ExpoNotifications.Subscription {
    return ExpoNotifications.addNotificationResponseReceivedListener(handler);
  },
};
