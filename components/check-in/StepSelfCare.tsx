import { ChipOrTextStep } from './ChipOrTextStep';

interface StepSelfCareProps {
  value: string;
  onValueChange: (value: string) => void;
}

const SELF_CARE_CHIPS = [
  'Pause', 'Wasser trinken', 'Frische Luft', 'Tief atmen',
  'Bewegung', 'Stretching', 'Essen', 'Musik hören',
  'Wärme', 'Nichts — passt gerade so',
] as const;

export function StepSelfCare({ value, onValueChange }: StepSelfCareProps) {
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
    />
  );
}
