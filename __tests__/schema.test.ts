import { migrateDatabase } from '../lib/database/schema';

// ---------------------------------------------------------------------------
// DB mock that tracks execAsync and runAsync calls and simulates PRAGMA reads
// ---------------------------------------------------------------------------

function makeDb(currentVersion = 0) {
  const execCalls: string[] = [];
  const runCalls: string[] = [];

  return {
    execAsync: jest.fn((sql: string) => {
      execCalls.push(sql);
      return Promise.resolve();
    }),
    runAsync: jest.fn((sql: string) => {
      runCalls.push(sql);
      return Promise.resolve({ lastInsertRowId: 0, changes: 0 });
    }),
    getFirstAsync: jest.fn((sql: string): Promise<unknown> => {
      if (sql === 'PRAGMA user_version;') {
        return Promise.resolve({ user_version: currentVersion });
      }
      // Migration v4: legacy reminder check — no legacy reminder
      if (sql.includes('SELECT reminder_enabled')) {
        return Promise.resolve({ reminder_enabled: 0, reminder_time: null });
      }
      return Promise.resolve(null);
    }),
    _execCalls: execCalls,
    _runCalls: runCalls,
  };
}

// ---------------------------------------------------------------------------
// Fresh install (version 0 → 9)
// ---------------------------------------------------------------------------

describe('migrateDatabase — fresh install (v0)', () => {
  it('runs without throwing', async () => {
    const db = makeDb(0);
    await expect(migrateDatabase(db as any)).resolves.toBeUndefined();
  });

  it('enables WAL journal mode', async () => {
    const db = makeDb(0);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('WAL'))).toBe(true);
  });

  it('creates the check_ins table', async () => {
    const db = makeDb(0);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('check_ins'))).toBe(true);
  });

  it('creates the user_settings table', async () => {
    const db = makeDb(0);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('user_settings'))).toBe(true);
  });

  it('creates the notification_slots table (v4)', async () => {
    const db = makeDb(0);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('notification_slots'))).toBe(true);
  });

  it('sets user_version to 9 at the end', async () => {
    const db = makeDb(0);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('user_version = 9'))).toBe(true);
  });

  it('adds distress columns (v7)', async () => {
    const db = makeDb(0);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('distress_level'))).toBe(true);
    expect(db._execCalls.some((s) => s.includes('distress_note'))).toBe(true);
  });

  it('adds guided mode columns (v9)', async () => {
    const db = makeDb(0);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('guided_mode_enabled'))).toBe(true);
    expect(db._execCalls.some((s) => s.includes('last_active_date'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Already at latest version — idempotent
// ---------------------------------------------------------------------------

describe('migrateDatabase — already at v9 (idempotent)', () => {
  it('runs without throwing', async () => {
    const db = makeDb(9);
    await expect(migrateDatabase(db as any)).resolves.toBeUndefined();
  });

  it('does not execute any CREATE TABLE or ALTER TABLE statements', async () => {
    const db = makeDb(9);
    await migrateDatabase(db as any);
    const ddl = db._execCalls.filter(
      (s) => s.includes('CREATE TABLE') || s.includes('ALTER TABLE')
    );
    expect(ddl).toHaveLength(0);
  });

  it('still sets the user_version pragma', async () => {
    const db = makeDb(9);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('user_version = 9'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Partial upgrade: v7 → v9
// ---------------------------------------------------------------------------

describe('migrateDatabase — partial upgrade (v7 → v9)', () => {
  it('only executes v8 and v9 statements', async () => {
    const db = makeDb(7);
    await migrateDatabase(db as any);
    // v8: tutorial columns
    expect(db._execCalls.some((s) => s.includes('tutorial_offered'))).toBe(true);
    // v9: guided mode columns
    expect(db._execCalls.some((s) => s.includes('guided_mode_enabled'))).toBe(true);
    // v1 table creation should NOT run
    expect(db._execCalls.some((s) => s.includes('CREATE TABLE IF NOT EXISTS check_ins'))).toBe(
      false
    );
  });
});

// ---------------------------------------------------------------------------
// Migration v4: legacy reminder migration
// ---------------------------------------------------------------------------

describe('migrateDatabase — v4 legacy reminder migration', () => {
  it('migrates a legacy enabled reminder into slot 0', async () => {
    // Override getFirstAsync to simulate an active legacy reminder
    const db = makeDb(3);
    db.getFirstAsync = jest.fn((sql: string): Promise<unknown> => {
      if (sql === 'PRAGMA user_version;') return Promise.resolve({ user_version: 3 });
      if (sql.includes('SELECT reminder_enabled'))
        return Promise.resolve({ reminder_enabled: 1, reminder_time: '07:30' });
      return Promise.resolve(null);
    });
    await migrateDatabase(db as any);
    expect(db._runCalls.some((s) => s.includes('UPDATE notification_slots'))).toBe(true);
  });

  it('does not update notification_slots when legacy reminder is disabled', async () => {
    const db = makeDb(3);
    // Default mock returns reminder_enabled: 0
    await migrateDatabase(db as any);
    expect(db._runCalls.some((s) => s.includes('UPDATE notification_slots'))).toBe(false);
  });
});
