import type { SQLiteDatabase } from 'expo-sqlite';

const SCHEMA_VERSION = 6;

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`PRAGMA journal_mode = WAL;`);

  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;'
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS check_ins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        energy_level INTEGER NOT NULL,
        focus_level INTEGER NOT NULL,
        body_signals TEXT NOT NULL,
        feelings TEXT NOT NULL DEFAULT '',
        thoughts_type TEXT,
        thoughts_note TEXT,
        self_care_note TEXT,
        inner_part TEXT,
        note TEXT
      );

      CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        theme_name TEXT NOT NULL DEFAULT 'warmEarth',
        reminder_enabled INTEGER NOT NULL DEFAULT 0,
        reminder_time TEXT,
        language TEXT NOT NULL DEFAULT 'de'
      );

      INSERT OR IGNORE INTO user_settings (id) VALUES (1);
    `);
  }

  if (currentVersion < 2) {
    await db.execAsync(
      `ALTER TABLE user_settings ADD COLUMN onboarding_completed INTEGER NOT NULL DEFAULT 0;`
    );
  }

  if (currentVersion < 3) {
    await db.execAsync(
      `ALTER TABLE user_settings ADD COLUMN first_checkin_completed INTEGER NOT NULL DEFAULT 0;`
    );
  }

  if (currentVersion < 4) {
    // Create notification_slots table: 2 configurable slots (0=morning, 1=evening).
    // weekdays is a bitmask: Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32, Sun=64 (all=127).
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS notification_slots (
        id       INTEGER PRIMARY KEY,
        enabled  INTEGER NOT NULL DEFAULT 0,
        time     TEXT NOT NULL DEFAULT '09:00',
        weekdays INTEGER NOT NULL DEFAULT 127
      );

      INSERT OR IGNORE INTO notification_slots (id, time) VALUES (0, '09:00');
      INSERT OR IGNORE INTO notification_slots (id, time) VALUES (1, '20:00');
    `);

    // Migrate existing single-slot reminder settings into slot 0.
    const legacy = await db.getFirstAsync<{ reminder_enabled: number; reminder_time: string | null }>(
      'SELECT reminder_enabled, reminder_time FROM user_settings WHERE id = 1'
    );
    if (legacy?.reminder_enabled === 1) {
      await db.runAsync(
        'UPDATE notification_slots SET enabled = 1, time = ? WHERE id = 0',
        legacy.reminder_time ?? '09:00'
      );
    }
  }

  if (currentVersion < 5) {
    await db.execAsync(
      `ALTER TABLE user_settings ADD COLUMN color_mode TEXT NOT NULL DEFAULT 'system';`
    );
  }

  if (currentVersion < 6) {
    // Default to light mode: 'system' silently activates dark mode on devices
    // with dark system settings, surprising users on first launch before they
    // can discover the appearance toggle in Settings.
    await db.execAsync(
      `UPDATE user_settings SET color_mode = 'light' WHERE color_mode = 'system';`
    );
  }

  // String interpolation intentional: PRAGMA does not support parameterized
  // queries in SQLite. SCHEMA_VERSION is a local constant, not user input.
  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
}
