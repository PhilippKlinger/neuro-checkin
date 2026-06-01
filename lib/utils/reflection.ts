import type { CheckIn } from '../types/checkin';
import type { ReflectionDimensionKey } from '../constants/reflectionTemplates';
import { REFLECTION_TEMPLATES } from '../constants/reflectionTemplates';

export interface ReflectionLine {
  key: ReflectionDimensionKey;
  text: string;
}

export type ReflectionResult =
  | { state: 'intro' }
  | { state: 'humble' }
  | { state: 'steady' }
  | { state: 'varied' }
  | { state: 'active'; lines: ReflectionLine[] };

// ─── Dominanz-Schwellen ───────────────────────────────────────────────────────
const MIN_CHECK_INS    = 5;
const WINDOW           = 14;
const THRESHOLD_RATIO  = 0.5; // ≥50% so the template word "oft" is literally true
const THRESHOLD_COUNT  = 3;
const MAX_LINES        = 3;
const MAX_POSITIVE     = 1;
// ND-UX calibration: never stack more than 2 negative lines on Home.
const MAX_NEGATIVE     = 2;

// ─── Form-Schwellen (Heuristik, kalibrierbar — assumptions A-44) ─────────────
const FORM_MIN_ENERGY    = 3; // min answered energy values to classify form
const FORM_SWING_COUNT   = 2; // ≥N low AND ≥N high → wechselhaft
const FORM_BREADTH_TYPES = 4; // ≥N distinct signal types appeared → wechselhaft
const FORM_STEADY_RANGE  = 1; // energy max−min ≤ N → ruhig
const FORM_FEW_SIGNALS   = 2; // ≤N distinct signal types → ruhig

interface DimensionScore {
  key: ReflectionDimensionKey;
  ratio: number;
  tier: 1 | 2 | 3;
  polarity: 'neutral' | 'positive';
}

export function computeReflection(checkIns: CheckIn[]): ReflectionResult {
  const sorted = [...checkIns].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const window = sorted.slice(-WINDOW);

  if (window.length < MIN_CHECK_INS) {
    return { state: 'intro' };
  }

  const lines = rankDimensions(window);

  if (lines.length > 0) {
    return { state: 'active', lines };
  }

  return classifyForm(window);
}

// ─── Dominanz-Ranking (unverändert gegenüber REFLECT-01) ─────────────────────

function rankDimensions(checkIns: CheckIn[]): ReflectionLine[] {
  const scores: DimensionScore[] = [];

  function evaluateBoolean(key: ReflectionDimensionKey, values: (boolean | null)[]) {
    const answered = values.filter((v) => v !== null) as boolean[];
    const matchCount = answered.filter((v) => v === true).length;
    if (answered.length === 0) return;
    const ratio = matchCount / answered.length;
    if (ratio >= THRESHOLD_RATIO && matchCount >= THRESHOLD_COUNT) {
      const t = REFLECTION_TEMPLATES[key];
      scores.push({ key, ratio, tier: t.tier, polarity: t.polarity });
    }
  }

  function evaluateNumeric(
    key: ReflectionDimensionKey,
    values: (number | null)[],
    isMatch: (v: number) => boolean,
  ) {
    const answered = values.filter((v) => v !== null) as number[];
    const matchCount = answered.filter(isMatch).length;
    if (answered.length === 0) return;
    const ratio = matchCount / answered.length;
    if (ratio >= THRESHOLD_RATIO && matchCount >= THRESHOLD_COUNT) {
      const t = REFLECTION_TEMPLATES[key];
      scores.push({ key, ratio, tier: t.tier, polarity: t.polarity });
    }
  }

  evaluateBoolean('thirst',          checkIns.map((c) => c.bodySignals.thirst));
  evaluateBoolean('hunger',          checkIns.map((c) => c.bodySignals.hunger));
  evaluateBoolean('pain',            checkIns.map((c) => c.bodySignals.pain));
  evaluateBoolean('externalStimuli', checkIns.map((c) => c.bodySignals.externalStimuli));
  evaluateBoolean('temperature',     checkIns.map((c) => c.bodySignals.temperature));
  evaluateBoolean('seating',         checkIns.map((c) => c.bodySignals.seating));

  const energyValues = checkIns.map((c) => (!c.energySkipped && c.energyLevel > 0 ? c.energyLevel : null));
  evaluateNumeric('energyLow',    energyValues, (v) => v <= 2);
  evaluateNumeric('energyHigh',   energyValues, (v) => v >= 4);

  const distressValues = checkIns.map((c) => c.distressLevel);
  evaluateNumeric('distressHigh', distressValues, (v) => v >= 4);
  evaluateNumeric('distressLow',  distressValues, (v) => v <= 2);

  const focusValues = checkIns.map((c) => (!c.focusSkipped && c.focusLevel > 0 ? c.focusLevel : null));
  evaluateNumeric('focusLow',     focusValues, (v) => v <= 2);

  scores.sort((a, b) => a.tier !== b.tier ? a.tier - b.tier : b.ratio - a.ratio);

  const lines: ReflectionLine[] = [];
  let positiveCount = 0;
  let negativeCount = 0;

  for (const s of scores) {
    if (lines.length >= MAX_LINES) break;
    if (s.polarity === 'positive') {
      if (positiveCount >= MAX_POSITIVE) continue;
      positiveCount++;
    } else {
      if (negativeCount >= MAX_NEGATIVE) continue;
      negativeCount++;
    }
    lines.push({ key: s.key, text: REFLECTION_TEMPLATES[s.key].text });
  }

  return lines;
}

// ─── Form-Klassifikation (REFLECT-02) ────────────────────────────────────────

function classifyForm(checkIns: CheckIn[]): ReflectionResult {
  const energyValues = checkIns
    .map((c) => (!c.energySkipped && c.energyLevel > 0 ? c.energyLevel : null))
    .filter((v): v is number => v !== null);

  if (energyValues.length < FORM_MIN_ENERGY) {
    return { state: 'humble' };
  }

  const distressValues = checkIns
    .map((c) => c.distressLevel)
    .filter((v): v is number => v !== null);

  // Count distinct body-signal keys that were `true` in at least one check-in
  const signalKeys: Array<keyof CheckIn['bodySignals']> = [
    'hunger', 'thirst', 'temperature', 'pain', 'restroom', 'seating', 'externalStimuli',
  ];
  const signalTypes = signalKeys.filter((k) =>
    checkIns.some((c) => c.bodySignals[k] === true),
  ).length;

  // VARIED — wechselhaft: Energie-Swing ODER Distress-Swing ODER viele verschiedene Signale
  const energySwing =
    energyValues.filter((v) => v <= 2).length >= FORM_SWING_COUNT &&
    energyValues.filter((v) => v >= 4).length >= FORM_SWING_COUNT;

  const distressSwing =
    distressValues.filter((v) => v <= 2).length >= FORM_SWING_COUNT &&
    distressValues.filter((v) => v >= 4).length >= FORM_SWING_COUNT;

  const signalBreadth = signalTypes >= FORM_BREADTH_TYPES;

  if (energySwing || distressSwing || signalBreadth) {
    return { state: 'varied' };
  }

  // STEADY — ruhig: Energie eng beisammen, keine Anspannungs-Spitzen, wenig Signalbreite
  const energyRange = Math.max(...energyValues) - Math.min(...energyValues);
  const noTense     = distressValues.filter((v) => v >= 4).length === 0;
  const fewSignals  = signalTypes <= FORM_FEW_SIGNALS;

  if (energyRange <= FORM_STEADY_RANGE && noTense && fewSignals) {
    return { state: 'steady' };
  }

  // Dazwischen: Bewegung, aber weder klarer Swing noch eng-ruhig
  return { state: 'humble' };
}
