export const TUTORIAL_COACH_MARK_TEXTS = {
  levelSlider: 'Schätz grob — es gibt kein Richtig oder Falsch.',
  feelingsChips: 'Wähle, tippe, oder überspringe — alles ist ok.',
  summary: 'Das ist dein Check-in. Du kannst ihn jederzeit im Verlauf öffnen.',
} as const;

/** Check-in step indices at which coach marks appear (0-based). */
export const TUTORIAL_CHECK_IN_STEPS = {
  levelSlider: 1,   // Energie-Level step
  feelingsChips: 4, // Gefühle step
  summary: 8,       // Zusammenfassung step
} as const;

/** SpotlightTour step indices (0-based). */
export const TUTORIAL_TOUR_INDICES = {
  levelSlider: 0,
  feelingsChips: 1,
  summary: 2,
} as const;
