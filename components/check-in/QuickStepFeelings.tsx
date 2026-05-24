import { ChipOrTextStep } from './ChipOrTextStep';
import { FEELING_CHIPS } from '../../lib/constants/chips';

interface QuickStepFeelingsProps {
  value: string;
  onValueChange: (value: string) => void;
  hint?: string;
  skipped?: boolean;
  onSkip?: () => void;
}

// Chips-only variant for the quick check-in flow.
// No free-text toggle — keeps cognitive load low in difficult moments.
// Selection is optional: "Weiter" is never blocked here.
export function QuickStepFeelings({
  value,
  onValueChange,
  hint,
  skipped,
  onSkip,
}: QuickStepFeelingsProps) {
  return (
    <ChipOrTextStep
      title="Gefühle"
      subtitle="Was nimmst du gerade wahr? (optional)"
      chips={FEELING_CHIPS}
      value={value}
      onValueChange={onValueChange}
      chipsOnly
      hint={hint}
      skipped={skipped}
      onSkip={onSkip}
    />
  );
}
