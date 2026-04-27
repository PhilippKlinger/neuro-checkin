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
  colorMode: 'light' | 'dark' | 'system';
  reminderEnabled: boolean;
  reminderTime: string | null; // HH:mm format — deprecated, kept for migration only
  language: 'de' | 'en';
  onboardingCompleted: boolean;
}

/** A single configurable notification time slot (e.g. morning or evening). */
export interface NotificationSlot {
  id: 0 | 1;       // 0 = morning, 1 = evening
  enabled: boolean;
  time: string;     // HH:mm
  weekdays: number; // bitmask: Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32, Sun=64
}

/** Human-readable short labels for weekdays (index 0 = Monday). */
export const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;

/** Bitmask values per weekday (index 0 = Monday). */
export const WEEKDAY_BITS = [1, 2, 4, 8, 16, 32, 64] as const;

/** All weekdays active. */
export const ALL_WEEKDAYS = 127;

/** Monday–Friday bitmask (bits 0–4). */
export const WORKDAYS = 1 | 2 | 4 | 8 | 16;

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
 * Returns '—' for 0 (not captured, e.g. focusLevel in quick check-ins).
 * Falls back to the raw number string for legacy data stored with old 1-10 scale.
 */
export function getLevelLabel(value: number, labels: readonly string[]): string {
  if (value === 0) return '—';
  return labels[value - 1] ?? String(value);
}

export const SIGNAL_LABELS: Record<keyof BodySignals, string> = {
  hunger: 'Hunger',
  thirst: 'Durst',
  temperature: 'Temperatur',
  pain: 'Schmerzen',
  restroom: 'Toilette',
  seating: 'Sitzposition',
  externalStimuli: 'Reize',
};

export function getThoughtsLabel(type: string | null): string {
  switch (type) {
    case 'supportive': return 'Unterstützend';
    case 'burdening': return 'Belastend';
    case 'mixed': return 'Gemischt';
    default: return '—';
  }
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
