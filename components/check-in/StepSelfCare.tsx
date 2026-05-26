import { ChipOrTextStep } from './ChipOrTextStep';
import { SELF_CARE_CHIPS } from '../../lib/constants/chips';
export { SELF_CARE_CHIPS } from '../../lib/constants/chips';

interface StepSelfCareProps {
  value: string;
  onValueChange: (value: string) => void;
  hint?: string;
  userChips?: string[];
}

export function StepSelfCare({ value, onValueChange, hint, userChips }: StepSelfCareProps) {
  return (
    <ChipOrTextStep
      title="Selbstfürsorge"
      subtitle="Was brauchst du gerade? Was würde dir jetzt gut tun?"
      chips={SELF_CARE_CHIPS}
      value={value}
      onValueChange={onValueChange}
      textPlaceholder="Was würde dir jetzt gut tun?"
      textAccessibilityLabel="Selbstfürsorge-Notiz"
      maxLength={150}
      hint={hint}
      userChips={userChips}
    />
  );
}
