// Tests for requestNotificationPermission on Android.
// Must be a separate file so jest.mock() for react-native can override Platform.OS
// at module evaluation time (jest hoists mocks to the top of the file).

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { WEEKLY: 'weekly' },
  scheduleNotificationAsync: jest.fn().mockResolvedValue('ok'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
}));

import * as Notifications from 'expo-notifications';
import {
  requestNotificationPermission,
  scheduleSingleSlot,
} from '../lib/notifications/notifications';
import type { NotificationSlot } from '../lib/types/checkin';
import { ALL_WEEKDAYS } from '../lib/types/checkin';

function makeSlot(overrides: Partial<NotificationSlot> = {}): NotificationSlot {
  return { id: 0, enabled: true, time: '09:35', weekdays: ALL_WEEKDAYS, ...overrides };
}

const setChannel = Notifications.setNotificationChannelAsync as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('requestNotificationPermission — Android', () => {
  it('creates the notification channel with HIGH importance', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    await requestNotificationPermission();
    expect(setChannel).toHaveBeenCalledWith(
      'check-in-reminder',
      expect.objectContaining({ importance: 4 })
    );
  });

  it('creates the channel before checking permissions', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    const order: string[] = [];
    setChannel.mockImplementation(() => {
      order.push('channel');
      return Promise.resolve();
    });
    (Notifications.getPermissionsAsync as jest.Mock).mockImplementation(() => {
      order.push('getPermissions');
      return Promise.resolve({ status: 'granted' });
    });
    await requestNotificationPermission();
    expect(order[0]).toBe('channel');
    expect(order[1]).toBe('getPermissions');
  });

  it('still returns true when permission is granted on Android', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    const result = await requestNotificationPermission();
    expect(result).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// EAD-01: Android trigger must set channelId, must NOT set exact (No-Op)
// ---------------------------------------------------------------------------

describe('scheduleSingleSlot — Android trigger fields (EAD-01 + C-03)', () => {
  it('sets channelId to check-in-reminder on Android trigger', async () => {
    const scheduleAsync = Notifications.scheduleNotificationAsync as jest.Mock;
    await scheduleSingleSlot(makeSlot({ weekdays: 1 })); // Monday only — 1 call
    const trigger = scheduleAsync.mock.calls[0][0].trigger;
    expect(trigger.channelId).toBe('check-in-reminder');
  });

  it('does not set exact on the Android trigger (exact is a No-Op in WeeklyTriggerInput)', async () => {
    const scheduleAsync = Notifications.scheduleNotificationAsync as jest.Mock;
    await scheduleSingleSlot(makeSlot({ weekdays: 1 }));
    const trigger = scheduleAsync.mock.calls[0][0].trigger;
    expect(trigger).not.toHaveProperty('exact');
  });
});
