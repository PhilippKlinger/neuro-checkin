import { LevelSlider } from './LevelSlider';
import { FOCUS_LABELS } from '../../lib/types/checkin';

interface StepFocusProps {
  value: number;
  onValueChange: (value: number) => void;
}

export function StepFocus({ value, onValueChange }: StepFocusProps) {
  return (
    <LevelSlider
      title="Fokus-Level"
      subtitle="Wie verfügbar fühlt sich dein Fokus gerade an?"
      value={value}
      onValueChange={onValueChange}
      labels={FOCUS_LABELS}
    />
  );
}
