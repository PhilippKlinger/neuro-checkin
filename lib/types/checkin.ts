export interface CheckIn {
  id: number;
  createdAt: string; // ISO 8601
  energyLevel: number; // 1-5
  focusLevel: number; // 1-5
  bodySignals: BodySignals;
  feelings: string; // free text
  thoughtsType: 'supportive' | 'burdening' | 'mixed' | null;
  thoughtsNote: string | null;
  selfCareNote: string | null;
  innerPart: string | null; // optional IFS part name
  note: string | null; // general note
}

export interface BodySignals {
  hunger: boolean | null;
  thirst: boolean | null;
  temperature: boolean | null; // true = uncomfortable
  pain: boolean | null;
  restroom: boolean | null;
  seating: boolean | null; // uncomfortable seating
  externalStimuli: boolean | null; // light, noise, smell
}

export interface UserSettings {
  id: number;
  themeName: string;
  reminderEnabled: boolean;
  reminderTime: string | null; // HH:mm format
  language: 'de' | 'en';
  onboardingCompleted: boolean;
}

export type CheckInInsert = Omit<CheckIn, 'id' | 'createdAt'>;

/** State that builds up during the check-in flow */
export interface CheckInDraft {
  energyLevel: number; // 1-5
  focusLevel: number; // 1-5
  bodySignals: BodySignals;
  feelings: string;
  thoughtsType: 'supportive' | 'burdening' | 'mixed' | null;
  thoughtsNote: string;
  selfCareNote: string;
  innerPart: string;
  note: string;
}

export const EMPTY_BODY_SIGNALS: BodySignals = {
  hunger: null,
  thirst: null,
  temperature: null,
  pain: null,
  restroom: null,
  seating: null,
  externalStimuli: null,
};

/** Semantic labels for the 5-step energy scale (index 0 = level 1). */
export const ENERGY_LABELS = ['Sehr wenig', 'Wenig', 'Mittel', 'Viel', 'Sehr viel'] as const;

/** Semantic labels for the 5-step focus scale (index 0 = level 1). */
export const FOCUS_LABELS = ['Kaum', 'Wenig', 'Mittel', 'Gut', 'Voll'] as const;

/**
 * Returns the semantic label for a level value (1-based).
 * Falls back to the raw number string for legacy data stored with old 1-10 scale.
 */
export function getLevelLabel(value: number, labels: readonly string[]): string {
  return labels[value - 1] ?? String(value);
}

export const EMPTY_DRAFT: CheckInDraft = {
  energyLevel: 0, // 0 = unselected, forces active choice
  focusLevel: 0,  // 0 = unselected, forces active choice
  bodySignals: { ...EMPTY_BODY_SIGNALS },
  feelings: '',
  thoughtsType: null,
  thoughtsNote: '',
  selfCareNote: '',
  innerPart: '',
  note: '',
};
