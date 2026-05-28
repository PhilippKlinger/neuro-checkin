import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';
import { themes, ThemeName } from '../../lib/constants/themes';

const PALETTE_LABELS: Record<ThemeName, string> = {
  warmEarth: 'Warm\nEarth',
  coolMist: 'Cool\nMist',
  softSage: 'Soft\nSage',
};

interface PaletteSelectProps {
  currentTheme: ThemeName;
  onSelect: (name: ThemeName) => void;
}

export function PaletteSelect({ currentTheme, onSelect }: PaletteSelectProps) {
  const { spacing, radii, touchTarget } = useTheme();

  return (
    <View style={[styles.grid, { gap: spacing.md }]}>
      {(Object.keys(themes) as ThemeName[]).map((name) => {
        const palette = themes[name].light;
        const isSelected = currentTheme === name;
        return (
          <Pressable
            key={name}
            onPress={() => onSelect(name)}
            style={({ pressed }) => [
              styles.card,
              {
                borderRadius: radii.md,
                borderWidth: 2,
                borderColor: isSelected ? palette.colors.accent : palette.colors.border,
                backgroundColor: palette.colors.surface,
                padding: spacing.md,
                minHeight: touchTarget.min,
              },
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={PALETTE_LABELS[name].replace('\n', ' ')}
            accessibilityState={{ selected: isSelected }}
          >
            <View style={[styles.swatches, { gap: spacing.xs, marginBottom: spacing.sm }]}>
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: palette.colors.primary, borderRadius: radii.full },
                ]}
              />
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: palette.colors.accent, borderRadius: radii.full },
                ]}
              />
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: palette.colors.background, borderRadius: radii.full },
                ]}
              />
            </View>
            <AppText
              variant="label"
              size="sm"
              style={{ textAlign: 'center', color: palette.colors.text }}
            >
              {PALETTE_LABELS[name]}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  card: {
    flex: 1,
    alignItems: 'center',
  },
  swatches: {
    flexDirection: 'row',
  },
  swatch: {
    width: 18,
    height: 18,
  },
});
