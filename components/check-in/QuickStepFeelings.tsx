import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { isChipSelected, toggleChip } from '../../lib/utils/chips';
import { FEELING_CHIPS } from './StepFeelings';

interface QuickStepFeelingsProps {
  value: string; // comma-separated selected chips, or '' for none
  onValueChange: (value: string) => void;
}

// Multi-select chip variant for the quick check-in flow.
// No free-text toggle — keeps cognitive load low in difficult moments.
// Selection is optional: "Weiter" is never blocked here.
// ND reality: co-occurring emotional states are the norm, not the exception.
export function QuickStepFeelings({ value, onValueChange }: QuickStepFeelingsProps) {
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
        Was nimmst du gerade wahr? (optional)
      </Text>

      {/* Multi-select chips — same vocabulary and logic as the full check-in */}
      <View style={[styles.chipWrap, { gap: spacing.sm }]}>
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
                  backgroundColor: selected ? theme.colors.accentSoft : theme.colors.surface,
                  borderWidth: 1,
                  borderColor: selected ? theme.colors.accent : theme.colors.border,
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
                  color: selected ? theme.colors.text : theme.colors.textSecondary,
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
