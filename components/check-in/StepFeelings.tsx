import { ChipOrTextStep } from './ChipOrTextStep';

interface StepFeelingsProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const FEELING_CHIPS = [
  'neutral', 'leer', 'erschöpft', 'angespannt', 'überwältigt',
  'gereizt', 'abgestumpft', 'traurig', 'ängstlich', 'leicht',
  'frustriert', 'zufrieden', 'verwirrt', 'aufgedreht',
  'Nicht definierbar',
] as const;

export function StepFeelings({ value, onValueChange }: StepFeelingsProps) {
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
    />
  );
}
