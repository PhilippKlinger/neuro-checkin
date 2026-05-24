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
import { GuidedToggle } from '../components/check-in/GuidedToggle';
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
    setDraft,
    isSaving,
    isDone,
    guidedMode,
    showToggleIntroHint,
    isLastStep,
    isNextDisabled,
    handleGuidedToggle,
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
            onValueChange={(v) => setDraft({ ...draft, energyLevel: v, energySkipped: false })}
            skipped={draft.energySkipped}
            onSkip={() => setDraft({ ...draft, energyLevel: 0, energySkipped: true })}
            hint={guidedMode ? STEP_HINTS.energy : undefined}
          />
        );
      case 1:
        return (
          <StepFocus
            value={draft.focusLevel}
            onValueChange={(v) => setDraft({ ...draft, focusLevel: v, focusSkipped: false })}
            skipped={draft.focusSkipped}
            onSkip={() => setDraft({ ...draft, focusLevel: 0, focusSkipped: true })}
            hint={guidedMode ? STEP_HINTS.focus : undefined}
          />
        );
      case 2:
        return (
          <QuickStepFeelings
            value={draft.feelings}
            onValueChange={(v) => setDraft({ ...draft, feelings: v, feelingsSkipped: false })}
            hint={guidedMode ? STEP_HINTS.feelings : undefined}
            skipped={draft.feelingsSkipped}
            onSkip={() => setDraft({ ...draft, feelings: '', feelingsSkipped: true })}
          />
        );
      default:
        return null;
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.indicatorWrapper, { paddingTop: spacing.lg }]}>
        <StepIndicator totalSteps={TOTAL_STEPS} currentStep={step} />
      </View>

      <GuidedToggle
        enabled={guidedMode}
        onToggle={handleGuidedToggle}
        showIntroHint={showToggleIntroHint}
      />

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
  indicatorWrapper: {
    alignItems: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepInner: {
    flex: 1,
  },
});
