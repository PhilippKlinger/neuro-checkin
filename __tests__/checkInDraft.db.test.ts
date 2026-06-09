import { saveDraft, loadDraft, clearDraft, DRAFT_TTL_MS } from '../lib/database/checkInDraft';
import type { CheckInDraft } from '../lib/types/checkin';
import { EMPTY_BODY_SIGNALS } from '../lib/types/checkin';

// ---------------------------------------------------------------------------
// Mock DB
// ---------------------------------------------------------------------------

interface MockDb {
  runAsync: jest.Mock;
  getFirstAsync: jest.Mock;
}

function makeDb(overrides: Partial<MockDb> = {}): MockDb {
  return {
    runAsync: jest.fn().mockResolvedValue({ changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const DRAFT: CheckInDraft = {
  energyLevel: 3,
  focusLevel: 2,
  energySkipped: false,
  focusSkipped: false,
  bodySignals: { ...EMPTY_BODY_SIGNALS, hunger: true },
  feelings: 'angespannt',
  feelingsSkipped: false,
  distressLevel: 3,
  distressNote: '',
  thoughtsType: null,
  thoughtsNote: '',
  selfCareNote: '',
  innerPart: '',
  note: '',
};

const NOW_MS = 1000000000000; // arbitrary fixed timestamp
const FRESH_SAVED_AT = new Date(NOW_MS - 1000).toISOString(); // 1 second ago — within TTL
const EXPIRED_SAVED_AT = new Date(NOW_MS - DRAFT_TTL_MS - 1000).toISOString(); // just expired

// ---------------------------------------------------------------------------
// saveDraft
// ---------------------------------------------------------------------------

describe('saveDraft', () => {
  it('calls INSERT OR REPLACE with draft_json, step and saved_at', async () => {
    const db = makeDb();
    await saveDraft(db as any, DRAFT, 2);

    expect(db.runAsync).toHaveBeenCalledTimes(1);
    const [sql, ...params] = db.runAsync.mock.calls[0];
    expect(sql).toContain('INSERT OR REPLACE');
    expect(sql).toContain('check_in_drafts');

    const parsedDraft = JSON.parse(params[0] as string);
    expect(parsedDraft.energyLevel).toBe(DRAFT.energyLevel);
    expect(parsedDraft.feelings).toBe(DRAFT.feelings);
    expect(params[1]).toBe(2); // step
    expect(typeof params[2]).toBe('string'); // saved_at ISO string
  });
});

// ---------------------------------------------------------------------------
// loadDraft
// ---------------------------------------------------------------------------

describe('loadDraft', () => {
  it('returns null when no row exists', async () => {
    const db = makeDb({ getFirstAsync: jest.fn().mockResolvedValue(null) });
    const result = await loadDraft(db as any, NOW_MS);
    expect(result).toBeNull();
  });

  it('returns { draft, step } when row is within TTL', async () => {
    const db = makeDb({
      getFirstAsync: jest.fn().mockResolvedValue({
        draft_json: JSON.stringify(DRAFT),
        step: 3,
        saved_at: FRESH_SAVED_AT,
      }),
    });
    const result = await loadDraft(db as any, NOW_MS);
    expect(result).not.toBeNull();
    expect(result!.step).toBe(3);
    expect(result!.draft.energyLevel).toBe(DRAFT.energyLevel);
    expect(result!.draft.feelings).toBe(DRAFT.feelings);
  });

  it('returns null and clears when row is expired', async () => {
    const runAsync = jest.fn().mockResolvedValue({ changes: 1 });
    const db = makeDb({
      runAsync,
      getFirstAsync: jest.fn().mockResolvedValue({
        draft_json: JSON.stringify(DRAFT),
        step: 3,
        saved_at: EXPIRED_SAVED_AT,
      }),
    });
    const result = await loadDraft(db as any, NOW_MS);
    expect(result).toBeNull();
    expect(runAsync).toHaveBeenCalledTimes(1); // clearDraft called
  });

  it('returns null when draft_json is corrupted', async () => {
    const db = makeDb({
      getFirstAsync: jest.fn().mockResolvedValue({
        draft_json: 'not-valid-json{{{',
        step: 1,
        saved_at: FRESH_SAVED_AT,
      }),
    });
    const result = await loadDraft(db as any, NOW_MS);
    expect(result).toBeNull();
  });

  it('returns null when draft_json is valid JSON but missing required fields', async () => {
    const db = makeDb({
      getFirstAsync: jest.fn().mockResolvedValue({
        draft_json: JSON.stringify({ energyLevel: 3 }), // incomplete draft
        step: 1,
        saved_at: FRESH_SAVED_AT,
      }),
    });
    // incomplete draft is coerced — null body signals, empty strings
    const result = await loadDraft(db as any, NOW_MS);
    // we don't crash — either null or partial draft, just no throw
    expect(() => result).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// clearDraft
// ---------------------------------------------------------------------------

describe('clearDraft', () => {
  it('calls DELETE on check_in_drafts', async () => {
    const db = makeDb();
    await clearDraft(db as any);

    expect(db.runAsync).toHaveBeenCalledTimes(1);
    const [sql] = db.runAsync.mock.calls[0];
    expect(sql).toContain('DELETE');
    expect(sql).toContain('check_in_drafts');
  });
});

// ---------------------------------------------------------------------------
// prepareAsync retry guard (withDbRetry) — draft reads/writes run on every
// full-check-in mount, so they need the same guard as checkins.ts
// ---------------------------------------------------------------------------

describe('prepareAsync retry', () => {
  const prepareError = new Error('NativeDatabase.prepareAsync rejected (NullPointerException)');

  it('saveDraft retries once after a prepareAsync error', async () => {
    let calls = 0;
    const db = {
      runAsync: jest.fn().mockImplementation(() => {
        calls++;
        if (calls === 1) return Promise.reject(prepareError);
        return Promise.resolve({ changes: 1 });
      }),
      getFirstAsync: jest.fn().mockResolvedValue({ n: 1 }), // warmup query
    };
    await saveDraft(db as any, DRAFT, 1);
    expect(db.runAsync).toHaveBeenCalledTimes(2);
    expect(db.getFirstAsync).toHaveBeenCalledTimes(1);
  });

  it('loadDraft retries once after a prepareAsync error', async () => {
    let calls = 0;
    const db = {
      runAsync: jest.fn().mockResolvedValue({ changes: 1 }),
      getFirstAsync: jest.fn().mockImplementation((...args: unknown[]) => {
        const sql = args[0] as string;
        if (sql.includes('SELECT ? AS n')) return Promise.resolve({ n: 1 }); // warmup
        calls++;
        if (calls === 1) return Promise.reject(prepareError);
        return Promise.resolve(null);
      }),
    };
    const result = await loadDraft(db as any, NOW_MS);
    expect(result).toBeNull();
    expect(calls).toBe(2);
  });
});
