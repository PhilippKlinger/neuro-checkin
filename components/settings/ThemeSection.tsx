import { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';
import { themes, ThemeName } from '../../lib/constants/themes';

interface ThemeSectionProps {
  currentTheme: ThemeName;
  onThemeChange: (name: ThemeName) => void;
}

const THEME_OPTIONS: { key: ThemeName; label: string }[] = [
  { key: 'warmEarth', label: 'Warm\nEarth' },
  { key: 'coolMist', label: 'Cool\nMist' },
  { key: 'softSage', label: 'Soft\nSage' },
];

export const ThemeSection = memo(function ThemeSection({
  currentTheme,
  onThemeChange,
}: ThemeSectionProps) {
  const { spacing, radii, resolvedMode } = useTheme();

  return (
    <>
      <AppText variant="title" size="lg" style={{ marginBottom: spacing.md }}>
        Farbpalette
      </AppText>

      <View style={[styles.grid, { gap: spacing.sm, marginBottom: spacing.xl }]}>
        {THEME_OPTIONS.map((option) => {
          const palette = themes[option.key][resolvedMode];
          const isSelected = currentTheme === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => onThemeChange(option.key)}
              style={({ pressed }) => [
                styles.card,
                {
                  borderRadius: radii.md,
                  padding: spacing.md,
                  backgroundColor: palette.colors.surface,
                  borderWidth: 2,
                  borderColor: isSelected ? palette.colors.primary : palette.colors.border,
                },
                pressed && { opacity: 0.75 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Farbpalette ${option.label}`}
              accessibilityState={{ selected: isSelected }}
            >
              <View style={[styles.swatches, { gap: spacing.xs, marginBottom: spacing.sm }]}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: palette.colors.primary, borderRadius: radii.full },
                  ]}
                />
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: palette.colors.accent, borderRadius: radii.full },
                  ]}
                />
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: palette.colors.background,
                      borderRadius: radii.full,
                      borderWidth: 1,
                      borderColor: palette.colors.border,
                    },
                  ]}
                />
              </View>
              {/* palette.colors.text is not the active theme — override via style */}
              <AppText
                variant="label"
                size="sm"
                style={{ textAlign: 'center', color: palette.colors.text }}
              >
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
  grid: {
    flexDirection: 'row',
  },
  card: {
    flex: 1,
    alignItems: 'center',
  },
  swatches: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 16,
    height: 16,
  },
});
