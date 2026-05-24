import { isStepBlocked, isInactivityExpired } from '../lib/utils/checkInFlow';
import type { CheckInDraft } from '../lib/types/checkin';
import { EMPTY_BODY_SIGNALS, EMPTY_DRAFT } from '../lib/types/checkin';

const baseDraft: CheckInDraft = {
  ...EMPTY_DRAFT,
  bodySignals: { ...EMPTY_BODY_SIGNALS },
};

// ---------------------------------------------------------------------------
// isStepBlocked
// ---------------------------------------------------------------------------

describe('isStepBlocked', () => {
  describe('step 1 (energy)', () => {
    it('blocks when energyLevel is 0 and not skipped', () => {
      const draft = { ...baseDraft, energyLevel: 0, energySkipped: false };
      expect(isStepBlocked(1, draft)).toBe(true);
    });

    it('is not blocked when energyLevel is set', () => {
      const draft = { ...baseDraft, energyLevel: 3, energySkipped: false };
      expect(isStepBlocked(1, draft)).toBe(false);
    });

    it('is not blocked when skipped', () => {
      const draft = { ...baseDraft, energyLevel: 0, energySkipped: true };
      expect(isStepBlocked(1, draft)).toBe(false);
    });

    it('is not blocked when both level set and skipped', () => {
      const draft = { ...baseDraft, energyLevel: 2, energySkipped: true };
      expect(isStepBlocked(1, draft)).toBe(false);
    });
  });

  describe('step 2 (focus)', () => {
    it('blocks when focusLevel is 0 and not skipped', () => {
      const draft = { ...baseDraft, focusLevel: 0, focusSkipped: false };
      expect(isStepBlocked(2, draft)).toBe(true);
    });

    it('is not blocked when focusLevel is set', () => {
      const draft = { ...baseDraft, focusLevel: 5, focusSkipped: false };
      expect(isStepBlocked(2, draft)).toBe(false);
    });

    it('is not blocked when skipped', () => {
      const draft = { ...baseDraft, focusLevel: 0, focusSkipped: true };
      expect(isStepBlocked(2, draft)).toBe(false);
    });
  });

  describe('other steps', () => {
    it('is never blocked on step 0', () => {
      expect(isStepBlocked(0, baseDraft)).toBe(false);
    });

    it('is never blocked on step 3', () => {
      expect(isStepBlocked(3, baseDraft)).toBe(false);
    });

    it('is never blocked on step 8', () => {
      expect(isStepBlocked(8, baseDraft)).toBe(false);
    });

    it('step 1 blocking does not affect step 2 check', () => {
      const draft = { ...baseDraft, energyLevel: 0, energySkipped: false, focusLevel: 3 };
      expect(isStepBlocked(2, draft)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// isInactivityExpired
// ---------------------------------------------------------------------------

describe('isInactivityExpired', () => {
  const ONE_HOUR_MS = 60 * 60 * 1000;

  it('returns false when leftAt is null', () => {
    expect(isInactivityExpired(null, Date.now(), ONE_HOUR_MS)).toBe(false);
  });

  it('returns false when elapsed time is less than timeout', () => {
    const now = 1_000_000;
    const leftAt = now - ONE_HOUR_MS + 1; // 1 ms before expiry
    expect(isInactivityExpired(leftAt, now, ONE_HOUR_MS)).toBe(false);
  });

  it('returns false when elapsed time equals timeout exactly', () => {
    const now = 1_000_000;
    const leftAt = now - ONE_HOUR_MS; // exactly at the boundary
    expect(isInactivityExpired(leftAt, now, ONE_HOUR_MS)).toBe(false);
  });

  it('returns true when elapsed time exceeds timeout by 1 ms', () => {
    const now = 1_000_000;
    const leftAt = now - ONE_HOUR_MS - 1;
    expect(isInactivityExpired(leftAt, now, ONE_HOUR_MS)).toBe(true);
  });

  it('returns true when clearly expired (2 hours elapsed, 1 hour timeout)', () => {
    const now = 1_000_000;
    const leftAt = now - 2 * ONE_HOUR_MS;
    expect(isInactivityExpired(leftAt, now, ONE_HOUR_MS)).toBe(true);
  });

  it('respects a custom timeout value', () => {
    const FIVE_MIN_MS = 5 * 60 * 1000;
    const now = 1_000_000;
    expect(isInactivityExpired(now - FIVE_MIN_MS - 1, now, FIVE_MIN_MS)).toBe(true);
    expect(isInactivityExpired(now - FIVE_MIN_MS, now, FIVE_MIN_MS)).toBe(false);
  });
});
