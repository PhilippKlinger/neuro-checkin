// Mock expo-notifications before importing the module under test
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('ok'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { WEEKLY: 'weekly' },
}));

jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

import * as Notifications from 'expo-notifications';
import {
  scheduleSingleSlot,
  cancelSingleSlot,
  scheduleAllSlots,
  cancelAllSlots,
} from '../lib/notifications/notifications';
import type { NotificationSlot } from '../lib/types/checkin';
import { ALL_WEEKDAYS, WORKDAYS } from '../lib/types/checkin';

const scheduleAsync = Notifications.scheduleNotificationAsync as jest.Mock;
const cancelAsync = Notifications.cancelScheduledNotificationAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Helper slot factories
// ---------------------------------------------------------------------------

function makeSlot(overrides: Partial<NotificationSlot> = {}): NotificationSlot {
  return { id: 0, enabled: true, time: '08:00', weekdays: ALL_WEEKDAYS, ...overrides };
}

// ---------------------------------------------------------------------------
// scheduleSingleSlot — disabled slot
// ---------------------------------------------------------------------------

describe('scheduleSingleSlot — disabled slot', () => {
  it('does not schedule any notifications when slot is disabled', async () => {
    await scheduleSingleSlot(makeSlot({ enabled: false }));
    expect(scheduleAsync).not.toHaveBeenCalled();
  });

  it('still cancels existing notifications even if slot is disabled', async () => {
    await scheduleSingleSlot(makeSlot({ enabled: false }));
    // 7 weekday cancel calls + 1 legacy for slot 0
    expect(cancelAsync).toHaveBeenCalledTimes(8);
  });
});

// ---------------------------------------------------------------------------
// scheduleSingleSlot — active slot
// ---------------------------------------------------------------------------

describe('scheduleSingleSlot — ALL_WEEKDAYS', () => {
  it('schedules exactly 7 notifications for all 7 weekdays', async () => {
    await scheduleSingleSlot(makeSlot());
    expect(scheduleAsync).toHaveBeenCalledTimes(7);
  });

  it('sets the correct hour and minute from the time string', async () => {
    await scheduleSingleSlot(makeSlot({ time: '08:30' }));
    const trigger = scheduleAsync.mock.calls[0][0].trigger;
    expect(trigger.hour).toBe(8);
    expect(trigger.minute).toBe(30);
  });

  it('passes trigger type WEEKLY', async () => {
    await scheduleSingleSlot(makeSlot());
    const trigger = scheduleAsync.mock.calls[0][0].trigger;
    expect(trigger.type).toBe('weekly');
  });

  it('uses unique identifiers per weekday (slot-0-wd-0 through slot-0-wd-6)', async () => {
    await scheduleSingleSlot(makeSlot({ id: 0 }));
    const ids = scheduleAsync.mock.calls.map(
      (call: [{ identifier: string }]) => call[0].identifier
    );
    expect(ids).toContain('slot-0-wd-0');
    expect(ids).toContain('slot-0-wd-6');
    // All 7 identifiers are unique
    expect(new Set(ids).size).toBe(7);
  });

  it('uses different identifiers for slot 1 vs slot 0', async () => {
    await scheduleSingleSlot(makeSlot({ id: 1 }));
    const ids = scheduleAsync.mock.calls.map(
      (call: [{ identifier: string }]) => call[0].identifier
    );
    expect(ids[0]).toMatch(/^slot-1-/);
  });
});

describe('scheduleSingleSlot — WORKDAYS only', () => {
  it('schedules exactly 5 notifications for Mon–Fri', async () => {
    await scheduleSingleSlot(makeSlot({ weekdays: WORKDAYS }));
    expect(scheduleAsync).toHaveBeenCalledTimes(5);
  });
});

describe('scheduleSingleSlot — single weekday', () => {
  it('schedules exactly 1 notification for Monday only (bit=1)', async () => {
    await scheduleSingleSlot(makeSlot({ weekdays: 1 })); // Monday only
    expect(scheduleAsync).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Weekday bitmask → expo weekday mapping
// ---------------------------------------------------------------------------

describe('EXPO_WEEKDAY mapping', () => {
  // Our Mon=index 0 → expo weekday 2
  // Our Sun=index 6 → expo weekday 1
  it('maps Monday (bitmask bit 0) to expo weekday 2', async () => {
    await scheduleSingleSlot(makeSlot({ weekdays: 1 })); // Monday only
    const trigger = scheduleAsync.mock.calls[0][0].trigger;
    expect(trigger.weekday).toBe(2);
  });

  it('maps Sunday (bitmask bit 6 = 64) to expo weekday 1', async () => {
    await scheduleSingleSlot(makeSlot({ weekdays: 64 })); // Sunday only
    const trigger = scheduleAsync.mock.calls[0][0].trigger;
    expect(trigger.weekday).toBe(1);
  });

  it('maps Saturday (bitmask bit 5 = 32) to expo weekday 7', async () => {
    await scheduleSingleSlot(makeSlot({ weekdays: 32 })); // Saturday only
    const trigger = scheduleAsync.mock.calls[0][0].trigger;
    expect(trigger.weekday).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// Invalid time string
// ---------------------------------------------------------------------------

describe('scheduleSingleSlot — invalid time', () => {
  it('does not schedule when time string has no colon', async () => {
    await scheduleSingleSlot(makeSlot({ time: 'invalid' }));
    expect(scheduleAsync).not.toHaveBeenCalled();
  });

  it('does not schedule when hour is NaN', async () => {
    await scheduleSingleSlot(makeSlot({ time: 'xx:30' }));
    expect(scheduleAsync).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// cancelSingleSlot
// ---------------------------------------------------------------------------

describe('cancelSingleSlot', () => {
  it('cancels all 7 weekday identifiers for slot 0', async () => {
    await cancelSingleSlot(0);
    const cancelledIds = cancelAsync.mock.calls.map((c: [string]) => c[0]);
    for (let i = 0; i < 7; i++) {
      expect(cancelledIds).toContain(`slot-0-wd-${i}`);
    }
  });

  it('also cancels the legacy "daily-reminder" identifier for slot 0', async () => {
    await cancelSingleSlot(0);
    const cancelledIds = cancelAsync.mock.calls.map((c: [string]) => c[0]);
    expect(cancelledIds).toContain('daily-reminder');
  });

  it('does NOT cancel the legacy identifier for slot 1', async () => {
    await cancelSingleSlot(1);
    const cancelledIds = cancelAsync.mock.calls.map((c: [string]) => c[0]);
    expect(cancelledIds).not.toContain('daily-reminder');
  });

  it('calls cancelAsync exactly 8 times for slot 0 (7 weekdays + legacy)', async () => {
    await cancelSingleSlot(0);
    expect(cancelAsync).toHaveBeenCalledTimes(8);
  });

  it('calls cancelAsync exactly 7 times for slot 1 (no legacy)', async () => {
    await cancelSingleSlot(1);
    expect(cancelAsync).toHaveBeenCalledTimes(7);
  });
});

// ---------------------------------------------------------------------------
// scheduleAllSlots
// ---------------------------------------------------------------------------

describe('scheduleAllSlots', () => {
  it('schedules each slot in sequence', async () => {
    const slots = [makeSlot({ id: 0, weekdays: 1 }), makeSlot({ id: 1, weekdays: 2 })];
    await scheduleAllSlots(slots);
    // Each slot with 1 weekday → 1 schedule call each = 2 total
    expect(scheduleAsync).toHaveBeenCalledTimes(2);
  });

  it('handles empty slots array without throwing', async () => {
    await expect(scheduleAllSlots([])).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// cancelAllSlots
// ---------------------------------------------------------------------------

describe('cancelAllSlots', () => {
  it('cancels both slot 0 and slot 1', async () => {
    await cancelAllSlots();
    const cancelledIds = cancelAsync.mock.calls.map((c: [string]) => c[0]);
    expect(cancelledIds).toContain('slot-0-wd-0');
    expect(cancelledIds).toContain('slot-1-wd-0');
  });

  it('cancels the legacy daily-reminder identifier', async () => {
    await cancelAllSlots();
    const cancelledIds = cancelAsync.mock.calls.map((c: [string]) => c[0]);
    expect(cancelledIds).toContain('daily-reminder');
  });

  it('calls cancelAsync 15 times (7+1 for slot0, 7 for slot1)', async () => {
    await cancelAllSlots();
    expect(cancelAsync).toHaveBeenCalledTimes(15);
  });
});
