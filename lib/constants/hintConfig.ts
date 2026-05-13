type StepHintKey = 'energy' | 'focus' | 'bodySignals' | 'feelings' | 'distress' | 'thoughts' | 'selfCare';

export const STEP_HINTS: Record<StepHintKey, string> = {
  energy: 'Eine grobe Einschätzung reicht. Was sich gerade nach wahr anfühlt.',
  focus: 'Auch wenn der Fokus heute schwer fassbar ist — wähl was am nächsten kommt.',
  bodySignals: 'Geh kurz innerlich durch — manche Signale werden erst sichtbar, wenn man sie sucht.',
  feelings: 'Ein Wort reicht. Mehrere sind ok. Wenn nichts passt, ist das auch ein Zustand.',
  distress: 'Wie sehr belastet dich gerade etwas? Auch "gar nicht" ist eine Antwort.',
  thoughts: 'Wie fühlen sich deine Gedanken gerade an — tragen sie dich, oder ziehen sie an dir?',
  selfCare: 'Was wäre jetzt gerade gut für dich? Auch "nichts" ist legitim.',
};
