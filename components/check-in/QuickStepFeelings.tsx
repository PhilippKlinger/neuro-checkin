import { ChipOrTextStep } from './ChipOrTextStep';
import { FEELING_CHIPS } from '../../lib/constants/chips';

interface QuickStepFeelingsProps {
  value: string;
  onValueChange: (value: string) => void;
  hint?: string;
  userChips?: string[];
  userChipsAtLimit?: boolean;
  skipped?: boolean;
  onSkip?: () => void;
}

// Chips-only variant for the quick check-in flow.
// No free-text toggle — keeps cognitive load low in difficult moments.
// Selection is optional: "Weiter" is never blocked here.
// User chips are shown (read-only use) but free-text creation is disabled (chipsOnly).
export function QuickStepFeelings({
  value,
  onValueChange,
  hint,
  userChips,
  userChipsAtLimit,
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
      userChips={userChips}
      userChipsAtLimit={userChipsAtLimit}
      skipped={skipped}
      onSkip={onSkip}
    />
  );
}
