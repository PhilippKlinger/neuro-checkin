import { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { ColorMode } from '../../lib/constants/themes';

interface AppearanceModeSectionProps {
  currentMode: ColorMode;
  onModeChange: (mode: ColorMode) => void;
}

const MODE_OPTIONS: { key: ColorMode; label: string; hint: string }[] = [
  { key: 'light', label: 'Hell', hint: 'Immer heller Modus' },
  { key: 'dark',  label: 'Dunkel', hint: 'Immer dunkler Modus' },
  { key: 'system', label: 'System folgen', hint: 'Geräteinstellung übernehmen' },
];

export const AppearanceModeSection = memo(function AppearanceModeSection({
  currentMode,
  onModeChange,
}: AppearanceModeSectionProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();

  return (
    <>
      <Text
        style={{
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.lg,
          color: theme.colors.text,
          marginBottom: spacing.md,
        }}
      >
        Erscheinungsbild
      </Text>

      <View
        style={[styles.optionGroup, { gap: spacing.sm, marginBottom: spacing.xl }]}
        accessibilityRole="radiogroup"
        accessibilityLabel="Farbmodus wählen"
      >
        {MODE_OPTIONS.map((option) => {
          const isSelected = currentMode === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => onModeChange(option.key)}
              style={[
                styles.option,
                {
                  backgroundColor: isSelected ? theme.colors.accentSoft : theme.colors.surface,
                  borderRadius: radii.md,
                  padding: spacing.md,
                  minHeight: touchTarget.min,
                  borderWidth: 1,
                  borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                },
              ]}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityHint={option.hint}
              accessibilityState={{ checked: isSelected }}
            >
              <Text
                style={{
                  fontFamily: typography.families.ui.medium,
                  fontSize: typography.sizes.md,
                  color: theme.colors.text,
                }}
              >
                {option.label}
              </Text>
              <Text
                style={{
                  fontFamily: typography.families.body.regular,
                  fontSize: typography.sizes.sm,
                  color: theme.colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {option.hint}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  optionGroup: {
    flexDirection: 'column',
  },
  option: {
    justifyContent: 'center',
  },
});
