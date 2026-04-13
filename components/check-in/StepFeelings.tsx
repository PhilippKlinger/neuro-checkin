import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

interface StepFeelingsProps {
  value: string;
  onValueChange: (value: string) => void;
}

const FEELING_CHIPS = [
  'müde', 'angespannt', 'ruhig', 'überfordert', 'traurig',
  'freudig', 'leer', 'dankbar', 'unruhig', 'neutral',
  'erschöpft', 'ängstlich',
];

function isChipSelected(chip: string, value: string): boolean {
  return value.split(',').map((s) => s.trim()).includes(chip);
}

function toggleChip(chip: string, value: string): string {
  const parts = value.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.includes(chip)) {
    return parts.filter((p) => p !== chip).join(', ');
  }
  return [...parts, chip].join(', ');
}

export function StepFeelings({ value, onValueChange }: StepFeelingsProps) {
  const { theme, spacing, typography, radii } = useTheme();

  return (
    <View style={styles.container}>
      <Text
        style={{
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.xl,
          color: theme.colors.text,
          textAlign: 'center',
          marginBottom: spacing.sm,
        }}
      >
        Gefühle
      </Text>
      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.md,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginBottom: spacing.lg,
        }}
      >
        Welche Gefühle nimmst du gerade wahr?
      </Text>

      {/* Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chipRow, { gap: spacing.sm, marginBottom: spacing.md }]}
      >
        {FEELING_CHIPS.map((chip) => {
          const selected = isChipSelected(chip, value);
          return (
            <Pressable
              key={chip}
              onPress={() => onValueChange(toggleChip(chip, value))}
              style={[
                styles.chip,
                {
                  borderRadius: radii.full,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface,
                  borderWidth: 1,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={chip}
              accessibilityState={{ selected }}
            >
              <Text
                style={{
                  fontFamily: typography.families.ui.medium,
                  fontSize: typography.sizes.sm,
                  color: selected ? theme.colors.primary : theme.colors.textSecondary,
                }}
              >
                {chip}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Freitext */}
      <TextInput
        value={value}
        onChangeText={onValueChange}
        placeholder="Oder hier frei beschreiben..."
        placeholderTextColor={theme.colors.textSecondary}
        multiline
        textAlignVertical="top"
        style={[
          styles.textInput,
          {
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.md,
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: radii.md,
            padding: spacing.md,
            lineHeight: typography.sizes.md * 1.5,
          },
        ]}
        accessibilityLabel="Gefühle beschreiben"
      />

      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.xs,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginTop: spacing.md,
          fontStyle: 'italic',
        }}
      >
        Alles ist erlaubt — auch „weiß nicht". Stichworte reichen völlig.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    minHeight: 100,
    borderWidth: 1,
  },
});
