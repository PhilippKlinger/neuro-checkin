import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

interface CheckInNavButtonsProps {
  onBack: () => void;
  onNext: () => void;
  /** Label for the back/cancel button. Defaults to 'Zurück'. */
  backLabel?: string;
  /** When false, a spacer View replaces the back button (full-flow step 0). */
  showBack?: boolean;
  isNextDisabled: boolean;
  isLastStep: boolean;
  isSaving: boolean;
  paddingBottom: number;
}

export function CheckInNavButtons({
  onBack,
  onNext,
  backLabel = 'Zurück',
  showBack = true,
  isNextDisabled,
  isLastStep,
  isSaving,
  paddingBottom,
}: CheckInNavButtonsProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();

  const nextLabel = isLastStep ? (isSaving ? 'Speichern...' : 'Speichern') : 'Weiter';

  return (
    <View
      style={[
        styles.navigation,
        {
          padding: spacing.lg,
          paddingBottom,
          gap: spacing.md,
        },
      ]}
    >
      {showBack ? (
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.navButton,
            {
              minHeight: touchTarget.min,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
            pressed && { opacity: 0.75 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
        >
          <Text
            style={{
              fontFamily: typography.families.ui.medium,
              fontSize: typography.sizes.md,
              color: theme.colors.text,
            }}
          >
            {backLabel}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.navButton} />
      )}

      <Pressable
        onPress={onNext}
        disabled={isNextDisabled}
        style={({ pressed }) => [
          styles.navButton,
          {
            minHeight: touchTarget.min,
            borderRadius: radii.md,
            backgroundColor: isNextDisabled ? theme.colors.border : theme.colors.primary,
          },
          pressed && !isNextDisabled && { opacity: 0.75 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={isLastStep ? 'Speichern' : 'Weiter'}
        accessibilityState={{ disabled: isNextDisabled }}
      >
        <Text
          style={{
            fontFamily: typography.families.ui.semibold,
            fontSize: typography.sizes.md,
            color: theme.colors.textInverse,
          }}
        >
          {nextLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  navigation: {
    flexDirection: 'row',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
