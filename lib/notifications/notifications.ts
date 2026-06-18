import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type { NotificationSlot } from '../types/checkin';
import { WEEKDAY_BITS } from '../types/checkin';

// Channel behaviour (importance, vibration, lock-screen visibility) is FROZEN by
// Android once a channel is first created — later edits via setNotificationChannelAsync
// are ignored. Devices that installed earlier versions still carry the original
// 'check-in-reminder' channel with its old (silent, low-importance) settings, so the
// HIGH-importance + vibration config below never took effect there. Bumping the channel
// id forces Android to apply the intended behaviour on every device; the stale channel
// is deleted so users do not end up with two "Check-in" channels in system settings.
const CHANNEL_ID = 'check-in-reminder-v2';
const LEGACY_CHANNEL_ID = 'check-in-reminder';

/**
 * Ensures the reminder channel exists with the intended behaviour. Idempotent and
 * safe to call on every schedule path (scheduling to a non-existent channel would
 * otherwise drop the notification on Android O+). Vibration only, no sound, by
 * design (reizarm) — users can enable sound in the Android channel settings.
 */
async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.deleteNotificationChannelAsync(LEGACY_CHANNEL_ID);
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Check-in Erinnerung',
    // HIGH importance: heads-up + vibration so the reminder is noticeable without
    // forcing the screen on (that would need a full-screen-intent / alarm path,
    // which is Play-policy-restricted and contradicts the calm, low-stimulation UX).
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: null,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

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

  await ensureNotificationChannel();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
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
  if (!slot.time || !slot.time.includes(':')) return;

  const [hourStr, minuteStr] = slot.time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (isNaN(hour) || isNaN(minute)) return;

  // Guarantee the channel exists with the intended config before scheduling — this
  // path also runs on app/settings load (scheduleAllSlots) without a fresh
  // permission request, so the channel cannot be assumed to exist yet.
  await ensureNotificationChannel();

  for (let i = 0; i < WEEKDAY_BITS.length; i++) {
    if ((slot.weekdays & WEEKDAY_BITS[i]) === 0) continue;

    const expoWeekday = EXPO_WEEKDAY[i];

    await Notifications.scheduleNotificationAsync({
      identifier: slotIdentifier(slot.id, i),
      content: {
        title: 'Dein Check-in',
        body: 'Nimm dir kurz einen Moment für dich.',
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        hour,
        minute,
        weekday: expoWeekday,
        // Route to the HIGH-importance channel on Android (C-03 fix).
        // Exact firing depends on the SCHEDULE_EXACT_ALARM special access: Expo fires
        // this trigger exactly once the user has granted it (see modules/exact-alarm),
        // otherwise it falls back to inexact scheduling. No trigger flag controls this.
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
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
}
