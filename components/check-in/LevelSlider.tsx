import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

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
          marginBottom: hint ? spacing.sm : spacing.xl,
        }}
      >
        {subtitle}
      </Text>
      {hint && (
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.sm,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            fontStyle: 'italic',
            marginBottom: spacing.xl,
          }}
        >
          {hint}
        </Text>
      )}

      <RadioGroup
        title={title}
        labels={labels}
        value={skipped ? 0 : value}
        onValueChange={(v) => {
          onValueChange(v);
        }}
      />

      {onSkip && (
        <>
          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.border, marginVertical: spacing.md },
            ]}
          />
          <Pressable
            onPress={onSkip}
            style={({ pressed }) => [
              styles.skipButton,
              {
                minHeight: touchTarget.min,
                borderRadius: radii.md,
                paddingHorizontal: spacing.md,
                backgroundColor: skipped ? theme.colors.accentSoft : theme.colors.surface,
                borderWidth: 1,
                borderColor: skipped ? theme.colors.accent : theme.colors.border,
              },
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Kann ich gerade nicht sagen"
            accessibilityState={{ selected: skipped }}
          >
            <Text
              style={{
                fontFamily: typography.families.body.regular,
                fontSize: typography.sizes.md,
                color: theme.colors.textSecondary,
                fontStyle: 'italic',
              }}
            >
              Kann ich gerade nicht sagen
            </Text>
          </Pressable>
        </>
      )}
    </View>
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
                color: isSelected ? theme.colors.text : theme.colors.text,
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
  divider: {
    height: 1,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
