import { ChipOrTextStep } from './ChipOrTextStep';
export { SELF_CARE_CHIPS } from '../../lib/constants/chips';
import { SELF_CARE_CHIPS, SELF_CARE_GROUPS } from '../../lib/constants/chips';

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
      chipGroups={SELF_CARE_GROUPS}
    />
  );
}
