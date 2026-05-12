import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

interface CoachMarkTooltipProps {
  text: string;
  onDismiss: () => void;
  onSkip: () => void;
}

export function CoachMarkTooltip({ text, onDismiss, onSkip }: CoachMarkTooltipProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: spacing.md,
          maxWidth: 280,
          gap: spacing.sm,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.sm,
          color: theme.colors.text,
          lineHeight: typography.sizes.sm * 1.5,
        }}
      >
        {text}
      </Text>
      <View style={[styles.buttons, { gap: spacing.sm }]}>
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => [
            styles.button,
            {
              minHeight: touchTarget.min,
              borderRadius: radii.sm,
              backgroundColor: theme.colors.primary,
              paddingHorizontal: spacing.md,
            },
            pressed && { opacity: 0.75 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Ok"
        >
          <Text
            style={{
              fontFamily: typography.families.ui.semibold,
              fontSize: typography.sizes.sm,
              color: theme.colors.textInverse,
            }}
          >
            Ok
          </Text>
        </Pressable>
        <Pressable
          onPress={onSkip}
          style={({ pressed }) => [
            styles.button,
            {
              minHeight: touchTarget.min,
              paddingHorizontal: spacing.sm,
            },
            pressed && { opacity: 0.6 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Tutorial überspringen"
        >
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.sm,
              color: theme.colors.textSecondary,
            }}
          >
            Überspringen
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
