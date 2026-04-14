import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const REMINDER_CHANNEL_ID = 'daily-reminder';
const REMINDER_NOTIFICATION_ID = 'daily-reminder';

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
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Tägliche Erinnerung',
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

export async function scheduleReminderNotification(time: string): Promise<void> {
  // Cancel any existing reminder first
  await cancelReminderNotification();

  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (isNaN(hour) || isNaN(minute)) return;

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_NOTIFICATION_ID,
    content: {
      title: 'Ein Moment für dich — wenn du magst.',
      body: 'Wie geht es dir gerade?',
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelReminderNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID);
}

export async function getScheduledReminderTime(): Promise<string | null> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const reminder = scheduled.find((n) => n.identifier === REMINDER_NOTIFICATION_ID);

  if (!reminder) return null;

  const trigger = reminder.trigger as { hour?: number; minute?: number };
  if (trigger.hour === undefined || trigger.minute === undefined) return null;

  const h = String(trigger.hour).padStart(2, '0');
  const m = String(trigger.minute).padStart(2, '0');
  return `${h}:${m}`;
}
