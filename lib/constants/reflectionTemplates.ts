export type ReflectionDimensionKey =
  | 'thirst'
  | 'hunger'
  | 'pain'
  | 'externalStimuli'
  | 'energyLow'
  | 'energyHigh'
  | 'distressHigh'
  | 'distressLow'
  | 'focusLow'
  | 'temperature'
  | 'seating';

export interface ReflectionTemplate {
  text: string;
  tier: 1 | 2 | 3;
  polarity: 'neutral' | 'positive';
}

export const REFLECTION_TEMPLATES: Record<ReflectionDimensionKey, ReflectionTemplate> = {
  // Tier 1 — Bedürfnisse
  thirst: { text: 'Du hattest oft Durst.', tier: 1, polarity: 'neutral' },
  hunger: { text: 'Du hattest oft Hunger.', tier: 1, polarity: 'neutral' },
  pain: { text: 'Du hattest oft Schmerzen.', tier: 1, polarity: 'neutral' },

  // Tier 2 — Zustände + Sensorik
  externalStimuli: { text: 'Reize waren oft viel für dich.', tier: 2, polarity: 'neutral' },
  energyLow: { text: 'Deine Energie war oft niedrig.', tier: 2, polarity: 'neutral' },
  energyHigh: { text: 'Deine Energie war oft hoch.', tier: 2, polarity: 'positive' },
  distressHigh: { text: 'Du warst oft angespannt.', tier: 2, polarity: 'neutral' },
  distressLow: { text: 'Du warst oft ruhig.', tier: 2, polarity: 'positive' },
  focusLow: { text: 'Dein Fokus war oft niedrig.', tier: 2, polarity: 'neutral' },

  // Tier 3 — Komfort
  temperature: { text: 'Dir war oft zu warm oder zu kalt.', tier: 3, polarity: 'neutral' },
  seating: { text: 'Du saßt oft unbequem.', tier: 3, polarity: 'neutral' },
};

export const REFLECTION_EYEBROW = 'Deine Muster';
export const REFLECTION_INTRO_LINE = 'Mach ein paar Check-ins. Dann zeigt sich hier, was wiederkehrt.';

// REFLECT-02 — Form-Zustände (kein dominantes Einzel-Muster, aber Form erkennbar)
// Strings final via /nd-ux (Dr. Bergmann, 2026-06-01): wertfrei, im "Deine Tage …"-Rhythmus.
export const REFLECTION_STEADY_LINE = 'Deine Tage waren sich ähnlich.';
export const REFLECTION_VARIED_LINE = 'Deine Tage waren sehr unterschiedlich.';
export const REFLECTION_HUMBLE_LINE = 'Deine Tage lassen sich gerade schwer zusammenfassen.';
