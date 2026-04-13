import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

interface CheckInSuccessViewProps {
  onReset: () => void;
}

export function CheckInSuccessView({ onReset }: CheckInSuccessViewProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          padding: spacing.lg,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.xl,
          color: theme.colors.text,
          textAlign: 'center',
          marginBottom: spacing.md,
        }}
      >
        Check-in gespeichert
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
        Gut gemacht. Du hast dir einen Moment für dich genommen.
      </Text>
      <Pressable
        onPress={onReset}
        style={[
          styles.resetButton,
          {
            minHeight: touchTarget.min,
            borderRadius: radii.md,
            backgroundColor: theme.colors.primary,
            paddingHorizontal: spacing.xl,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Neuer Check-in"
      >
        <Text
          style={{
            fontFamily: typography.families.ui.semibold,
            fontSize: typography.sizes.md,
            color: theme.colors.textInverse,
          }}
        >
          Neuer Check-in
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
