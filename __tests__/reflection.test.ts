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

const sig = (o: Partial<CheckIn['bodySignals']>): CheckIn['bodySignals'] => ({
  hunger: null, thirst: null, temperature: null,
  pain: null, restroom: null, seating: null, externalStimuli: null,
  ...o,
});

// ─── Test 1: 0 check-ins → intro ─────────────────────────────────────────────

test('returns intro state for 0 check-ins', () => {
  const result = computeReflection([]);
  expect(result).toEqual({ state: 'intro' });
});

// ─── Test 2: 4 check-ins → intro (below MIN_CHECK_INS) ───────────────────────

test('returns intro state for 4 check-ins', () => {
  const result = computeReflection(makeCheckIns(4));
  expect(result).toEqual({ state: 'intro' });
});

// ─── Test 3: 5+ check-ins, energy all skipped → humble (not enough to judge) ─
// REFLECT-02: was 'intro' — now 'humble' (≥5 check-ins, answered energy < 3)

test('returns humble when energy is all skipped and nothing to judge form from', () => {
  const skipped: CheckIn = {
    ...BASE,
    energySkipped: true,
    focusSkipped: true,
    distressLevel: null,
  };
  const result = computeReflection(makeCheckIns(7, skipped));
  expect(result).toEqual({ state: 'humble' });
});

// ─── Test 4: pattern above threshold (≥50%, ≥3) → active ─────────────────────

test('returns active with thirst line when signal present in ≥50% and ≥3 check-ins', () => {
  const checkIns: CheckIn[] = [
    ...makeCheckIns(4, { bodySignals: sig({ thirst: true }) }),
    ...makeCheckIns(3, { bodySignals: sig({ thirst: false }) }),
  ];
  const result = computeReflection(checkIns);
  expect(result.state).toBe('active');
  if (result.state === 'active') {
    expect(result.lines.some((l) => l.key === 'thirst')).toBe(true);
    expect(result.lines.find((l) => l.key === 'thirst')?.text).toBe('Du hattest oft Durst.');
  }
});

// ─── Test 5: no dominant pattern, energy flat (range 0), no tense, ≤2 signals
// REFLECT-02: was 'intro' — now 'steady' (ruhige, ähnliche Tage)

test('returns steady when energy is flat and no dominant pattern', () => {
  const checkIns: CheckIn[] = [
    ...makeCheckIns(2, { bodySignals: sig({ thirst: true }) }),
    ...makeCheckIns(3, { bodySignals: sig({ thirst: false }) }),
  ];
  // energyLevel all 3 (BASE), range = 0; thirst count=2 < THRESHOLD_COUNT(3) → no active
  // 1 signal type (thirst) ≤ FORM_FEW_SIGNALS(2); no distress ≥4 → steady
  const result = computeReflection(checkIns);
  expect(result).toEqual({ state: 'steady' });
});

// ─── Test 6: negativity cap — at most 2 negative lines (ND-UX calibration) ───

test('caps negative lines at 2 even when more negative patterns exist', () => {
  const checkIns: CheckIn[] = makeCheckIns(8, {
    bodySignals: sig({ thirst: true, hunger: true, pain: true, externalStimuli: true }),
  });
  const result = computeReflection(checkIns);
  expect(result.state).toBe('active');
  if (result.state === 'active') {
    expect(result.lines.length).toBe(2);
    const keys = result.lines.map((l) => l.key);
    expect(keys.every((k) => ['thirst', 'hunger', 'pain'].includes(k))).toBe(true);
    expect(keys).not.toContain('externalStimuli');
  }
});

// ─── Test 7: two positive dimensions → only 1 positive in output ─────────────

test('includes at most 1 positive line', () => {
  const checkIns: CheckIn[] = makeCheckIns(8, {
    energyLevel: 5,
    distressLevel: 1,
    bodySignals: sig({ pain: true }),
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

test('ranks tier 2 dimension before tier 3 dimension', () => {
  const checkIns: CheckIn[] = makeCheckIns(8, {
    bodySignals: sig({ externalStimuli: true, seating: true }),
  });
  const result = computeReflection(checkIns);
  expect(result.state).toBe('active');
  if (result.state === 'active') {
    const stimuliIdx = result.lines.findIndex((l) => l.key === 'externalStimuli');
    const seatingIdx = result.lines.findIndex((l) => l.key === 'seating');
    expect(stimuliIdx).toBeLessThan(seatingIdx);
  }
});

// ─── Test 9: window — only last 14 used; no dominant pattern → steady ─────────
// REFLECT-02: was 'intro' — now 'steady' (14 recent check-ins, energy flat at 3)

test('only considers the last 14 check-ins and returns steady when energy flat', () => {
  const older: CheckIn[] = makeCheckIns(6, { bodySignals: sig({ thirst: true }) });
  const recent: CheckIn[] = makeCheckIns(14, { bodySignals: sig({ thirst: false }) });
  const result = computeReflection([...older, ...recent]);
  // thirst appears in 0 of last 14 → no active; energy all 3, range=0 → steady
  expect(result).toEqual({ state: 'steady' });
});

// ─── Test 10: positive balances 2 negatives → 3 lines total ──────────────────

test('shows 3 lines when a positive balances two negatives', () => {
  const checkIns: CheckIn[] = makeCheckIns(8, {
    energyLevel: 5,
    bodySignals: sig({ thirst: true, pain: true }),
  });
  const result = computeReflection(checkIns);
  expect(result.state).toBe('active');
  if (result.state === 'active') {
    expect(result.lines.length).toBe(3);
    expect(result.lines.some((l) => l.key === 'energyHigh')).toBe(true);
  }
});

// ─── Test 11: sub-50% pattern does not surface → steady (energy flat) ─────────
// REFLECT-02: was 'intro' — now 'steady' (no dominant pattern, energy flat)

test('does not surface sub-50% pattern and returns steady when energy is flat', () => {
  const checkIns: CheckIn[] = [
    ...makeCheckIns(4, { bodySignals: sig({ thirst: true }) }),
    ...makeCheckIns(5, { bodySignals: sig({ thirst: false }) }),
  ];
  // thirst 4/9 ≈ 44% < 50% → no active; energy all 3, range=0 → steady
  const result = computeReflection(checkIns);
  expect(result).toEqual({ state: 'steady' });
});

// ════════════════════════════════════════════════════════════════════════════
// REFLECT-02 — Form-Klassifikation (neue Tests)
// ════════════════════════════════════════════════════════════════════════════

// ─── Test 12: energy swing (≥2 low AND ≥2 high) → varied ─────────────────────

test('returns varied when energy has both low and high days', () => {
  // 8 check-ins: 3× energy=1 (low), 3× energy=5 (high), 2× energy=3
  const checkIns: CheckIn[] = [
    ...makeCheckIns(3, { energyLevel: 1 }),
    ...makeCheckIns(3, { energyLevel: 5 }),
    ...makeCheckIns(2, { energyLevel: 3 }),
  ];
  const result = computeReflection(checkIns);
  expect(result).toEqual({ state: 'varied' });
});

// ─── Test 13: distress swing (≥2 calm AND ≥2 tense) → varied ─────────────────

test('returns varied when distress swings between calm and tense days', () => {
  // energy flat=3 (no energySwing), distress: 2× low(1), 2× high(5)
  const checkIns: CheckIn[] = [
    ...makeCheckIns(2, { energyLevel: 3, distressLevel: 1 }),
    ...makeCheckIns(2, { energyLevel: 3, distressLevel: 5 }),
    ...makeCheckIns(3, { energyLevel: 3 }),
  ];
  const result = computeReflection(checkIns);
  expect(result).toEqual({ state: 'varied' });
});

// ─── Test 14: signal breadth (≥4 different signal types appeared) → varied ────

test('returns varied when ≥4 different signal types appeared across check-ins', () => {
  // energy flat=3, no individual signal dominant, but 4 different types present
  const checkIns: CheckIn[] = [
    makeCheckIns(1, { bodySignals: sig({ hunger: true }) })[0],
    makeCheckIns(1, { bodySignals: sig({ thirst: true }) })[0],
    makeCheckIns(1, { bodySignals: sig({ pain: true }) })[0],
    makeCheckIns(1, { bodySignals: sig({ externalStimuli: true }) })[0],
    ...makeCheckIns(4, {}),
  ];
  // 4 signal types appeared; each only in 1/8 = 12.5% → no dominant; breadth=4 → varied
  const result = computeReflection(checkIns);
  expect(result).toEqual({ state: 'varied' });
});

// ─── Test 15: constant low energy → active (honest dominant pattern, not "gut") ─
// energy all 2: energyLow is 100% dominant → "Deine Energie war oft niedrig."
// This is MORE honest and useful than 'steady'. The wertfrei concern is satisfied
// because the text never says "ausgeglichen" — it states the actual pattern.

test('returns active with energyLow line when energy is constantly low', () => {
  const result = computeReflection(makeCheckIns(8, { energyLevel: 2 }));
  expect(result.state).toBe('active');
  if (result.state === 'active') {
    expect(result.lines.some((l) => l.key === 'energyLow')).toBe(true);
  }
});

// ─── Test 16: humble — energy moves but neither swing nor flat ────────────────
// Energy range=2 but NOT ≥2 low AND ≥2 high → not varied; range>1 → not steady

test('returns humble when energy varies moderately but shows no clear form', () => {
  // 3× energy=1 (low≤2), 1× energy=3 (mid), 4× energy=3 → low count=3≥2 but high(≥4)=0 → no energySwing
  // 0 distress swings, 0 signal types; range = max(3)-min(1) = 2 > FORM_STEADY_RANGE(1)
  // → not varied, not steady → humble
  const checkIns: CheckIn[] = [
    ...makeCheckIns(3, { energyLevel: 1 }),
    ...makeCheckIns(5, { energyLevel: 3 }),
  ];
  const result = computeReflection(checkIns);
  expect(result).toEqual({ state: 'humble' });
});

// ─── Test 17: humble — too few answered energy values ─────────────────────────

test('returns humble when fewer than 3 energy values are answered', () => {
  // 6 check-ins: 5 energy skipped, 1 answered; distress null; no signals
  const checkIns: CheckIn[] = [
    ...makeCheckIns(5, { energySkipped: true, energyLevel: 0 }),
    makeCheckIns(1, { energyLevel: 3 })[0],
  ];
  const result = computeReflection(checkIns);
  expect(result).toEqual({ state: 'humble' });
});

// ─── Test 18: dominant pattern wins over form classification ──────────────────

test('returns active (not varied) when a dominant pattern exists alongside energy swing', () => {
  // thirst dominant (≥50%, ≥3) + energy swings (low and high) → active wins
  const checkIns: CheckIn[] = [
    ...makeCheckIns(3, { energyLevel: 1, bodySignals: sig({ thirst: true }) }),
    ...makeCheckIns(3, { energyLevel: 5, bodySignals: sig({ thirst: true }) }),
    ...makeCheckIns(2, { energyLevel: 3, bodySignals: sig({ thirst: false }) }),
  ];
  // thirst: 6/8 = 75% ≥50%, count=6 ≥3 → active
  const result = computeReflection(checkIns);
  expect(result.state).toBe('active');
  if (result.state === 'active') {
    expect(result.lines.some((l) => l.key === 'thirst')).toBe(true);
  }
});

// ─── Test 19: regression — many check-ins, no dominant pattern → varied ───────
// Verifies the "sieht kaputt aus" bug is fixed: users with many check-ins whose
// recent 14 show no dominant pattern no longer see the Intro text.
// Energy swing alone (4 low, 4 high, 6 mid — none dominant at 29%) → varied.

test('many check-ins with energy swing and no dominant pattern → varied (not intro)', () => {
  // 14 check-ins, all body signals null → no body-signal dominance possible
  // energyLow  (≤2): 4/14 ≈ 29% < 50% → not dominant
  // energyHigh (≥4): 4/14 ≈ 29% < 50% → not dominant
  // energySwing: 4 low ≥ FORM_SWING_COUNT(2) AND 4 high ≥ FORM_SWING_COUNT(2) → varied
  const checkIns: CheckIn[] = [
    ...makeCheckIns(4, { energyLevel: 1 }),
    ...makeCheckIns(4, { energyLevel: 5 }),
    ...makeCheckIns(6, { energyLevel: 3 }),
  ];
  const result = computeReflection(checkIns);
  expect(result).toEqual({ state: 'varied' });
});
