import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

export function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  const { theme, spacing, radii } = useTheme();

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor:
                i <= currentStep ? theme.colors.primary : theme.colors.border,
              borderRadius: radii.full,
              marginHorizontal: spacing.xs,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
  },
});
