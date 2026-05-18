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
import { requestNotificationPermission } from '../lib/notifications/notifications';

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
