type StepHintKey =
  | 'energy'
  | 'focus'
  | 'bodySignals'
  | 'feelings'
  | 'distress'
  | 'thoughts'
  | 'selfCare';

export const STEP_HINTS: Record<StepHintKey, string> = {
  energy: 'Eine grobe Einschätzung reicht.',
  focus: 'Wähl, was am nächsten kommt.',
  bodySignals: 'Manche Signale werden erst spürbar, wenn du sie suchst.',
  feelings: 'Ein Wort reicht. Mehrere sind ok.',
  distress: '„Kaum" ist auch eine Antwort.',
  thoughts: 'Tun deine Gedanken dir gerade gut?',
  selfCare: '„Nichts" ist auch eine Option.',
};
