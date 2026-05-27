/**
 * S33-01: energy_skipped / focus_skipped skip flags
 *
 * Tests the new nullable-energy/focus feature:
 *   - DB migration v10 adds energy_skipped + focus_skipped columns
 *   - CheckIn / CheckInInsert carry energySkipped / focusSkipped booleans
 *   - insertCheckIn passes the two new values in correct position
 *   - mapRowToCheckIn (via getCheckIns / getCheckInById) converts 0/1 → boolean
 */

import { insertCheckIn, getCheckIns, getCheckInById } from '../lib/database/checkins';
import type { CheckInInsert } from '../lib/types/checkin';
import { EMPTY_BODY_SIGNALS } from '../lib/types/checkin';
import { migrateDatabase } from '../lib/database/schema';

// ---------------------------------------------------------------------------
// DB mock (same pattern as checkins.db.test.ts)
// ---------------------------------------------------------------------------

interface MockDb {
  runAsync: jest.Mock;
  getAllAsync: jest.Mock;
  getFirstAsync: jest.Mock;
}

function makeDb(overrides: Partial<MockDb> = {}): MockDb {
  return {
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Schema migration v10: energy_skipped + focus_skipped
// ---------------------------------------------------------------------------

function makeSchemaMockDb(currentVersion = 0) {
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
      if (sql === 'PRAGMA user_version;') return Promise.resolve({ user_version: currentVersion });
      if (sql.includes('SELECT reminder_enabled'))
        return Promise.resolve({ reminder_enabled: 0, reminder_time: null });
      return Promise.resolve(null);
    }),
    _execCalls: execCalls,
    _runCalls: runCalls,
  };
}

describe('migrateDatabase — v10 adds energy_skipped and focus_skipped', () => {
  it('fresh install (v0) adds energy_skipped column', async () => {
    const db = makeSchemaMockDb(0);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('energy_skipped'))).toBe(true);
  });

  it('fresh install (v0) adds focus_skipped column', async () => {
    const db = makeSchemaMockDb(0);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('focus_skipped'))).toBe(true);
  });

  it('sets user_version to 13 at the end', async () => {
    const db = makeSchemaMockDb(0);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('user_version = 13'))).toBe(true);
  });

  it('partial upgrade from v9 only runs v10 statements', async () => {
    const db = makeSchemaMockDb(9);
    await migrateDatabase(db as any);
    expect(db._execCalls.some((s) => s.includes('energy_skipped'))).toBe(true);
    // v9 guided mode columns should NOT be re-added
    expect(db._execCalls.some((s) => s.includes('guided_mode_enabled'))).toBe(false);
  });

  it('already at v13 — no DDL executed', async () => {
    const db = makeSchemaMockDb(13);
    await migrateDatabase(db as any);
    const ddl = db._execCalls.filter(
      (s) => s.includes('CREATE TABLE') || s.includes('ALTER TABLE')
    );
    expect(ddl).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// insertCheckIn: new skip-flag fields
// ---------------------------------------------------------------------------

const BASE_INSERT: CheckInInsert = {
  energyLevel: 3,
  focusLevel: 4,
  energySkipped: false,
  focusSkipped: false,
  bodySignals: { ...EMPTY_BODY_SIGNALS },
  feelings: 'ruhig',
  feelingsSkipped: false,
  distressLevel: null,
  distressNote: null,
  thoughtsType: null,
  thoughtsNote: null,
  selfCareNote: null,
  innerPart: null,
  note: null,
};

describe('insertCheckIn — with skip flags', () => {
  it('passes 14 positional values (11 original + 3 skip flags)', async () => {
    const db = makeDb();
    await insertCheckIn(db as any, BASE_INSERT);
    const [, ...values] = db.runAsync.mock.calls[0];
    expect(values).toHaveLength(14);
  });

  it('passes energySkipped = false as 0 (SQLite integer)', async () => {
    const db = makeDb();
    await insertCheckIn(db as any, { ...BASE_INSERT, energySkipped: false });
    const [, ...values] = db.runAsync.mock.calls[0];
    // energySkipped should be the 12th value (index 11)
    expect(values[11]).toBe(0);
  });

  it('passes energySkipped = true as 1 (SQLite integer)', async () => {
    const db = makeDb();
    await insertCheckIn(db as any, { ...BASE_INSERT, energySkipped: true });
    const [, ...values] = db.runAsync.mock.calls[0];
    expect(values[11]).toBe(1);
  });

  it('passes focusSkipped = false as 0 (SQLite integer)', async () => {
    const db = makeDb();
    await insertCheckIn(db as any, { ...BASE_INSERT, focusSkipped: false });
    const [, ...values] = db.runAsync.mock.calls[0];
    expect(values[12]).toBe(0);
  });

  it('passes focusSkipped = true as 1 (SQLite integer)', async () => {
    const db = makeDb();
    await insertCheckIn(db as any, { ...BASE_INSERT, focusSkipped: true });
    const [, ...values] = db.runAsync.mock.calls[0];
    expect(values[12]).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getCheckIns: mapping 0/1 → boolean for skip flags
// ---------------------------------------------------------------------------

const SAMPLE_ROW = {
  id: 1,
  created_at: '2026-05-18 10:00:00',
  energy_level: 3,
  focus_level: 4,
  energy_skipped: 0,
  focus_skipped: 0,
  feelings_skipped: 0,
  body_signals: JSON.stringify({ ...EMPTY_BODY_SIGNALS }),
  feelings: 'ruhig',
  distress_level: null,
  distress_note: null,
  thoughts_type: null,
  thoughts_note: null,
  self_care_note: null,
  inner_part: null,
  note: null,
};

describe('getCheckIns — skip flag mapping', () => {
  it('maps energy_skipped = 0 to energySkipped = false', async () => {
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue([SAMPLE_ROW]) });
    const [item] = await getCheckIns(db as any);
    expect(item.energySkipped).toBe(false);
  });

  it('maps energy_skipped = 1 to energySkipped = true', async () => {
    const row = { ...SAMPLE_ROW, energy_skipped: 1 };
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue([row]) });
    const [item] = await getCheckIns(db as any);
    expect(item.energySkipped).toBe(true);
  });

  it('maps focus_skipped = 0 to focusSkipped = false', async () => {
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue([SAMPLE_ROW]) });
    const [item] = await getCheckIns(db as any);
    expect(item.focusSkipped).toBe(false);
  });

  it('maps focus_skipped = 1 to focusSkipped = true', async () => {
    const row = { ...SAMPLE_ROW, focus_skipped: 1 };
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue([row]) });
    const [item] = await getCheckIns(db as any);
    expect(item.focusSkipped).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getCheckInById: skip flags mapped correctly for single-row fetch
// ---------------------------------------------------------------------------

describe('getCheckInById — skip flag mapping', () => {
  it('returns energySkipped = false when energy_skipped = 0', async () => {
    const db = makeDb({ getFirstAsync: jest.fn().mockResolvedValue(SAMPLE_ROW) });
    const result = await getCheckInById(db as any, 1);
    expect(result?.energySkipped).toBe(false);
  });

  it('returns focusSkipped = true when focus_skipped = 1', async () => {
    const row = { ...SAMPLE_ROW, focus_skipped: 1 };
    const db = makeDb({ getFirstAsync: jest.fn().mockResolvedValue(row) });
    const result = await getCheckInById(db as any, 1);
    expect(result?.focusSkipped).toBe(true);
  });
});
