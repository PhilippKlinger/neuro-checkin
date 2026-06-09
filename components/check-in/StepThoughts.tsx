import { View, Pressable, StyleSheet } from 'react-native';
import { AppText } from '../ui/AppText';
import { NoteField } from '../ui/NoteField';
import { useTheme } from '../../lib/hooks/useTheme';
import { StepScaffold } from './StepScaffold';

type ThoughtsType = 'supportive' | 'burdening' | 'mixed' | null;

interface StepThoughtsProps {
  type: ThoughtsType;
  note: string;
  onTypeChange: (type: ThoughtsType) => void;
  onNoteChange: (note: string) => void;
  hint?: string;
}

interface OptionItem {
  value: ThoughtsType;
  label: string;
}

const OPTIONS: OptionItem[] = [
  { value: 'supportive', label: 'Unterstützend' },
  { value: 'burdening', label: 'Belastend' },
  { value: 'mixed', label: 'Gemischt' },
];

export function StepThoughts({ type, note, onTypeChange, onNoteChange, hint }: StepThoughtsProps) {
  const { theme, spacing, radii, touchTarget } = useTheme();

  return (
    <StepScaffold title="Gedanken" subtitle="Wie sind deine Gedanken gerade?" hint={hint}>
      <View style={[styles.optionList, { gap: spacing.sm }]}>
        {OPTIONS.map((option) => {
          const isSelected = type === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onTypeChange(isSelected ? null : option.value)}
              style={({ pressed }) => [
                styles.optionButton,
                {
                  minHeight: touchTarget.min,
                  borderRadius: radii.md,
                  paddingHorizontal: spacing.md,
                  backgroundColor: isSelected ? theme.colors.accentSoft : theme.colors.surface,
                  borderWidth: 1,
                  borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                },
                pressed && { opacity: 0.75 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: isSelected }}
            >
              <AppText variant="label">{option.label}</AppText>
            </Pressable>
          );
        })}
      </View>

      <NoteField
        value={note}
        onChangeText={(text) => onNoteChange(text.slice(0, 200))}
        title="Notiz zu deinen Gedanken"
        placeholder="Notiz (optional)"
        maxLength={200}
        accessibilityLabel="Gedanken-Notiz"
        style={{ marginTop: spacing.lg }}
      />
    </StepScaffold>
  );
}

const styles = StyleSheet.create({
  optionList: {},
  optionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
