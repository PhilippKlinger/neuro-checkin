import {
  insertCheckIn,
  getCheckIns,
  getCheckInById,
  getCheckInsByIds,
  deleteCheckIn,
  countCheckIns,
  deleteAllCheckIns,
} from '../lib/database/checkins';
import type { CheckInInsert } from '../lib/types/checkin';
import { EMPTY_BODY_SIGNALS } from '../lib/types/checkin';

// ---------------------------------------------------------------------------
// Minimal expo-sqlite mock
// ---------------------------------------------------------------------------

interface MockDb {
  runAsync: jest.Mock;
  getAllAsync: jest.Mock;
  getFirstAsync: jest.Mock;
  withTransactionAsync: jest.Mock;
}

function makeDb(overrides: Partial<MockDb> = {}): MockDb {
  return {
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    withTransactionAsync: jest.fn(async (cb: () => Promise<void>) => {
      await cb();
    }),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

const FULL_INSERT: CheckInInsert = {
  energyLevel: 3,
  focusLevel: 4,
  energySkipped: false,
  focusSkipped: false,
  bodySignals: {
    hunger: true,
    thirst: false,
    temperature: null,
    pain: null,
    restroom: null,
    seating: null,
    externalStimuli: null,
  },
  feelings: 'ruhig, freudig',
  feelingsSkipped: false,
  distressLevel: 2,
  distressNote: 'ein bisschen',
  thoughtsType: 'supportive',
  thoughtsNote: 'alles gut',
  selfCareNote: 'Wasser trinken',
  innerPart: null,
  note: 'Testnotiz',
};

const MINIMAL_INSERT: CheckInInsert = {
  energyLevel: 2,
  focusLevel: 2,
  energySkipped: false,
  focusSkipped: false,
  bodySignals: { ...EMPTY_BODY_SIGNALS },
  feelings: '',
  feelingsSkipped: false,
  distressLevel: null,
  distressNote: null,
  thoughtsType: null,
  thoughtsNote: null,
  selfCareNote: null,
  innerPart: null,
  note: null,
};

// ---------------------------------------------------------------------------
// insertCheckIn
// ---------------------------------------------------------------------------

describe('insertCheckIn', () => {
  it('calls runAsync with INSERT SQL', async () => {
    const db = makeDb();
    await insertCheckIn(db as any, FULL_INSERT);
    expect(db.runAsync).toHaveBeenCalledTimes(1);
    const sql: string = db.runAsync.mock.calls[0][0];
    expect(sql).toMatch(/INSERT INTO check_ins/i);
  });

  it('returns the lastInsertRowId from runAsync', async () => {
    const db = makeDb({
      runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 42, changes: 1 }),
    });
    const id = await insertCheckIn(db as any, FULL_INSERT);
    expect(id).toBe(42);
  });

  it('serialises bodySignals as JSON', async () => {
    const db = makeDb();
    await insertCheckIn(db as any, FULL_INSERT);
    const args: unknown[] = db.runAsync.mock.calls[0];
    // Third positional arg (index 3) is body_signals JSON
    const bodySignalsArg = args[3];
    expect(typeof bodySignalsArg).toBe('string');
    expect(JSON.parse(bodySignalsArg as string)).toMatchObject(FULL_INSERT.bodySignals);
  });

  it('passes distressLevel = null directly (not coerced to 0)', async () => {
    const db = makeDb();
    await insertCheckIn(db as any, MINIMAL_INSERT);
    const args: unknown[] = db.runAsync.mock.calls[0];
    // distress_level is the 5th positional value arg (index 5)
    expect(args[5]).toBeNull();
  });

  it('passes all 14 field values in correct order', async () => {
    const db = makeDb();
    await insertCheckIn(db as any, FULL_INSERT);
    const [, ...values] = db.runAsync.mock.calls[0]; // drop SQL string
    expect(values).toHaveLength(14);
    expect(values[0]).toBe(FULL_INSERT.energyLevel);
    expect(values[1]).toBe(FULL_INSERT.focusLevel);
    expect(typeof values[2]).toBe('string'); // body_signals JSON
    expect(values[3]).toBe(FULL_INSERT.feelings);
    expect(values[4]).toBe(FULL_INSERT.distressLevel);
    expect(values[5]).toBe(FULL_INSERT.distressNote);
    expect(values[6]).toBe(FULL_INSERT.thoughtsType);
    expect(values[7]).toBe(FULL_INSERT.thoughtsNote);
    expect(values[8]).toBe(FULL_INSERT.selfCareNote);
    expect(values[9]).toBe(FULL_INSERT.innerPart);
    expect(values[10]).toBe(FULL_INSERT.note);
    expect(values[11]).toBe(0); // energySkipped false → 0
    expect(values[12]).toBe(0); // focusSkipped false → 0
    expect(values[13]).toBe(0); // feelingsSkipped false → 0
  });
});

// ---------------------------------------------------------------------------
// getCheckIns
// ---------------------------------------------------------------------------

const SAMPLE_ROW = {
  id: 7,
  created_at: '2026-05-18 10:00:00',
  energy_level: 3,
  focus_level: 4,
  energy_skipped: 0,
  focus_skipped: 0,
  feelings_skipped: 0,
  body_signals: JSON.stringify(FULL_INSERT.bodySignals),
  feelings: 'ruhig',
  distress_level: 2,
  distress_note: 'leicht',
  thoughts_type: 'supportive',
  thoughts_note: 'gut',
  self_care_note: 'Wasser',
  inner_part: null,
  note: null,
};

describe('getCheckIns', () => {
  it('returns an empty array when no rows exist', async () => {
    const db = makeDb();
    const result = await getCheckIns(db as any);
    expect(result).toEqual([]);
  });

  it('maps a row to a CheckIn with camelCase fields', async () => {
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue([SAMPLE_ROW]) });
    const [item] = await getCheckIns(db as any);
    expect(item.id).toBe(7);
    expect(item.createdAt).toBe('2026-05-18 10:00:00');
    expect(item.energyLevel).toBe(3);
    expect(item.focusLevel).toBe(4);
    expect(item.distressLevel).toBe(2);
    expect(item.distressNote).toBe('leicht');
    expect(item.thoughtsType).toBe('supportive');
    expect(item.selfCareNote).toBe('Wasser');
    expect(item.innerPart).toBeNull();
  });

  it('parses bodySignals JSON into BodySignals object', async () => {
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue([SAMPLE_ROW]) });
    const [item] = await getCheckIns(db as any);
    expect(item.bodySignals.hunger).toBe(true);
    expect(item.bodySignals.thirst).toBe(false);
    expect(item.bodySignals.temperature).toBeNull();
  });

  it('preserves distressLevel = null (not coerced to 0)', async () => {
    const row = { ...SAMPLE_ROW, distress_level: null, distress_note: null };
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue([row]) });
    const [item] = await getCheckIns(db as any);
    expect(item.distressLevel).toBeNull();
  });

  it('uses default limit=50 and offset=0', async () => {
    const db = makeDb();
    await getCheckIns(db as any);
    const sql: string = db.getAllAsync.mock.calls[0][0];
    expect(sql).toMatch(/LIMIT \? OFFSET \?/i);
    const [, limit, offset] = db.getAllAsync.mock.calls[0];
    expect(limit).toBe(50);
    expect(offset).toBe(0);
  });

  it('passes custom limit and offset to the query', async () => {
    const db = makeDb();
    await getCheckIns(db as any, 10, 20);
    const [, limit, offset] = db.getAllAsync.mock.calls[0];
    expect(limit).toBe(10);
    expect(offset).toBe(20);
  });

  it('returns multiple rows in the order the DB returns them', async () => {
    const row2 = { ...SAMPLE_ROW, id: 8, energy_level: 5 };
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue([SAMPLE_ROW, row2]) });
    const results = await getCheckIns(db as any);
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe(7);
    expect(results[1].id).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// getCheckInById
// ---------------------------------------------------------------------------

describe('getCheckInById', () => {
  it('returns null when no row is found', async () => {
    const db = makeDb();
    const result = await getCheckInById(db as any, 999);
    expect(result).toBeNull();
  });

  it('returns a mapped CheckIn when a row exists', async () => {
    const db = makeDb({ getFirstAsync: jest.fn().mockResolvedValue(SAMPLE_ROW) });
    const result = await getCheckInById(db as any, 7);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(7);
  });

  it('passes the id to the query', async () => {
    const db = makeDb();
    await getCheckInById(db as any, 42);
    expect(db.getFirstAsync).toHaveBeenCalledWith(expect.stringMatching(/WHERE id = \?/), 42);
  });
});

// ---------------------------------------------------------------------------
// deleteCheckIn
// ---------------------------------------------------------------------------

describe('deleteCheckIn', () => {
  it('calls runAsync with DELETE SQL and the correct id', async () => {
    const db = makeDb();
    await deleteCheckIn(db as any, 5);
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringMatching(/DELETE FROM check_ins WHERE id = \?/),
      5
    );
  });
});

// ---------------------------------------------------------------------------
// countCheckIns
// ---------------------------------------------------------------------------

describe('countCheckIns', () => {
  it('returns the count from the DB row', async () => {
    const db = makeDb({ getFirstAsync: jest.fn().mockResolvedValue({ count: 17 }) });
    const count = await countCheckIns(db as any);
    expect(count).toBe(17);
  });

  it('returns 0 when getFirstAsync returns null', async () => {
    const db = makeDb();
    const count = await countCheckIns(db as any);
    expect(count).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// deleteAllCheckIns
// ---------------------------------------------------------------------------

describe('deleteAllCheckIns', () => {
  it('deletes from check_ins', async () => {
    const db = makeDb();
    await deleteAllCheckIns(db as any);
    expect(db.runAsync).toHaveBeenCalledWith(expect.stringMatching(/DELETE FROM check_ins/));
  });

  it('also clears check_in_drafts so no sensitive draft survives delete-all', async () => {
    const db = makeDb();
    await deleteAllCheckIns(db as any);
    expect(db.runAsync).toHaveBeenCalledWith(expect.stringMatching(/DELETE FROM check_in_drafts/));
  });

  it('runs both deletes inside a single transaction (atomic)', async () => {
    const db = makeDb();
    await deleteAllCheckIns(db as any);
    expect(db.withTransactionAsync).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// getCheckInsByIds
// ---------------------------------------------------------------------------

describe('getCheckInsByIds', () => {
  it('returns an empty array when given no ids', async () => {
    const db = makeDb();
    const result = await getCheckInsByIds(db as any, []);
    expect(result).toEqual([]);
    expect(db.getAllAsync).not.toHaveBeenCalled();
  });

  it('returns mapped CheckIns for matching rows', async () => {
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue([SAMPLE_ROW]) });
    const result = await getCheckInsByIds(db as any, [7]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(7);
  });

  it('passes all given ids to the IN clause', async () => {
    const db = makeDb();
    await getCheckInsByIds(db as any, [1, 2, 3]);
    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('IN'),
      expect.arrayContaining([1, 2, 3])
    );
  });

  it('orders results by created_at DESC', async () => {
    const db = makeDb();
    await getCheckInsByIds(db as any, [1]);
    const sql: string = db.getAllAsync.mock.calls[0][0];
    expect(sql).toMatch(/ORDER BY.*created_at.*DESC/i);
  });

  it('maps bodySignals JSON correctly', async () => {
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue([SAMPLE_ROW]) });
    const [item] = await getCheckInsByIds(db as any, [7]);
    expect(item.bodySignals.hunger).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// prepareAsync retry (B2 regression)
// ---------------------------------------------------------------------------

describe('prepareAsync retry', () => {
  const prepareError = new Error('NativeDatabase.prepareAsync rejected (NullPointerException)');

  it('getCheckIns retries once after prepareAsync error and returns rows', async () => {
    let calls = 0;
    const db = {
      getAllAsync: jest.fn().mockImplementation(() => {
        calls++;
        if (calls === 1) return Promise.reject(prepareError);
        return Promise.resolve([SAMPLE_ROW]);
      }),
      getFirstAsync: jest.fn().mockResolvedValue({ n: 1 }),
    };
    const result = await getCheckIns(db as any);
    expect(result).toHaveLength(1);
    expect(db.getAllAsync).toHaveBeenCalledTimes(2);
    expect(db.getFirstAsync).toHaveBeenCalledTimes(1);
  });

  it('getCheckInById retries once after prepareAsync error and returns row', async () => {
    let calls = 0;
    const db = {
      getFirstAsync: jest.fn().mockImplementation((...args: unknown[]) => {
        const sql = args[0] as string;
        if (sql.includes('SELECT ? AS n')) return Promise.resolve({ n: 1 });
        calls++;
        if (calls === 1) return Promise.reject(prepareError);
        return Promise.resolve(SAMPLE_ROW);
      }),
    };
    const result = await getCheckInById(db as any, 7);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(7);
  });

  it('countCheckIns retries once after prepareAsync error and returns count', async () => {
    let calls = 0;
    const db = {
      getFirstAsync: jest.fn().mockImplementation((...args: unknown[]) => {
        const sql = args[0] as string;
        if (sql.includes('SELECT ? AS n')) return Promise.resolve({ n: 1 });
        calls++;
        if (calls === 1) return Promise.reject(prepareError);
        return Promise.resolve({ count: 5 });
      }),
    };
    const count = await countCheckIns(db as any);
    expect(count).toBe(5);
  });

  it('rethrows non-prepareAsync errors without retrying', async () => {
    const otherError = new Error('SQLITE_CONSTRAINT: UNIQUE');
    const db = {
      getAllAsync: jest.fn().mockRejectedValue(otherError),
      getFirstAsync: jest.fn(),
    };
    await expect(getCheckIns(db as any)).rejects.toThrow('SQLITE_CONSTRAINT');
    expect(db.getFirstAsync).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// parseBodySignals edge cases (tested via getCheckIns)
// ---------------------------------------------------------------------------

describe('parseBodySignals (via getCheckIns)', () => {
  it('returns EMPTY_BODY_SIGNALS for invalid JSON', async () => {
    const row = { ...SAMPLE_ROW, body_signals: 'not-json' };
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue([row]) });
    const [item] = await getCheckIns(db as any);
    expect(item.bodySignals).toEqual(EMPTY_BODY_SIGNALS);
  });

  it('returns EMPTY_BODY_SIGNALS for null body_signals', async () => {
    const row = { ...SAMPLE_ROW, body_signals: 'null' };
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue([row]) });
    const [item] = await getCheckIns(db as any);
    expect(item.bodySignals).toEqual(EMPTY_BODY_SIGNALS);
  });

  it('coerces non-boolean values to null', async () => {
    const signals = {
      hunger: 'yes',
      thirst: 1,
      temperature: null,
      pain: null,
      restroom: null,
      seating: null,
      externalStimuli: null,
    };
    const row = { ...SAMPLE_ROW, body_signals: JSON.stringify(signals) };
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue([row]) });
    const [item] = await getCheckIns(db as any);
    // 'yes' is neither true nor false → null
    expect(item.bodySignals.hunger).toBeNull();
    // 1 is neither true nor false → null
    expect(item.bodySignals.thirst).toBeNull();
  });

  it('preserves explicit true and false values', async () => {
    const signals = { ...EMPTY_BODY_SIGNALS, hunger: true, thirst: false };
    const row = { ...SAMPLE_ROW, body_signals: JSON.stringify(signals) };
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue([row]) });
    const [item] = await getCheckIns(db as any);
    expect(item.bodySignals.hunger).toBe(true);
    expect(item.bodySignals.thirst).toBe(false);
  });
});
