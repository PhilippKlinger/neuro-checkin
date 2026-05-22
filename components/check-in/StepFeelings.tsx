import { ChipOrTextStep } from './ChipOrTextStep';

interface StepFeelingsProps {
  value: string;
  onValueChange: (value: string) => void;
  hint?: string;
  userChips?: string[];
  skipped?: boolean;
  onSkip?: () => void;
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
] as const;

export function StepFeelings({ value, onValueChange, hint, userChips, skipped, onSkip }: StepFeelingsProps) {
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
      skipped={skipped}
      onSkip={onSkip}
    />
  );
}
