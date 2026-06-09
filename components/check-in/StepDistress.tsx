import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';
import { NoteField } from '../ui/NoteField';
import { DISTRESS_LABELS } from '../../lib/types/checkin';
import { StepScaffold } from './StepScaffold';

interface StepDistressProps {
  distressLevel: number | null;
  distressNote: string;
  onLevelChange: (level: number | null) => void;
  onNoteChange: (note: string) => void;
  hint?: string;
}

const LEVEL_OPTIONS = DISTRESS_LABELS.map((label, i) => ({
  level: i + 1,
  label,
}));

export function StepDistress({
  distressLevel,
  distressNote,
  onLevelChange,
  onNoteChange,
  hint,
}: StepDistressProps) {
  const { theme, spacing, radii, touchTarget } = useTheme();
  const [cannotSay, setCannotSay] = useState(false);

  function handleLevelSelect(level: number) {
    setCannotSay(false);
    const newLevel = distressLevel === level ? null : level;
    onLevelChange(newLevel);
  }

  function handleCannotSay() {
    setCannotSay(true);
    onLevelChange(null);
  }

  return (
    <StepScaffold
      title="Stress"
      subtitle="Wie belastet bist du gerade?"
      hint={hint}
      keyboardPersistTaps
      avoidKeyboard
    >
      <View
        style={[styles.optionList, { gap: spacing.sm }]}
        accessibilityRole="radiogroup"
        accessibilityLabel="Stress-Level"
      >
        {LEVEL_OPTIONS.map(({ level, label }) => {
          const isSelected = distressLevel === level;
          return (
            <Pressable
              key={level}
              onPress={() => handleLevelSelect(level)}
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
              accessibilityRole="radio"
              accessibilityLabel={label}
              accessibilityState={{ checked: isSelected }}
            >
              <AppText variant="label">{label}</AppText>
            </Pressable>
          );
        })}
      </View>

      <View
        style={[
          styles.divider,
          { backgroundColor: theme.colors.border, marginVertical: spacing.md },
        ]}
      />

      <Pressable
        onPress={handleCannotSay}
        style={({ pressed }) => [
          styles.cannotSayButton,
          {
            minHeight: touchTarget.min,
            borderRadius: radii.md,
            paddingHorizontal: spacing.md,
            backgroundColor: cannotSay ? theme.colors.accentSoft : theme.colors.surface,
            borderWidth: 1,
            borderColor: cannotSay ? theme.colors.accent : theme.colors.border,
          },
          pressed && { opacity: 0.75 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Kann ich gerade nicht sagen"
        accessibilityState={{ selected: cannotSay }}
      >
        <AppText variant="label" color="secondary">
          Kann ich gerade nicht sagen
        </AppText>
      </Pressable>

      <NoteField
        value={distressNote}
        onChangeText={(text) => onNoteChange(text.slice(0, 200))}
        title="Notiz zu deinem Stress"
        placeholder="Notiz (optional)"
        maxLength={200}
        accessibilityLabel="Stress-Notiz"
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
  divider: {
    height: 1,
  },
  cannotSayButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
