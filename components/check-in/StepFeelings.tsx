import { ChipOrTextStep } from './ChipOrTextStep';

interface StepFeelingsProps {
  value: string;
  onValueChange: (value: string) => void;
  hint?: string;
  userChips?: string[];
}

export const FEELING_CHIPS = [
  'neutral',
  'leer',
  'erschöpft',
  'angespannt',
  'überwältigt',
  'gereizt',
  'abgestumpft',
  'traurig',
  'ängstlich',
  'leicht',
  'frustriert',
  'zufrieden',
  'freudig',
  'dankbar',
  'motiviert',
  'verwirrt',
  'aufgedreht',
  'Nicht definierbar',
] as const;

export function StepFeelings({ value, onValueChange, hint, userChips }: StepFeelingsProps) {
  return (
    <ChipOrTextStep
      title="Gefühle"
      subtitle="Welche Gefühle nimmst du gerade wahr?"
      chips={FEELING_CHIPS}
      value={value}
      onValueChange={onValueChange}
      textPlaceholder="Was nimmst du gerade wahr?"
      textAccessibilityLabel="Gefühle beschreiben"
      maxLength={150}
      hint={hint}
      userChips={userChips}
    />
  );
}
