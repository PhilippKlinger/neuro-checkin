import { ChipOrTextStep } from './ChipOrTextStep';
import { FEELING_CHIPS } from '../../lib/constants/chips';
import { MAX_LABEL_LENGTH } from '../../lib/constants/userChips';
export { FEELING_CHIPS } from '../../lib/constants/chips';

interface StepFeelingsProps {
  value: string;
  onValueChange: (value: string) => void;
  hint?: string;
  userChips?: string[];
  userChipsAtLimit?: boolean;
  skipped?: boolean;
  onSkip?: () => void;
}

export function StepFeelings({
  value,
  onValueChange,
  hint,
  userChips,
  userChipsAtLimit,
  skipped,
  onSkip,
}: StepFeelingsProps) {
  return (
    <ChipOrTextStep
      title="Gefühle"
      subtitle="Welche Gefühle sind gerade da?"
      chips={FEELING_CHIPS}
      value={value}
      onValueChange={onValueChange}
      textPlaceholder="Eigenes Wort eintragen"
      textAccessibilityLabel="Gefühle beschreiben"
      maxLength={MAX_LABEL_LENGTH}
      hint={hint}
      userChips={userChips}
      userChipsAtLimit={userChipsAtLimit}
      skipped={skipped}
      onSkip={onSkip}
    />
  );
}
