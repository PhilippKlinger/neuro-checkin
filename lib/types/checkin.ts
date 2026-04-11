export interface CheckIn {
  id: number;
  createdAt: string; // ISO 8601
  energyLevel: number; // 1-10
  focusLevel: number; // 1-10
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
}

export type CheckInInsert = Omit<CheckIn, 'id' | 'createdAt'>;
