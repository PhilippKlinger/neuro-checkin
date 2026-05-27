import {
  saveUserChips,
  getUserChips,
  deleteUserChips,
  countUserChipsByCategory,
} from '../lib/database/userChips';
import { MAX_USER_CHIPS_PER_CATEGORY } from '../lib/constants/userChips';

// ---------------------------------------------------------------------------
// Minimal expo-sqlite mock
// ---------------------------------------------------------------------------

interface MockDb {
  runAsync: jest.Mock;
  getAllAsync: jest.Mock;
  getFirstAsync: jest.Mock;
  execAsync: jest.Mock;
}

function makeDb(overrides: Partial<MockDb> = {}): MockDb {
  return {
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getAllAsync: jest.fn().mockResolvedValue([]),
    // Default: chip doesn't exist (null), count is 0 (null → 0)
    getFirstAsync: jest.fn().mockResolvedValue(null),
    execAsync: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Standard chips (dedup targets)
// ---------------------------------------------------------------------------

const STANDARD_FEELINGS = ['neutral', 'leer', 'erschöpft', 'ruhig', 'angespannt'];

// ---------------------------------------------------------------------------
// saveUserChips
// ---------------------------------------------------------------------------

describe('saveUserChips', () => {
  it('inserts a new non-standard chip via INSERT OR IGNORE', async () => {
    const db = makeDb();
    await saveUserChips(db as never, 'feelings', 'neblig', STANDARD_FEELINGS);
    const insertCall = db.runAsync.mock.calls.find(
      (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('INSERT OR IGNORE')
    );
    expect(insertCall).toBeDefined();
  });

  it('increments use_count after inserting', async () => {
    const db = makeDb();
    await saveUserChips(db as never, 'feelings', 'neblig', STANDARD_FEELINGS);
    const updateCall = db.runAsync.mock.calls.find(
      (c: unknown[]) =>
        typeof c[0] === 'string' && (c[0] as string).includes('use_count = use_count + 1')
    );
    expect(updateCall).toBeDefined();
  });

  it('uses normalized_label in INSERT (lowercase)', async () => {
    const db = makeDb();
    await saveUserChips(db as never, 'feelings', 'Neblig', STANDARD_FEELINGS);
    const insertCall = db.runAsync.mock.calls.find(
      (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('INSERT OR IGNORE')
    );
    expect(insertCall).toBeDefined();
    // normalized_label should be 'neblig' (lowercase of 'Neblig')
    const params = insertCall[1] as unknown[];
    expect(params).toContain('neblig'); // normalized_label
  });

  it('ignores chips that exist in the standard list', async () => {
    const db = makeDb();
    await saveUserChips(db as never, 'feelings', 'ruhig', STANDARD_FEELINGS);
    expect(db.runAsync).not.toHaveBeenCalled();
  });

  it('ignores empty or whitespace-only text', async () => {
    const db = makeDb();
    await saveUserChips(db as never, 'feelings', '   ', STANDARD_FEELINGS);
    expect(db.runAsync).not.toHaveBeenCalled();
  });

  it('splits comma-separated text and processes each valid part', async () => {
    const db = makeDb();
    await saveUserChips(db as never, 'feelings', 'neblig, wattig', STANDARD_FEELINGS);
    // should have INSERT calls for both terms
    const insertCalls = db.runAsync.mock.calls.filter(
      (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('INSERT OR IGNORE')
    );
    expect(insertCalls.length).toBe(2);
  });

  it('ignores terms shorter than 2 characters', async () => {
    const db = makeDb();
    await saveUserChips(db as never, 'feelings', 'a', STANDARD_FEELINGS);
    expect(db.runAsync).not.toHaveBeenCalled();
  });

  it('ignores standard chips in a mixed list but saves user terms', async () => {
    const db = makeDb();
    await saveUserChips(db as never, 'feelings', 'ruhig, neblig', STANDARD_FEELINGS);
    const insertCalls = db.runAsync.mock.calls.filter(
      (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('INSERT OR IGNORE')
    );
    // Only one INSERT — for 'neblig', not for 'ruhig'
    expect(insertCalls.length).toBe(1);
    const params = insertCalls[0][1] as unknown[];
    expect(params).toContain('neblig');
    expect(params).not.toContain('ruhig');
  });

  it('does not insert a NEW chip when category is at MAX_USER_CHIPS_PER_CATEGORY', async () => {
    const db = makeDb({
      getFirstAsync: jest
        .fn()
        // First call: chip existence check → null (chip is new)
        .mockResolvedValueOnce(null)
        // Second call: category count → at limit
        .mockResolvedValueOnce({ count: MAX_USER_CHIPS_PER_CATEGORY }),
    });
    await saveUserChips(db as never, 'feelings', 'neblig', STANDARD_FEELINGS);
    expect(db.runAsync).not.toHaveBeenCalled();
  });

  it('still increments use_count for an EXISTING chip even when category is at limit', async () => {
    const db = makeDb({
      getFirstAsync: jest
        .fn()
        // First call: chip existence check → chip already exists
        .mockResolvedValueOnce({ id: 5, normalized_label: 'neblig' }),
      // No count check needed when chip already exists
    });
    await saveUserChips(db as never, 'feelings', 'neblig', STANDARD_FEELINGS);
    const updateCall = db.runAsync.mock.calls.find(
      (c: unknown[]) =>
        typeof c[0] === 'string' && (c[0] as string).includes('use_count = use_count + 1')
    );
    expect(updateCall).toBeDefined();
  });

  it('ignores terms longer than MAX_LABEL_LENGTH', async () => {
    const db = makeDb();
    const longTerm = 'a'.repeat(31);
    await saveUserChips(db as never, 'feelings', longTerm, STANDARD_FEELINGS);
    expect(db.runAsync).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getUserChips
// ---------------------------------------------------------------------------

describe('getUserChips', () => {
  it('returns labels of chips with use_count >= 1', async () => {
    const db = makeDb({
      getAllAsync: jest.fn().mockResolvedValue([
        { label: 'neblig', use_count: 3 },
        { label: 'wattig', use_count: 1 },
      ]),
    });
    const chips = await getUserChips(db as never, 'feelings');
    expect(chips).toEqual(['neblig', 'wattig']);
  });

  it('returns empty array when no chips qualify', async () => {
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue([]) });
    const chips = await getUserChips(db as never, 'self_care');
    expect(chips).toEqual([]);
  });

  it('passes correct category to query', async () => {
    const db = makeDb();
    await getUserChips(db as never, 'feelings');
    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('use_count'),
      expect.arrayContaining(['feelings'])
    );
  });

  it(`limits results to MAX_USER_CHIPS_PER_CATEGORY (${MAX_USER_CHIPS_PER_CATEGORY})`, async () => {
    // DB returns more than the limit — getUserChips should only get up to MAX
    const rows = Array.from({ length: 15 }, (_, i) => ({ label: `chip${i}`, use_count: 3 }));
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue(rows) });
    const chips = await getUserChips(db as never, 'feelings');
    // LIMIT is enforced in SQL — mock returns all 15, but we trust DB to apply LIMIT
    // The query string must contain the limit constant
    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining(`${MAX_USER_CHIPS_PER_CATEGORY}`),
      expect.anything()
    );
    // Since mock bypasses SQL LIMIT, just verify query contains it
    expect(chips.length).toBe(15); // mock bypasses SQL, that's expected
  });

  it('does not apply redundant JS-side slice', async () => {
    // R-02 fix: no .slice(0, 20) after the DB call — LIMIT in SQL is enough
    const rows = Array.from({ length: 5 }, (_, i) => ({ label: `chip${i}`, use_count: 2 }));
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue(rows) });
    const chips = await getUserChips(db as never, 'feelings');
    expect(chips).toHaveLength(5); // all 5 returned, no extra slice
  });
});

// ---------------------------------------------------------------------------
// countUserChipsByCategory
// ---------------------------------------------------------------------------

describe('countUserChipsByCategory', () => {
  it('returns 0 when no chips exist', async () => {
    const db = makeDb({ getFirstAsync: jest.fn().mockResolvedValue(null) });
    const count = await countUserChipsByCategory(db as never, 'feelings');
    expect(count).toBe(0);
  });

  it('returns the count for the given category', async () => {
    const db = makeDb({
      getFirstAsync: jest.fn().mockResolvedValue({ count: 7 }),
    });
    const count = await countUserChipsByCategory(db as never, 'feelings');
    expect(count).toBe(7);
  });

  it('passes the category to the query', async () => {
    const db = makeDb({ getFirstAsync: jest.fn().mockResolvedValue({ count: 0 }) });
    await countUserChipsByCategory(db as never, 'self_care');
    expect(db.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining('category'),
      expect.arrayContaining(['self_care'])
    );
  });
});

// ---------------------------------------------------------------------------
// deleteUserChips
// ---------------------------------------------------------------------------

describe('deleteUserChips', () => {
  it('deletes all chips when no category is given', async () => {
    const db = makeDb();
    await deleteUserChips(db as never);
    expect(db.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE'), []);
  });

  it('deletes only chips for the given category', async () => {
    const db = makeDb();
    await deleteUserChips(db as never, 'feelings');
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE'),
      expect.arrayContaining(['feelings'])
    );
  });
});
