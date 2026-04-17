import { LevelSlider } from './LevelSlider';
import { ENERGY_LABELS } from '../../lib/types/checkin';

interface StepEnergyProps {
  value: number;
  onValueChange: (value: number) => void;
}

export function StepEnergy({ value, onValueChange }: StepEnergyProps) {
  return (
    <LevelSlider
      title="Energie-Level"
      subtitle="Wie viel Energie hast du gerade?"
      value={value}
      onValueChange={onValueChange}
      labels={ENERGY_LABELS}
    />
  );
}
