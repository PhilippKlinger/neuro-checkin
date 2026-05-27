import type { SQLiteDatabase } from 'expo-sqlite';

const SCHEMA_VERSION = 13;

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`PRAGMA journal_mode = WAL;`);

  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
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
    const legacy = await db.getFirstAsync<{
      reminder_enabled: number;
      reminder_time: string | null;
    }>('SELECT reminder_enabled, reminder_time FROM user_settings WHERE id = 1');
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

  if (currentVersion < 7) {
    await db.execAsync(`ALTER TABLE check_ins ADD COLUMN distress_level INTEGER;`);
    await db.execAsync(`ALTER TABLE check_ins ADD COLUMN distress_note TEXT;`);
  }

  if (currentVersion < 8) {
    await db.execAsync(
      `ALTER TABLE user_settings ADD COLUMN tutorial_offered INTEGER NOT NULL DEFAULT 0;`
    );
    await db.execAsync(
      `ALTER TABLE user_settings ADD COLUMN tutorial_seen INTEGER NOT NULL DEFAULT 0;`
    );
  }

  if (currentVersion < 9) {
    await db.execAsync(
      `ALTER TABLE user_settings ADD COLUMN guided_mode_enabled INTEGER NOT NULL DEFAULT 1;`
    );
    await db.execAsync(
      `ALTER TABLE user_settings ADD COLUMN guided_toggle_introduced INTEGER NOT NULL DEFAULT 0;`
    );
    await db.execAsync(`ALTER TABLE user_settings ADD COLUMN last_active_date TEXT;`);
    await db.execAsync(
      `ALTER TABLE user_settings ADD COLUMN detail_view_introduced INTEGER NOT NULL DEFAULT 0;`
    );
  }

  if (currentVersion < 10) {
    await db.execAsync(
      `ALTER TABLE check_ins ADD COLUMN energy_skipped INTEGER NOT NULL DEFAULT 0;`
    );
    await db.execAsync(
      `ALTER TABLE check_ins ADD COLUMN focus_skipped INTEGER NOT NULL DEFAULT 0;`
    );
  }

  if (currentVersion < 11) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_chips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        label TEXT NOT NULL,
        use_count INTEGER NOT NULL DEFAULT 1,
        UNIQUE(category, label)
      );
    `);
  }

  if (currentVersion < 12) {
    await db.execAsync(
      `ALTER TABLE check_ins ADD COLUMN feelings_skipped INTEGER NOT NULL DEFAULT 0;`
    );
  }

  // v13: UCL-01 + GT-10: Add normalized_label + last_used_at to user_chips.
  // Resilience: Also runs if PRAGMA says v13 but the table rebuild was interrupted
  // (e.g. hot-reload set PRAGMA without completing the DDL, or mid-migration crash).
  const chipCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(user_chips);');
  const hasLastUsedAt = chipCols.some((c) => c.name === 'last_used_at');

  if (currentVersion < 13 || !hasLastUsedAt) {
    // SQLite cannot ADD UNIQUE constraints to existing tables → table rebuild pattern.
    // Duplicate handling: ORDER BY use_count DESC on INSERT OR IGNORE ensures the
    // row with the highest use_count wins for case-duplicate pairs (e.g. "Ruhe"+"ruhe").
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_chips_new (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        category         TEXT    NOT NULL,
        label            TEXT    NOT NULL,
        normalized_label TEXT    NOT NULL,
        use_count        INTEGER NOT NULL DEFAULT 1,
        last_used_at     TEXT,
        UNIQUE(category, normalized_label)
      );

      INSERT OR IGNORE INTO user_chips_new
        (category, label, normalized_label, use_count, last_used_at)
      SELECT category, label, LOWER(TRIM(label)), use_count, datetime('now')
      FROM user_chips ORDER BY use_count DESC;

      DROP TABLE IF EXISTS user_chips;
      ALTER TABLE user_chips_new RENAME TO user_chips;
    `);

    // Trim each category to top MAX_USER_CHIPS_PER_CATEGORY (10) by use_count.
    await db.execAsync(`
      DELETE FROM user_chips WHERE id IN (
        SELECT uc1.id FROM user_chips uc1
        WHERE (
          SELECT COUNT(*) FROM user_chips uc2
          WHERE uc2.category = uc1.category
          AND (uc2.use_count > uc1.use_count
               OR (uc2.use_count = uc1.use_count AND uc2.id < uc1.id))
        ) >= 10
      );
    `);
  }

  // String interpolation intentional: PRAGMA does not support parameterized
  // queries in SQLite. SCHEMA_VERSION is a local constant, not user input.
  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
}
