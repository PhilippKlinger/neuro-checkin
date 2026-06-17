import { migrateDatabase } from '../lib/database/schema';

// ---------------------------------------------------------------------------
// DB mock that tracks execAsync and runAsync calls and simulates PRAGMA reads
// ---------------------------------------------------------------------------

function makeDb(currentVersion = 0, opts?: { chipColumns?: string[] }) {
  const execCalls: string[] = [];
  const runCalls: string[] = [];
  // Tracks which exec statements ran inside withTransactionAsync, so tests can
  // assert the migration (incl. the user_version bump) is atomic.
  const execInTransaction: string[] = [];
  let inTransaction = false;

  const defaultChipCols =
    currentVersion >= 13
      ? ['id', 'category', 'label', 'normalized_label', 'use_count', 'last_used_at']
      : ['id', 'category', 'label', 'use_count'];
  // v14 doesn't touch user_chips — same columns as v13
  const chipColumns = opts?.chipColumns ?? defaultChipCols;

  return {
    execAsync: jest.fn((sql: string) => {
      execCalls.push(sql);
      if (inTransaction) execInTransaction.push(sql);
      return Promise.resolve();
    }),
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => {
      inTransaction = true;
      try {
        await task();
      } finally {
        inTransaction = false;
      }
    }),
    runAsync: jest.fn((sql: string) => {
      runCalls.push(sql);
      return Promise.resolve({ lastInsertRowId: 0, changes: 0 });
    }),
    getFirstAsync: jest.fn((sql: string): Promise<unknown> => {
      if (sql === 'PRAGMA user_version;') {
        return Promise.resolve({ user_version: currentVersion });
      }
      if (sql.includes('SELECT reminder_enabled')) {
        return Promise.resolve({ reminder_enabled: 0, reminder_time: null });
      }
      return Promise.resolve(null);
    }),
    getAllAsync: jest.fn((sql: string): Promise<unknown[]> => {
      if (sql.includes('table_info(user_chips)')) {
        return Promise.resolve(chipColumns.map((name) => ({ name })));
      }
      return Promise.resolve([]);
    }),
    _execCalls: execCalls,
    _runCalls: runCalls,
    _execInTransaction: execInTransaction,
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

  it('sets user_version to 20 at the end', async () => {
    const db = makeDb(0);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('user_version = 20'))).toBe(true);
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

  it('creates the user_chips table (v11)', async () => {
    const db = makeDb(0);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('user_chips'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Atomicity: schema changes run inside a single transaction, so an app kill
// mid-migration rolls back instead of leaving a half-migrated schema that
// re-runs ADD COLUMN on an existing column and crash-loops on every launch.
// ---------------------------------------------------------------------------

describe('migrateDatabase — atomic transaction', () => {
  it('wraps the schema changes in a single transaction', async () => {
    const db = makeDb(0);
    await migrateDatabase(db as any);
    expect(db.withTransactionAsync).toHaveBeenCalledTimes(1);
  });

  it('bumps user_version inside the transaction so it rolls back atomically', async () => {
    const db = makeDb(6);
    await migrateDatabase(db as any);
    expect(db._execInTransaction.some((s) => s.includes('user_version = 20'))).toBe(true);
  });

  it('does not advance user_version when a migration step fails', async () => {
    const db = makeDb(6);
    db.execAsync = jest.fn((sql: string) => {
      db._execCalls.push(sql);
      if (sql.includes('DROP COLUMN tutorial_offered')) {
        return Promise.reject(new Error('simulated mid-migration crash'));
      }
      return Promise.resolve();
    });
    await expect(migrateDatabase(db as any)).rejects.toThrow('simulated mid-migration crash');
    expect(db._execCalls.some((s) => s.includes('user_version = 20'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Already at latest version — idempotent
// ---------------------------------------------------------------------------

describe('migrateDatabase — v20 adds check_in_drafts', () => {
  it('creates check_in_drafts table when upgrading from v19', async () => {
    const db = makeDb(19);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('check_in_drafts'))).toBe(true);
  });
});

describe('migrateDatabase — already at v20 (idempotent)', () => {
  it('runs without throwing', async () => {
    const db = makeDb(20);
    await expect(migrateDatabase(db as any)).resolves.toBeUndefined();
  });

  it('does not execute any CREATE TABLE or ALTER TABLE statements', async () => {
    const db = makeDb(20);
    await migrateDatabase(db as any);
    const ddl = db._execCalls.filter(
      (s) => s.includes('CREATE TABLE') || s.includes('ALTER TABLE')
    );
    expect(ddl).toHaveLength(0);
  });

  it('still sets the user_version pragma', async () => {
    const db = makeDb(20);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('user_version = 20'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Migration v18: drop orphaned settings columns
// ---------------------------------------------------------------------------

describe('migrateDatabase — v18 drops orphaned settings columns', () => {
  it('drops tutorial_offered column', async () => {
    const db = makeDb(17);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('DROP COLUMN tutorial_offered'))).toBe(true);
  });

  it('drops tutorial_seen column', async () => {
    const db = makeDb(17);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('DROP COLUMN tutorial_seen'))).toBe(true);
  });

  it('drops guided_toggle_introduced column', async () => {
    const db = makeDb(17);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('DROP COLUMN guided_toggle_introduced'))).toBe(
      true
    );
  });

  it('does NOT drop these columns when already at v20', async () => {
    const db = makeDb(20);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('DROP COLUMN'))).toBe(false);
  });
});

describe('migrateDatabase — v13 adds normalized_label to user_chips', () => {
  it('creates user_chips_new with normalized_label when upgrading from v12', async () => {
    const db = makeDb(12);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('normalized_label'))).toBe(true);
  });

  it('renames user_chips_new to user_chips', async () => {
    const db = makeDb(12);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('RENAME TO user_chips'))).toBe(true);
  });

  it('trims overflow chips with DELETE after migration', async () => {
    const db = makeDb(12);
    await migrateDatabase(db as any);
    const deleteCalls = db._execCalls.filter((s) => s.includes('DELETE FROM user_chips'));
    expect(deleteCalls.length).toBeGreaterThan(0);
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
