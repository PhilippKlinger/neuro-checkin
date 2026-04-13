import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

type ThoughtsType = 'supportive' | 'burdening' | 'mixed' | null;

interface StepThoughtsProps {
  type: ThoughtsType;
  note: string;
  onTypeChange: (type: ThoughtsType) => void;
  onNoteChange: (note: string) => void;
}

interface OptionItem {
  value: ThoughtsType;
  label: string;
  description: string;
}

const OPTIONS: OptionItem[] = [
  {
    value: 'supportive',
    label: 'Unterstützend',
    description: 'Meine Gedanken helfen mir gerade',
  },
  {
    value: 'burdening',
    label: 'Belastend',
    description: 'Meine Gedanken belasten mich gerade',
  },
  {
    value: 'mixed',
    label: 'Gemischt',
    description: 'Beides ist gerade da',
  },
];

export function StepThoughts({
  type,
  note,
  onTypeChange,
  onNoteChange,
}: StepThoughtsProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text
        style={{
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.xl,
          color: theme.colors.text,
          textAlign: 'center',
          marginBottom: spacing.sm,
        }}
      >
        Gedanken
      </Text>
      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.md,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginBottom: spacing.xl,
        }}
      >
        Wie würdest du deine Gedanken gerade beschreiben?
      </Text>

      <View style={[styles.optionList, { gap: spacing.sm }]}>
        {OPTIONS.map((option) => {
          const isSelected = type === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() =>
                onTypeChange(isSelected ? null : option.value)
              }
              style={[
                styles.optionButton,
                {
                  minHeight: touchTarget.min,
                  borderRadius: radii.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  backgroundColor: isSelected
                    ? theme.colors.primarySoft
                    : theme.colors.surface,
                  borderWidth: 1,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={{
                  fontFamily: typography.families.ui.medium,
                  fontSize: typography.sizes.md,
                  color: isSelected
                    ? theme.colors.primary
                    : theme.colors.text,
                }}
              >
                {option.label}
              </Text>
              <Text
                style={{
                  fontFamily: typography.families.body.regular,
                  fontSize: typography.sizes.sm,
                  color: theme.colors.textSecondary,
                }}
              >
                {option.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        value={note}
        onChangeText={onNoteChange}
        placeholder="Möchtest du dazu etwas notieren? (optional)"
        placeholderTextColor={theme.colors.textSecondary}
        multiline
        textAlignVertical="top"
        style={[
          styles.noteInput,
          {
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.md,
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: radii.md,
            padding: spacing.md,
            marginTop: spacing.lg,
          },
        ]}
        accessibilityLabel="Gedanken-Notiz"
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexGrow: 1,
  },
  optionList: {},
  optionButton: {
    alignItems: 'flex-start',
  },
  noteInput: {
    minHeight: 80,
    borderWidth: 1,
  },
});
