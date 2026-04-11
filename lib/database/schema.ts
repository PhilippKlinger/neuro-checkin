import type { SQLiteDatabase } from 'expo-sqlite';

const SCHEMA_VERSION = 1;

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

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
}
