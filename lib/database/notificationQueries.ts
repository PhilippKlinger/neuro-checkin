import type { SQLiteDatabase } from 'expo-sqlite';
import type { NotificationSlot } from '../types/checkin';
import { ALL_WEEKDAYS } from '../types/checkin';
import { withDbRetry } from './withDbRetry';

const VALID_SLOT_IDS = [0, 1] as const;

export async function getNotificationSlots(db: SQLiteDatabase): Promise<NotificationSlot[]> {
  const rows = await withDbRetry(db, () =>
    db.getAllAsync<{
      id: number;
      enabled: number;
      time: string;
      weekdays: number;
    }>(
      'SELECT id, enabled, time, weekdays FROM notification_slots WHERE id IN (0, 1) ORDER BY id LIMIT 2'
    )
  );

  return rows
    .filter((row) => VALID_SLOT_IDS.includes(row.id as 0 | 1))
    .map((row) => ({
      id: row.id as 0 | 1,
      enabled: row.enabled === 1,
      time: row.time,
      weekdays: row.weekdays,
    }));
}

export async function saveNotificationSlot(
  db: SQLiteDatabase,
  slot: NotificationSlot
): Promise<void> {
  await withDbRetry(db, () =>
    db.runAsync(
      `INSERT INTO notification_slots (id, enabled, time, weekdays)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         enabled  = excluded.enabled,
         time     = excluded.time,
         weekdays = excluded.weekdays`,
      slot.id,
      slot.enabled ? 1 : 0,
      slot.time,
      slot.weekdays ?? ALL_WEEKDAYS
    )
  );
}
