import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type { NotificationSlot } from '../types/checkin';
import { WEEKDAY_BITS } from '../types/checkin';

const CHANNEL_ID = 'check-in-reminder';
const SNOOZE_TEMP_ID = 'snooze-temp';
const SNOOZE_MINUTES = 15;

// expo-notifications WEEKLY trigger: weekday 1=Sunday, 2=Monday, ..., 7=Saturday
// Our bitmask: Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32, Sun=64 (index 0=Mon)
// Mapping from our bitmask index (0=Mon) to expo weekday number (2=Mon)
const EXPO_WEEKDAY: Record<number, number> = {
  0: 2, // Monday
  1: 3, // Tuesday
  2: 4, // Wednesday
  3: 5, // Thursday
  4: 6, // Friday
  5: 7, // Saturday
  6: 1, // Sunday
};

// Configure how notifications appear when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean | 'emulator'> {
  if (!Device.isDevice) {
    return 'emulator';
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Check-in Erinnerung',
      // HIGH importance reduces Doze-related delays on Android
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: null,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Registers the snooze action category so the OS shows a "Snooze" button
 * directly in the notification banner. Call once at app startup.
 */
export async function registerSnoozeCategory(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(CHANNEL_ID, [
    {
      identifier: 'snooze',
      buttonTitle: `Später (${SNOOZE_MINUTES} min)`,
      options: { opensAppToForeground: false },
    },
  ]);
}

/**
 * Handles a notification response. If the user tapped "Snooze",
 * schedules a one-off notification in SNOOZE_MINUTES minutes.
 */
export async function handleSnoozeResponse(
  response: Notifications.NotificationResponse
): Promise<void> {
  if (response.actionIdentifier !== 'snooze') return;

  await Notifications.scheduleNotificationAsync({
    identifier: SNOOZE_TEMP_ID,
    content: {
      title: 'Ein Moment für dich — wenn du magst.',
      body: 'Wie geht es dir gerade?',
      sound: false,
      categoryIdentifier: CHANNEL_ID,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: SNOOZE_MINUTES * 60,
      repeats: false,
    },
  });
}

function slotIdentifier(slotId: number, weekdayIndex: number): string {
  return `slot-${slotId}-wd-${weekdayIndex}`;
}

/**
 * Schedules all active weekly notifications for a single slot.
 * Cancels any existing notifications for this slot first.
 */
export async function scheduleSingleSlot(slot: NotificationSlot): Promise<void> {
  await cancelSingleSlot(slot.id);

  if (!slot.enabled) return;

  const [hourStr, minuteStr] = slot.time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (isNaN(hour) || isNaN(minute)) return;

  for (let i = 0; i < WEEKDAY_BITS.length; i++) {
    if ((slot.weekdays & WEEKDAY_BITS[i]) === 0) continue;

    const expoWeekday = EXPO_WEEKDAY[i];

    await Notifications.scheduleNotificationAsync({
      identifier: slotIdentifier(slot.id, i),
      content: {
        title: 'Ein Moment für dich — wenn du magst.',
        body: 'Wie geht es dir gerade?',
        sound: false,
        categoryIdentifier: CHANNEL_ID,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        hour,
        minute,
        weekday: expoWeekday,
        ...(Platform.OS === 'android' ? { exact: true } : {}),
      },
    });
  }
}

/**
 * Cancels all scheduled notifications for a single slot.
 */
export async function cancelSingleSlot(slotId: 0 | 1): Promise<void> {
  for (let i = 0; i < WEEKDAY_BITS.length; i++) {
    await Notifications.cancelScheduledNotificationAsync(slotIdentifier(slotId, i));
  }
  // Also cancel any legacy single-slot identifier from v1.1
  if (slotId === 0) {
    await Notifications.cancelScheduledNotificationAsync('daily-reminder');
  }
}

/**
 * Schedules notifications for all slots. Replaces any previously scheduled ones.
 */
export async function scheduleAllSlots(slots: NotificationSlot[]): Promise<void> {
  for (const slot of slots) {
    await scheduleSingleSlot(slot);
  }
}

/**
 * Cancels all slot notifications (all slots, all weekdays + legacy).
 */
export async function cancelAllSlots(): Promise<void> {
  await cancelSingleSlot(0);
  await cancelSingleSlot(1);
  await Notifications.cancelScheduledNotificationAsync(SNOOZE_TEMP_ID);
}
