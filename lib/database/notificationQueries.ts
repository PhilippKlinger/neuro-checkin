import type { SQLiteDatabase } from 'expo-sqlite';
import type { NotificationSlot } from '../types/checkin';
import { ALL_WEEKDAYS } from '../types/checkin';

export async function getNotificationSlots(db: SQLiteDatabase): Promise<NotificationSlot[]> {
  const rows = await db.getAllAsync<{
    id: number;
    enabled: number;
    time: string;
    weekdays: number;
  }>('SELECT id, enabled, time, weekdays FROM notification_slots ORDER BY id');

  return rows.map((row) => ({
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
  await db.runAsync(
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
  );
}
