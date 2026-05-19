import { saveUserChips, getUserChips, deleteUserChips } from '../lib/database/userChips';

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
  it('inserts a new non-standard chip with use_count 1', async () => {
    const db = makeDb();
    await saveUserChips(db as never, 'feelings', 'neblig', STANDARD_FEELINGS);
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR IGNORE'),
      expect.arrayContaining(['feelings', 'neblig'])
    );
  });

  it('increments use_count for an already-saved chip', async () => {
    const db = makeDb();
    await saveUserChips(db as never, 'feelings', 'neblig', STANDARD_FEELINGS);
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('use_count'),
      expect.arrayContaining(['feelings', 'neblig'])
    );
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

  it('splits comma-separated text and processes each part', async () => {
    const db = makeDb();
    await saveUserChips(db as never, 'feelings', 'neblig, wattig', STANDARD_FEELINGS);
    // should call runAsync for each non-standard term
    const calls = db.runAsync.mock.calls.map((c: unknown[]) => c[1] as string[]);
    const labels = calls.flatMap((args) =>
      args.filter((a) => !['feelings', 'self_care'].includes(a))
    );
    expect(labels).toContain('neblig');
    expect(labels).toContain('wattig');
  });

  it('ignores terms shorter than 2 characters', async () => {
    const db = makeDb();
    await saveUserChips(db as never, 'feelings', 'a', STANDARD_FEELINGS);
    expect(db.runAsync).not.toHaveBeenCalled();
  });

  it('ignores standard chips in a mixed list', async () => {
    const db = makeDb();
    await saveUserChips(db as never, 'feelings', 'ruhig, neblig', STANDARD_FEELINGS);
    const calls = db.runAsync.mock.calls.map((c: unknown[]) => c[1] as string[]);
    const labels = calls.flatMap((args) =>
      args.filter((a) => !['feelings', 'self_care'].includes(a))
    );
    expect(labels).toContain('neblig');
    expect(labels).not.toContain('ruhig');
  });
});

// ---------------------------------------------------------------------------
// getUserChips
// ---------------------------------------------------------------------------

describe('getUserChips', () => {
  it('returns labels of chips with use_count >= 2', async () => {
    const db = makeDb({
      getAllAsync: jest.fn().mockResolvedValue([
        { label: 'neblig', use_count: 3 },
        { label: 'wattig', use_count: 2 },
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

  it('passes correct category and min use_count to query', async () => {
    const db = makeDb();
    await getUserChips(db as never, 'feelings');
    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('use_count'),
      expect.arrayContaining(['feelings'])
    );
  });

  it('limits results to 20', async () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({ label: `chip${i}`, use_count: 3 }));
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue(rows) });
    const chips = await getUserChips(db as never, 'feelings');
    expect(chips.length).toBeLessThanOrEqual(20);
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
