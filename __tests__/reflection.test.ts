import { computeReflection } from '../lib/utils/reflection';
import type { CheckIn } from '../lib/types/checkin';

const BASE: CheckIn = {
  id: 1,
  createdAt: '2026-06-01T09:00:00.000Z',
  energyLevel: 3,
  focusLevel: 3,
  energySkipped: false,
  focusSkipped: false,
  bodySignals: {
    hunger: null,
    thirst: null,
    temperature: null,
    pain: null,
    restroom: null,
    seating: null,
    externalStimuli: null,
  },
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

function makeCheckIns(count: number, overrides: Partial<CheckIn> = {}): CheckIn[] {
  return Array.from({ length: count }, (_, i) => ({
    ...BASE,
    id: i + 1,
    ...overrides,
  }));
}

// ─── Test 1: 0 check-ins → intro ─────────────────────────────────────────────

test('returns intro state for 0 check-ins', () => {
  const result = computeReflection([]);
  expect(result).toEqual({ state: 'intro' });
});

// ─── Test 2: 4 check-ins → intro (below threshold) ───────────────────────────

test('returns intro state for 4 check-ins', () => {
  const result = computeReflection(makeCheckIns(4));
  expect(result).toEqual({ state: 'intro' });
});

// ─── Test 3: 5+ check-ins but all fields skipped → no pattern → intro ─────────

test('returns intro when all fields are skipped / null', () => {
  const skipped: CheckIn = {
    ...BASE,
    energySkipped: true,
    focusSkipped: true,
    distressLevel: null,
  };
  const result = computeReflection(makeCheckIns(7, skipped));
  expect(result).toEqual({ state: 'intro' });
});

// ─── Test 4: pattern exactly at threshold (≥40%, ≥3) → active ────────────────
// 7 check-ins, thirst=true in 4 of them (4/7 ≈ 57 %) → meets threshold

test('returns active with thirst line when signal present in ≥40% and ≥3 check-ins', () => {
  const checkIns: CheckIn[] = [
    ...makeCheckIns(4, { bodySignals: { ...BASE.bodySignals, thirst: true } }),
    ...makeCheckIns(3, { bodySignals: { ...BASE.bodySignals, thirst: false } }),
  ];
  const result = computeReflection(checkIns);
  expect(result.state).toBe('active');
  if (result.state === 'active') {
    expect(result.lines.some((l) => l.key === 'thirst')).toBe(true);
    expect(result.lines.find((l) => l.key === 'thirst')?.text).toBe('Du hattest oft Durst.');
  }
});

// ─── Test 5: below threshold (count < 3) → intro ─────────────────────────────
// 10 check-ins, thirst=true in 2 of them (20%) → count < 3, no pattern

test('returns intro when signal count is below 3 even if ratio is high', () => {
  const checkIns: CheckIn[] = [
    ...makeCheckIns(2, { bodySignals: { ...BASE.bodySignals, thirst: true } }),
    ...makeCheckIns(3, { bodySignals: { ...BASE.bodySignals, thirst: false } }),
  ];
  const result = computeReflection(checkIns);
  expect(result).toEqual({ state: 'intro' });
});

// ─── Test 6: more than 3 patterns → capped at 3, sorted tier asc ─────────────
// Many signals active → only top 3 by tier+ratio appear

test('caps output at 3 lines, sorted by tier then ratio descending', () => {
  // thirst (tier1), hunger (tier1), pain (tier1), externalStimuli (tier2) — all above threshold
  const checkIns: CheckIn[] = makeCheckIns(8, {
    bodySignals: {
      ...BASE.bodySignals,
      thirst: true,
      hunger: true,
      pain: true,
      externalStimuli: true,
    },
  });
  const result = computeReflection(checkIns);
  expect(result.state).toBe('active');
  if (result.state === 'active') {
    expect(result.lines.length).toBe(3);
    // All returned lines should be tier 1 (higher priority)
    const keys = result.lines.map((l) => l.key);
    expect(keys).toContain('thirst');
    expect(keys).toContain('hunger');
    expect(keys).toContain('pain');
    expect(keys).not.toContain('externalStimuli');
  }
});

// ─── Test 7: two positive dimensions → only 1 positive in output ─────────────
// energyHigh (positive, tier2) + distressLow (positive, tier2), plus pain (neutral, tier1)

test('includes at most 1 positive line', () => {
  const checkIns: CheckIn[] = makeCheckIns(8, {
    energyLevel: 5, // energyHigh
    distressLevel: 1, // distressLow
    bodySignals: { ...BASE.bodySignals, pain: true },
  });
  const result = computeReflection(checkIns);
  expect(result.state).toBe('active');
  if (result.state === 'active') {
    const positiveLines = result.lines.filter(
      (l) => l.key === 'energyHigh' || l.key === 'distressLow',
    );
    expect(positiveLines.length).toBeLessThanOrEqual(1);
  }
});

// ─── Test 8: tier 2 ranks before tier 3 ──────────────────────────────────────
// externalStimuli (tier2) and seating (tier3) both above threshold → tier2 first

test('ranks tier 2 dimension before tier 3 dimension', () => {
  const checkIns: CheckIn[] = makeCheckIns(8, {
    bodySignals: {
      ...BASE.bodySignals,
      externalStimuli: true,
      seating: true,
    },
  });
  const result = computeReflection(checkIns);
  expect(result.state).toBe('active');
  if (result.state === 'active') {
    const stimuliIdx = result.lines.findIndex((l) => l.key === 'externalStimuli');
    const seatingIdx = result.lines.findIndex((l) => l.key === 'seating');
    expect(stimuliIdx).toBeLessThan(seatingIdx);
  }
});

// ─── Test 9: uses only last 14 check-ins (window) ────────────────────────────
// 20 check-ins: first 6 have thirst, last 14 don't → no pattern

test('only considers the last 14 check-ins', () => {
  const older: CheckIn[] = makeCheckIns(6, { bodySignals: { ...BASE.bodySignals, thirst: true } });
  const recent: CheckIn[] = makeCheckIns(14, { bodySignals: { ...BASE.bodySignals, thirst: false } });
  const result = computeReflection([...older, ...recent]);
  expect(result).toEqual({ state: 'intro' });
});
