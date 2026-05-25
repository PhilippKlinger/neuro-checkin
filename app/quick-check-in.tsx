import { useEffect, useRef } from 'react';
import { View, StyleSheet, AccessibilityInfo, findNodeHandle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/hooks/useTheme';
import { useDatabase } from '../lib/hooks/useDatabase';
import { useQuickCheckInFlow } from '../lib/hooks/useQuickCheckInFlow';
import { FadeView } from '../components/ui/FadeView';
import { CheckInNavButtons } from '../components/check-in/CheckInNavButtons';
import { StepIndicator } from '../components/check-in/StepIndicator';
import { CheckInSuccessView } from '../components/check-in/CheckInSuccessView';
import { StepEnergy } from '../components/check-in/StepEnergy';
import { StepFocus } from '../components/check-in/StepFocus';
import { QuickStepFeelings } from '../components/check-in/QuickStepFeelings';
import { STEP_HINTS } from '../lib/constants/hintConfig';

const TOTAL_STEPS = 3;
const STEP_NAMES = ['Energie-Level', 'Fokus-Level', 'Gefühle'];

export default function QuickCheckInScreen() {
  const { theme, spacing } = useTheme();
  const db = useDatabase();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const stepContentRef = useRef<View>(null);

  const {
    step,
    draft,
    actions,
    isSaving,
    isDone,
    guidedMode,
    isLastStep,
    isNextDisabled,
    handleNext,
    handleBack,
    handleReset,
  } = useQuickCheckInFlow(db, () => router.back());

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      `Schritt ${step + 1} von ${TOTAL_STEPS}: ${STEP_NAMES[step]}`
    );
    if (stepContentRef.current) {
      const handle = findNodeHandle(stepContentRef.current);
      if (handle !== null) {
        AccessibilityInfo.setAccessibilityFocus(handle);
      }
    }
  }, [step]);

  if (isDone) {
    return (
      <CheckInSuccessView
        onReset={handleReset}
        energyLevel={draft.energyLevel}
        focusLevel={draft.focusLevel}
      />
    );
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <StepEnergy
            value={draft.energyLevel}
            onValueChange={actions.setEnergy}
            skipped={draft.energySkipped}
            onSkip={actions.skipEnergy}
            hint={guidedMode ? STEP_HINTS.energy : undefined}
          />
        );
      case 1:
        return (
          <StepFocus
            value={draft.focusLevel}
            onValueChange={actions.setFocus}
            skipped={draft.focusSkipped}
            onSkip={actions.skipFocus}
            hint={guidedMode ? STEP_HINTS.focus : undefined}
          />
        );
      case 2:
        return (
          <QuickStepFeelings
            value={draft.feelings}
            onValueChange={actions.setFeelings}
            hint={guidedMode ? STEP_HINTS.feelings : undefined}
            skipped={draft.feelingsSkipped}
            onSkip={actions.skipFeelings}
          />
        );
      default:
        return null;
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[styles.indicatorRow, { paddingTop: spacing.lg, paddingHorizontal: spacing.lg }]}
      >
        <View style={styles.indicatorSpacer} />
        <StepIndicator totalSteps={TOTAL_STEPS} currentStep={step} />
        <View style={styles.indicatorSpacer} />
      </View>

      <FadeView triggerKey={step} style={[styles.stepContent, { padding: spacing.lg }]}>
        <View
          ref={stepContentRef}
          accessibilityLabel={`Schritt ${step + 1} von ${TOTAL_STEPS}: ${STEP_NAMES[step]}`}
          accessibilityRole="summary"
          style={styles.stepInner}
        >
          {renderStep()}
        </View>
      </FadeView>

      <CheckInNavButtons
        onBack={handleBack}
        onNext={handleNext}
        backLabel={step === 0 ? 'Abbrechen' : 'Zurück'}
        isNextDisabled={isNextDisabled}
        isLastStep={isLastStep}
        isSaving={isSaving}
        paddingBottom={Math.max(spacing.xl, insets.bottom + spacing.md)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorSpacer: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepInner: {
    flex: 1,
  },
});
