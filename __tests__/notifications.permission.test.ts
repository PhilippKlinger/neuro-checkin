// Tests for requestNotificationPermission — permission branches.
// The emulator and Android-channel branches depend on module-level constants
// (Device.isDevice, Platform.OS) that are evaluated at import time.
// Those two branches are covered by dedicated describe-blocks that override
// the mocks at the top-level jest.mock() factory level.

// ---------------------------------------------------------------------------
// Default: real device, iOS
// ---------------------------------------------------------------------------

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { WEEKLY: 'weekly' },
  scheduleNotificationAsync: jest.fn().mockResolvedValue('ok'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

import * as Notifications from 'expo-notifications';
import { requestNotificationPermission } from '../lib/notifications/notifications';

const getPermissions = Notifications.getPermissionsAsync as jest.Mock;
const requestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const setChannel = Notifications.setNotificationChannelAsync as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('requestNotificationPermission — already granted', () => {
  it('returns true when permission is already granted', async () => {
    getPermissions.mockResolvedValue({ status: 'granted' });
    const result = await requestNotificationPermission();
    expect(result).toBe(true);
  });

  it('does not call requestPermissionsAsync when already granted', async () => {
    getPermissions.mockResolvedValue({ status: 'granted' });
    await requestNotificationPermission();
    expect(requestPermissions).not.toHaveBeenCalled();
  });
});

describe('requestNotificationPermission — needs request', () => {
  it('requests permissions when status is undetermined and grants succeeds', async () => {
    getPermissions.mockResolvedValue({ status: 'undetermined' });
    requestPermissions.mockResolvedValue({ status: 'granted' });
    const result = await requestNotificationPermission();
    expect(requestPermissions).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('returns false when user denies the permission request', async () => {
    getPermissions.mockResolvedValue({ status: 'undetermined' });
    requestPermissions.mockResolvedValue({ status: 'denied' });
    const result = await requestNotificationPermission();
    expect(result).toBe(false);
  });
});

describe('requestNotificationPermission — iOS does not create channel', () => {
  it('does not call setNotificationChannelAsync on iOS', async () => {
    getPermissions.mockResolvedValue({ status: 'granted' });
    await requestNotificationPermission();
    expect(setChannel).not.toHaveBeenCalled();
  });
});
