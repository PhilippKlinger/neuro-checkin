import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { StepScaffold } from './StepScaffold';

interface LevelSliderProps {
  title: string;
  subtitle: string;
  value: number; // 0 = unselected, 1-5 = selected
  onValueChange: (value: number) => void;
  labels: readonly string[]; // exactly 5 semantic labels
  hint?: string;
  skipped?: boolean;
  onSkip?: () => void;
}

export function LevelSlider({
  title,
  subtitle,
  value,
  onValueChange,
  labels,
  hint,
  skipped,
  onSkip,
}: LevelSliderProps) {
  return (
    <StepScaffold
      title={title}
      subtitle={subtitle}
      hint={hint}
      centerContent
      skipConfig={onSkip ? { onSkip, skipped } : undefined}
    >
      <RadioGroup
        title={title}
        labels={labels}
        value={skipped ? 0 : value}
        onValueChange={onValueChange}
      />
    </StepScaffold>
  );
}

interface RadioGroupProps {
  title: string;
  labels: readonly string[];
  value: number;
  onValueChange: (value: number) => void;
}

function RadioGroup({ title, labels, value, onValueChange }: RadioGroupProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={title} style={styles.optionList}>
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
                backgroundColor: isSelected ? theme.colors.accentSoft : theme.colors.surface,
                borderWidth: 1,
                borderColor: isSelected ? theme.colors.accent : theme.colors.border,
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
                color: theme.colors.text,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  optionList: {
    width: '100%',
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
