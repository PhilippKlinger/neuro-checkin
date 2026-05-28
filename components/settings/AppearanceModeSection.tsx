import { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';
import { ColorMode } from '../../lib/constants/themes';

interface AppearanceModeSectionProps {
  currentMode: ColorMode;
  onModeChange: (mode: ColorMode) => void;
  hideTitle?: boolean;
}

const MODE_OPTIONS: { key: ColorMode; label: string }[] = [
  { key: 'light', label: 'Hell' },
  { key: 'dark', label: 'Dunkel' },
  { key: 'system', label: 'System' },
];

export const AppearanceModeSection = memo(function AppearanceModeSection({
  currentMode,
  onModeChange,
  hideTitle,
}: AppearanceModeSectionProps) {
  const { theme, spacing, radii } = useTheme();

  return (
    <>
      {!hideTitle && (
        <AppText variant="title" size="lg" style={{ marginBottom: spacing.md }}>
          Erscheinungsbild
        </AppText>
      )}

      <View
        style={[styles.row, { gap: spacing.sm, marginBottom: hideTitle ? 0 : spacing.xl }]}
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
              <AppText variant="label" size="sm" style={{ textAlign: 'center' }}>
                {option.label}
              </AppText>
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
