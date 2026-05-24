import { ChipOrTextStep } from './ChipOrTextStep';
import { FEELING_CHIPS } from '../../lib/constants/chips';
export { FEELING_CHIPS } from '../../lib/constants/chips';

interface StepFeelingsProps {
  value: string;
  onValueChange: (value: string) => void;
  hint?: string;
  userChips?: string[];
  skipped?: boolean;
  onSkip?: () => void;
}

export function StepFeelings({
  value,
  onValueChange,
  hint,
  userChips,
  skipped,
  onSkip,
}: StepFeelingsProps) {
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
