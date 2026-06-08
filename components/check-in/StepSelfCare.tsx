import { ChipOrTextStep } from './ChipOrTextStep';
import { SELF_CARE_CHIPS } from '../../lib/constants/chips';
import { MAX_LABEL_LENGTH } from '../../lib/constants/userChips';
export { SELF_CARE_CHIPS } from '../../lib/constants/chips';

interface StepSelfCareProps {
  value: string;
  onValueChange: (value: string) => void;
  hint?: string;
  userChips?: string[];
  userChipsAtLimit?: boolean;
}

export function StepSelfCare({
  value,
  onValueChange,
  hint,
  userChips,
  userChipsAtLimit,
}: StepSelfCareProps) {
  return (
    <ChipOrTextStep
      title="Selbstfürsorge"
      subtitle="Was würde dir jetzt gut tun?"
      chips={SELF_CARE_CHIPS}
      value={value}
      onValueChange={onValueChange}
      textPlaceholder="Eigenes Wort eintragen"
      textAccessibilityLabel="Selbstfürsorge-Notiz"
      maxLength={MAX_LABEL_LENGTH}
      hint={hint}
      userChips={userChips}
      userChipsAtLimit={userChipsAtLimit}
    />
  );
}
