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

// ─── Test 4: pattern above threshold (≥50%, ≥3) → active ─────────────────────
// 7 check-ins, thirst=true in 4 of them (4/7 ≈ 57 %) → meets threshold

test('returns active with thirst line when signal present in ≥50% and ≥3 check-ins', () => {
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

// ─── Test 6: negativity cap — at most 2 negative lines (ND-UX calibration) ───
// Even with 4 negative patterns above threshold, the card never stacks more
// than 2 negatives. Avoids a "wall of suffering" on Home during a hard stretch.

test('caps negative lines at 2 even when more negative patterns exist', () => {
  // thirst (tier1), hunger (tier1), pain (tier1), externalStimuli (tier2) — all negative, all above threshold
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
    expect(result.lines.length).toBe(2);
    // The 2 shown lines are the higher-priority tier-1 needs, not the tier-2 signal
    const keys = result.lines.map((l) => l.key);
    expect(keys.every((k) => ['thirst', 'hunger', 'pain'].includes(k))).toBe(true);
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

// ─── Test 10: a positive line may balance 2 negatives → up to 3 lines ────────
// The negativity cap (max 2) does not limit total length when a positive is present.

test('shows 3 lines when a positive balances two negatives', () => {
  // thirst + pain (negative, tier1) + energyHigh (positive, tier2)
  const checkIns: CheckIn[] = makeCheckIns(8, {
    energyLevel: 5, // energyHigh
    bodySignals: { ...BASE.bodySignals, thirst: true, pain: true },
  });
  const result = computeReflection(checkIns);
  expect(result.state).toBe('active');
  if (result.state === 'active') {
    expect(result.lines.length).toBe(3);
    expect(result.lines.some((l) => l.key === 'energyHigh')).toBe(true);
  }
});

// ─── Test 11: pattern below 50% no longer surfaces (ND-UX: "oft" must be true) ─
// 9 check-ins, thirst=true in 4 (4/9 ≈ 44 %, count 4 ≥ 3) → under old 40% it
// would have shown; under 50% it must not.

test('does not surface a pattern below 50% ratio', () => {
  const checkIns: CheckIn[] = [
    ...makeCheckIns(4, { bodySignals: { ...BASE.bodySignals, thirst: true } }),
    ...makeCheckIns(5, { bodySignals: { ...BASE.bodySignals, thirst: false } }),
  ];
  const result = computeReflection(checkIns);
  expect(result).toEqual({ state: 'intro' });
});
