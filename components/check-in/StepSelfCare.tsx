import { ChipOrTextStep, type ChipGroup } from './ChipOrTextStep';

interface StepSelfCareProps {
  value: string;
  onValueChange: (value: string) => void;
  hint?: string;
  userChips?: string[];
}

const SELF_CARE_GROUPS: ChipGroup[] = [
  {
    label: '0 Energie',
    chips: ['Augen schließen', 'Licht dimmen', 'Nichts entscheiden', 'Einfach bleiben'],
  },
  {
    label: 'Klein',
    chips: ['Wasser trinken', 'Kurz raus', 'Tief atmen', 'Dehnen'],
  },
  {
    label: 'Mehr Aufwand',
    chips: ['Spazieren', 'Essen', 'Dusche', 'Musik hören'],
  },
];

export const SELF_CARE_CHIPS: readonly string[] = SELF_CARE_GROUPS.flatMap((g) => [...g.chips]);

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
