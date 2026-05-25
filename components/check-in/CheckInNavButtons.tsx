import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';

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
  const { theme, spacing, radii, touchTarget } = useTheme();

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
          <AppText variant="label">{backLabel}</AppText>
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
        accessibilityLabel={nextLabel}
        accessibilityState={{ disabled: isNextDisabled }}
      >
        <AppText variant="label" weight="semibold" color="inverse">{nextLabel}</AppText>
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
