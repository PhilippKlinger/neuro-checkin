import { LevelSlider } from './LevelSlider';
import { FOCUS_LABELS } from '../../lib/types/checkin';

interface StepFocusProps {
  value: number;
  onValueChange: (value: number) => void;
  skipped?: boolean;
  onSkip?: () => void;
  hint?: string;
}

export function StepFocus({ value, onValueChange, skipped, onSkip, hint }: StepFocusProps) {
  return (
    <LevelSlider
      title="Fokus"
      subtitle="Wie viel Fokus hast du gerade?"
      value={value}
      onValueChange={onValueChange}
      labels={FOCUS_LABELS}
      skipped={skipped}
      onSkip={onSkip}
      hint={hint}
    />
  );
}
