import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

interface LevelSliderProps {
  title: string;
  subtitle: string;
  value: number; // 0 = unselected, 1-5 = selected
  onValueChange: (value: number) => void;
  labels: readonly string[]; // exactly 5 semantic labels
}

export function LevelSlider({
  title,
  subtitle,
  value,
  onValueChange,
  labels,
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

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={title}
        style={styles.optionList}
      >
        {labels.map((label, index) => {
          const level = index + 1;
          const isSelected = level === value;
          return (
            <Pressable
              key={level}
              onPress={() => onValueChange(level)}
              style={[
                styles.option,
                {
                  minHeight: touchTarget.min,
                  borderRadius: radii.md,
                  backgroundColor: isSelected
                    ? theme.colors.accentSoft
                    : theme.colors.surface,
                  borderWidth: 1,
                  borderColor: isSelected
                    ? theme.colors.accent
                    : theme.colors.border,
                  marginBottom: spacing.sm,
                  paddingHorizontal: spacing.md,
                },
              ]}
              accessibilityRole="radio"
              accessibilityLabel={label}
              accessibilityHint={`${title} auf "${label}" setzen`}
              accessibilityState={{ checked: isSelected }}
            >
              <Text
                style={{
                  fontFamily: typography.families.ui.medium,
                  fontSize: typography.sizes.md,
                  color: isSelected
                    ? theme.colors.text
                    : theme.colors.text,
                }}
              >
                {label}
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
    justifyContent: 'center',
  },
  optionList: {
    width: '100%',
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
