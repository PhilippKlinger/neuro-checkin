type StepHintKey = 'energy' | 'bodySignals' | 'feelings' | 'thoughts';

export const STEP_HINTS: Record<StepHintKey, string> = {
  energy: 'Eine grobe Einschätzung reicht.',
  bodySignals: 'Manche Signale werden erst spürbar, wenn du sie suchst.',
  feelings: 'Ein Wort reicht. Mehrere sind okay.',
  thoughts: 'Mehreres zugleich? Wähl „Gemischt".',
};
