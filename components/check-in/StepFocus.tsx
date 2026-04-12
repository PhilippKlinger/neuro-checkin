import { LevelSlider } from './LevelSlider';

interface StepFocusProps {
  value: number;
  onValueChange: (value: number) => void;
}

export function StepFocus({ value, onValueChange }: StepFocusProps) {
  return (
    <LevelSlider
      title="Fokus-Level"
      subtitle="Wie gut kannst du dich gerade konzentrieren?"
      value={value}
      onValueChange={onValueChange}
      minLabel="Kaum fokussiert"
      maxLabel="Voll fokussiert"
    />
  );
}
