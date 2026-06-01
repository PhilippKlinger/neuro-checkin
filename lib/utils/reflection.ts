import type { CheckIn } from '../types/checkin';
import type { ReflectionDimensionKey } from '../constants/reflectionTemplates';
import { REFLECTION_TEMPLATES } from '../constants/reflectionTemplates';

export interface ReflectionLine {
  key: ReflectionDimensionKey;
  text: string;
}

export type ReflectionResult =
  | { state: 'intro' }
  | { state: 'active'; lines: ReflectionLine[] };

const MIN_CHECK_INS = 5;
const WINDOW = 14;
const THRESHOLD_RATIO = 0.5; // ≥50% so the template word "oft" is literally true
const THRESHOLD_COUNT = 3;
const MAX_LINES = 3;
const MAX_POSITIVE = 1;
// ND-UX calibration: never stack more than 2 negative lines on Home. A positive
// line may still fill the 3rd slot, but a pure hard-stretch is capped at 2 to
// avoid a "wall of suffering" the moment the app is opened.
const MAX_NEGATIVE = 2;

interface DimensionScore {
  key: ReflectionDimensionKey;
  ratio: number;
  tier: 1 | 2 | 3;
  polarity: 'neutral' | 'positive';
}

export function computeReflection(checkIns: CheckIn[]): ReflectionResult {
  const window = checkIns.slice(-WINDOW);

  if (window.length < MIN_CHECK_INS) {
    return { state: 'intro' };
  }

  const lines = rankDimensions(window);

  if (lines.length === 0) {
    return { state: 'intro' };
  }

  return { state: 'active', lines };
}

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

  // Body signals — Tier 1
  evaluateBoolean('thirst',          checkIns.map((c) => c.bodySignals.thirst));
  evaluateBoolean('hunger',          checkIns.map((c) => c.bodySignals.hunger));
  evaluateBoolean('pain',            checkIns.map((c) => c.bodySignals.pain));

  // Body signals — Tier 2 + 3
  evaluateBoolean('externalStimuli', checkIns.map((c) => c.bodySignals.externalStimuli));
  evaluateBoolean('temperature',     checkIns.map((c) => c.bodySignals.temperature));
  evaluateBoolean('seating',         checkIns.map((c) => c.bodySignals.seating));

  // Derived numeric — Tier 2
  const energyValues = checkIns.map((c) => (!c.energySkipped && c.energyLevel > 0 ? c.energyLevel : null));
  evaluateNumeric('energyLow',    energyValues, (v) => v <= 2);
  evaluateNumeric('energyHigh',   energyValues, (v) => v >= 4);

  const distressValues = checkIns.map((c) => c.distressLevel);
  evaluateNumeric('distressHigh', distressValues, (v) => v >= 4);
  evaluateNumeric('distressLow',  distressValues, (v) => v <= 2);

  const focusValues = checkIns.map((c) => (!c.focusSkipped && c.focusLevel > 0 ? c.focusLevel : null));
  evaluateNumeric('focusLow',     focusValues, (v) => v <= 2);

  // Sort: tier asc, ratio desc within tier
  scores.sort((a, b) => a.tier !== b.tier ? a.tier - b.tier : b.ratio - a.ratio);

  // Caps: max 3 lines total, max 1 positive, max 2 negative
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
