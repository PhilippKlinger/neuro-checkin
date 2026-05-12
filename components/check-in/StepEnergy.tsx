import { LevelSlider } from './LevelSlider';
import { ENERGY_LABELS } from '../../lib/types/checkin';

interface StepEnergyProps {
  value: number;
  onValueChange: (value: number) => void;
  hint?: string;
}

export function StepEnergy({ value, onValueChange, hint }: StepEnergyProps) {
  return (
    <LevelSlider
      title="Energie-Level"
      subtitle="Wie viel Energie hast du gerade?"
      value={value}
      onValueChange={onValueChange}
      labels={ENERGY_LABELS}
      hint={hint}
    />
  );
}
