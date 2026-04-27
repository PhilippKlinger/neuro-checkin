import { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { ColorMode } from '../../lib/constants/themes';

interface AppearanceModeSectionProps {
  currentMode: ColorMode;
  onModeChange: (mode: ColorMode) => void;
}

const MODE_OPTIONS: { key: ColorMode; label: string }[] = [
  { key: 'light',  label: 'Hell' },
  { key: 'dark',   label: 'Dunkel' },
  { key: 'system', label: 'System' },
];

export const AppearanceModeSection = memo(function AppearanceModeSection({
  currentMode,
  onModeChange,
}: AppearanceModeSectionProps) {
  const { theme, spacing, typography, radii } = useTheme();

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
        style={[styles.row, { gap: spacing.sm, marginBottom: spacing.xl }]}
        accessibilityRole="radiogroup"
        accessibilityLabel="Farbmodus wählen"
        accessibilityHint="Bestimmt ob die App hell, dunkel oder dem System folgend dargestellt wird"
      >
        {MODE_OPTIONS.map((option) => {
          const isSelected = currentMode === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => onModeChange(option.key)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: isSelected ? theme.colors.accentSoft : theme.colors.surface,
                  borderRadius: radii.md,
                  padding: spacing.md,
                  borderWidth: 2,
                  borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ checked: isSelected }}
            >
              <Text
                style={{
                  fontFamily: typography.families.ui.medium,
                  fontSize: typography.sizes.sm,
                  color: theme.colors.text,
                  textAlign: 'center',
                }}
              >
                {option.label}
              </Text>
              {option.key === 'system' && (
                <Text
                  style={{
                    fontFamily: typography.families.body.regular,
                    fontSize: typography.sizes.xs,
                    color: theme.colors.textSecondary,
                    textAlign: 'center',
                    marginTop: 2,
                  }}
                >
                  übernimmt Geräteeinstellungen
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
