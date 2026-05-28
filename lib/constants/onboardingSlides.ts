export type OnboardingSlideKind =
  | 'enso'
  | 'levelDemo'
  | 'bulbDemo'
  | 'notificationPriming'
  | 'palette';

export interface OnboardingBullet {
  icon: string;
  text: string;
}

export interface OnboardingSlideContent {
  kind: OnboardingSlideKind;
  title: string;
  body?: string;
  bullets?: OnboardingBullet[];
  ctaLabel: string;
  hasSkip: boolean;
}

export const ONBOARDING_SLIDES: OnboardingSlideContent[] = [
  {
    kind: 'enso',
    title: 'Schau einmal hin.',
    body: 'Wie geht es dir gerade — Körper, Gefühle, Gedanken?',
    ctaLabel: 'Weiter',
    hasSkip: true,
  },
  {
    kind: 'levelDemo',
    title: 'So sieht ein Schritt aus.',
    bullets: [
      { icon: '9', text: '*9 Schritte* beim vollen Check-in. Oder *3* beim Schnell-Check.' },
      { icon: '↷', text: '*Jeder Schritt ist freiwillig.* Skip-Button rechts unten.' },
      { icon: '≈', text: '*Eine grobe Schätzung reicht.* Keine Skala muss exakt sein.' },
    ],
    ctaLabel: 'Weiter',
    hasSkip: true,
  },
  {
    kind: 'bulbDemo',
    title: 'Hilfe wenn du sie brauchst.',
    bullets: [
      { icon: '💡', text: 'Das *💡 oben rechts* schaltet Hilfe-Texte an und aus.' },
      { icon: '4', text: '*4 Schritte* haben optionale Hilfe-Texte.' },
      { icon: '↻', text: 'Nach *langer Pause* automatisch wieder an.' },
    ],
    ctaLabel: 'Weiter',
    hasSkip: true,
  },
  {
    kind: 'notificationPriming',
    title: 'Eine sanfte Erinnerung?',
    body: 'Du kannst dir bis zu 2 Zeiten am Tag einstellen — oder gar keine.',
    bullets: [
      { icon: '⏰', text: 'Du wählst *Uhrzeit und Wochentage*.' },
      { icon: '⊘', text: '*Kein Druck, keine Streaks.*' },
      { icon: '↻', text: 'Jederzeit in den *Einstellungen änderbar*.' },
    ],
    ctaLabel: 'Weiter',
    hasSkip: true,
  },
  {
    kind: 'palette',
    title: 'Wähle deine Farbwelt.',
    body: 'Du kannst sie jederzeit in den Einstellungen ändern.',
    bullets: [
      { icon: '🔒', text: '*Alles bleibt auf deinem Gerät.* Kein Konto, keine Cloud.' },
    ],
    ctaLabel: 'Beginnen',
    hasSkip: false,
  },
];
