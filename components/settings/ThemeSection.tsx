import { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
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

export const ThemeSection = memo(function ThemeSection({ currentTheme, onThemeChange }: ThemeSectionProps) {
  const { theme, spacing, typography, radii, resolvedMode } = useTheme();

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
        Farbpalette
      </Text>

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
                <View style={[styles.dot, { backgroundColor: palette.colors.primary, borderRadius: radii.full }]} />
                <View style={[styles.dot, { backgroundColor: palette.colors.accent, borderRadius: radii.full }]} />
                <View style={[styles.dot, { backgroundColor: palette.colors.background, borderRadius: radii.full, borderWidth: 1, borderColor: palette.colors.border }]} />
              </View>
              <Text
                style={{
                  fontFamily: typography.families.ui.medium,
                  fontSize: typography.sizes.sm,
                  color: palette.colors.text,
                  textAlign: 'center',
                }}
              >
                {option.label}
              </Text>
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

