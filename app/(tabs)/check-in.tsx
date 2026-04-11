import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { CheckInDraft, EMPTY_DRAFT } from '../../lib/types/checkin';
import { StepIndicator } from '../../components/check-in/StepIndicator';
import { StepArrival } from '../../components/check-in/StepArrival';
import { StepEnergy } from '../../components/check-in/StepEnergy';
import { StepFocus } from '../../components/check-in/StepFocus';

const TOTAL_STEPS = 3; // Steps 1-3 for now, will grow to 8

export default function CheckInScreen() {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CheckInDraft>({ ...EMPTY_DRAFT });

  const canGoBack = step > 0;
  const canGoForward = step < TOTAL_STEPS - 1;
  const isLastStep = step === TOTAL_STEPS - 1;

  function handleNext() {
    if (canGoForward) {
      setStep(step + 1);
    }
  }

  function handleBack() {
    if (canGoBack) {
      setStep(step - 1);
    }
  }

  function renderStep() {
    switch (step) {
      case 0:
        return <StepArrival />;
      case 1:
        return (
          <StepEnergy
            value={draft.energyLevel}
            onValueChange={(v) => setDraft({ ...draft, energyLevel: v })}
          />
        );
      case 2:
        return (
          <StepFocus
            value={draft.focusLevel}
            onValueChange={(v) => setDraft({ ...draft, focusLevel: v })}
          />
        );
      default:
        return null;
    }
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.indicatorWrapper, { paddingTop: spacing.lg }]}>
        <StepIndicator totalSteps={TOTAL_STEPS} currentStep={step} />
      </View>

      <View style={[styles.stepContent, { padding: spacing.lg }]}>
        {renderStep()}
      </View>

      <View
        style={[
          styles.navigation,
          {
            padding: spacing.lg,
            paddingBottom: spacing.xl,
            gap: spacing.md,
          },
        ]}
      >
        {canGoBack ? (
          <Pressable
            onPress={handleBack}
            style={[
              styles.navButton,
              {
                minHeight: touchTarget.min,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Zurueck"
          >
            <Text
              style={{
                fontFamily: typography.families.ui.medium,
                fontSize: typography.sizes.md,
                color: theme.colors.text,
              }}
            >
              Zurueck
            </Text>
          </Pressable>
        ) : (
          <View style={styles.navButton} />
        )}

        <Pressable
          onPress={handleNext}
          style={[
            styles.navButton,
            {
              minHeight: touchTarget.min,
              borderRadius: radii.md,
              backgroundColor: theme.colors.primary,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isLastStep ? 'Fertig' : 'Weiter'}
        >
          <Text
            style={{
              fontFamily: typography.families.ui.semibold,
              fontSize: typography.sizes.md,
              color: theme.colors.textInverse,
            }}
          >
            {isLastStep ? 'Weiter' : 'Weiter'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  indicatorWrapper: {
    alignItems: 'center',
  },
  stepContent: {
    flex: 1,
  },
  navigation: {
    flexDirection: 'row',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
