import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { FEELING_CHIPS } from './StepFeelings';

interface QuickStepFeelingsProps {
  value: string; // single chip name or '' for none selected
  onValueChange: (value: string) => void;
}

// Single-select variant for the quick check-in flow.
// No free-text toggle — in a dysregulated state typing is a barrier.
// Selection is optional: "Weiter" is never blocked here.
export function QuickStepFeelings({ value, onValueChange }: QuickStepFeelingsProps) {
  const { theme, spacing, typography, radii } = useTheme();

  function handlePress(chip: string) {
    // Toggle: tap again to deselect
    onValueChange(value === chip ? '' : chip);
  }

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
        Gefühl
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
        Was trifft es am ehesten? (optional)
      </Text>

      {/* Single-select chips — same vocabulary as the full check-in */}
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Gefühl auswählen"
        style={[styles.chipWrap, { gap: spacing.sm }]}
      >
        {FEELING_CHIPS.map((chip) => {
          const selected = value === chip;
          return (
            <Pressable
              key={chip}
              onPress={() => handlePress(chip)}
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
              accessibilityRole="radio"
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
