import { LevelSlider } from './LevelSlider';

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
      minLabel="Sehr wenig"
      maxLabel="Sehr viel"
    />
  );
}
