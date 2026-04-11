import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

interface LevelSliderProps {
  title: string;
  subtitle: string;
  value: number;
  onValueChange: (value: number) => void;
  minLabel?: string;
  maxLabel?: string;
}

export function LevelSlider({
  title,
  subtitle,
  value,
  onValueChange,
  minLabel = '1',
  maxLabel = '10',
}: LevelSliderProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();

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
        {title}
      </Text>
      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.md,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginBottom: spacing.xl,
        }}
      >
        {subtitle}
      </Text>

      <Text
        style={{
          fontFamily: typography.families.heading.bold,
          fontSize: typography.sizes.xxl + 8,
          color: theme.colors.primary,
          textAlign: 'center',
          marginBottom: spacing.lg,
        }}
        accessibilityRole="text"
        accessibilityLabel={`${title}: ${value} von 10`}
      >
        {value}
      </Text>

      <View style={styles.sliderRow}>
        {Array.from({ length: 10 }, (_, i) => {
          const level = i + 1;
          const isSelected = level === value;
          return (
            <Pressable
              key={level}
              onPress={() => onValueChange(level)}
              style={[
                styles.levelButton,
                {
                  minWidth: touchTarget.min / 1.5,
                  minHeight: touchTarget.min,
                  borderRadius: radii.sm,
                  backgroundColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderWidth: 1,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${level}`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={{
                  fontFamily: typography.families.ui.medium,
                  fontSize: typography.sizes.sm,
                  color: isSelected
                    ? theme.colors.textInverse
                    : theme.colors.text,
                }}
              >
                {level}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.labelRow, { marginTop: spacing.sm }]}>
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.xs,
            color: theme.colors.textSecondary,
          }}
        >
          {minLabel}
        </Text>
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.xs,
            color: theme.colors.textSecondary,
          }}
        >
          {maxLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  levelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
