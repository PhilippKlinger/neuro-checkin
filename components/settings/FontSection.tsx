import { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';
import { fonts } from '../../lib/constants/themes';
import type { FontFamily } from '../../lib/types/checkin';

interface FontSectionProps {
  currentFont: FontFamily;
  onFontChange: (name: FontFamily) => void;
  hideTitle?: boolean;
}

const FONT_OPTIONS: {
  key: FontFamily;
  label: string;
  subtitle: string;
  fontFamily: string;
}[] = [
  { key: 'lexend', label: 'Lexend', subtitle: 'Lesefluenz', fontFamily: fonts.lexend.medium },
  {
    key: 'atkinson',
    label: 'Atkinson',
    subtitle: 'Maximale Klarheit',
    fontFamily: fonts.atkinson.regular,
  },
  { key: 'nunito', label: 'Nunito', subtitle: 'Ausgewogen', fontFamily: fonts.nunito.medium },
];

export const FontSection = memo(function FontSection({
  currentFont,
  onFontChange,
  hideTitle,
}: FontSectionProps) {
  const { theme, spacing, radii } = useTheme();

  return (
    <>
      {!hideTitle && (
        <AppText variant="title" size="lg" style={{ marginBottom: spacing.md }}>
          Schriftart
        </AppText>
      )}

      <View style={[styles.grid, { gap: spacing.sm, marginBottom: hideTitle ? 0 : spacing.xl }]}>
        {FONT_OPTIONS.map((option) => {
          const isSelected = currentFont === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => onFontChange(option.key)}
              style={({ pressed }) => [
                styles.card,
                {
                  borderRadius: radii.md,
                  padding: spacing.md,
                  backgroundColor: theme.colors.surface,
                  borderWidth: 2,
                  borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                },
                pressed && { opacity: 0.75 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Schriftart ${option.label}`}
              accessibilityState={{ selected: isSelected }}
            >
              <AppText
                variant="label"
                size="sm"
                style={{
                  textAlign: 'center',
                  color: theme.colors.text,
                  fontFamily: option.fontFamily,
                }}
              >
                {option.label}
              </AppText>
              <AppText
                variant="hint"
                style={{
                  textAlign: 'center',
                  color: theme.colors.textSecondary,
                  fontSize: 11,
                  fontFamily: option.fontFamily,
                }}
              >
                {option.subtitle}
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
});
