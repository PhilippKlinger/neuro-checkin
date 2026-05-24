import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo, findNodeHandle } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { useCheckInFlow } from '../../lib/hooks/useCheckInFlow';
import { FadeView } from '../../components/ui/FadeView';
import { CheckInNavButtons } from '../../components/check-in/CheckInNavButtons';
import { StepIndicator } from '../../components/check-in/StepIndicator';
import { GuidedToggle } from '../../components/check-in/GuidedToggle';
import { CheckInSuccessView } from '../../components/check-in/CheckInSuccessView';
import { StepArrival } from '../../components/check-in/StepArrival';
import { StepEnergy } from '../../components/check-in/StepEnergy';
import { StepFocus } from '../../components/check-in/StepFocus';
import { StepBodySignals } from '../../components/check-in/StepBodySignals';
import { StepFeelings } from '../../components/check-in/StepFeelings';
import { StepDistress } from '../../components/check-in/StepDistress';
import { StepThoughts } from '../../components/check-in/StepThoughts';
import { StepSelfCare } from '../../components/check-in/StepSelfCare';
import { StepSummary } from '../../components/check-in/StepSummary';
import { STEP_HINTS } from '../../lib/constants/hintConfig';

const TOTAL_STEPS = 9;

const STEP_NAMES = [
  'Ankommen',
  'Energie-Level',
  'Fokus-Level',
  'Körpersignale',
  'Gefühle',
  'Stress-Level',
  'Gedanken',
  'Selbstfürsorge',
  'Zusammenfassung',
];

export default function CheckInScreen() {
  const { theme, spacing, typography, radii } = useTheme();
  const db = useDatabase();
  const flow = useCheckInFlow(db);
  const stepContentRef = useRef<View>(null);

  const {
    step,
    draft,
    setDraft,
    isSaving,
    isDone,
    wasReset,
    isFirstCheckin,
    guidedMode,
    showToggleIntroHint,
    feelingUserChips,
    selfCareUserChips,
    canGoBack,
    isLastStep,
    isNextDisabled,
    handleGuidedToggle,
    handleNext,
    handleBack,
    handleReset,
  } = flow;

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
        return <StepArrival />;
      case 1:
        return (
          <StepEnergy
            value={draft.energyLevel}
            onValueChange={(v) => setDraft({ ...draft, energyLevel: v, energySkipped: false })}
            skipped={draft.energySkipped}
            onSkip={() => setDraft({ ...draft, energyLevel: 0, energySkipped: true })}
            hint={guidedMode ? STEP_HINTS.energy : undefined}
          />
        );
      case 2:
        return (
          <StepFocus
            value={draft.focusLevel}
            onValueChange={(v) => setDraft({ ...draft, focusLevel: v, focusSkipped: false })}
            skipped={draft.focusSkipped}
            onSkip={() => setDraft({ ...draft, focusLevel: 0, focusSkipped: true })}
            hint={guidedMode ? STEP_HINTS.focus : undefined}
          />
        );
      case 3:
        return (
          <StepBodySignals
            value={draft.bodySignals}
            onValueChange={(v) => setDraft({ ...draft, bodySignals: v })}
            hint={guidedMode ? STEP_HINTS.bodySignals : undefined}
          />
        );
      case 4:
        return (
          <StepFeelings
            value={draft.feelings}
            onValueChange={(v) => setDraft({ ...draft, feelings: v, feelingsSkipped: false })}
            hint={guidedMode ? STEP_HINTS.feelings : undefined}
            userChips={feelingUserChips}
            skipped={draft.feelingsSkipped}
            onSkip={() => setDraft({ ...draft, feelings: '', feelingsSkipped: true })}
          />
        );
      case 5:
        return (
          <StepDistress
            distressLevel={draft.distressLevel}
            distressNote={draft.distressNote}
            onLevelChange={(v) => setDraft({ ...draft, distressLevel: v })}
            onNoteChange={(v) => setDraft({ ...draft, distressNote: v })}
            hint={guidedMode ? STEP_HINTS.distress : undefined}
          />
        );
      case 6:
        return (
          <StepThoughts
            type={draft.thoughtsType}
            note={draft.thoughtsNote}
            onTypeChange={(v) => setDraft({ ...draft, thoughtsType: v })}
            onNoteChange={(v) => setDraft({ ...draft, thoughtsNote: v })}
            hint={guidedMode ? STEP_HINTS.thoughts : undefined}
          />
        );
      case 7:
        return (
          <StepSelfCare
            value={draft.selfCareNote}
            onValueChange={(v) => setDraft({ ...draft, selfCareNote: v })}
            hint={guidedMode ? STEP_HINTS.selfCare : undefined}
            userChips={selfCareUserChips}
          />
        );
      case 8:
        return <StepSummary draft={draft} showPostFirstCheckinHint={isFirstCheckin} />;
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

      {wasReset && step === 0 && (
        <View
          style={[
            styles.resetHint,
            {
              marginHorizontal: spacing.lg,
              marginTop: spacing.sm,
              backgroundColor: theme.colors.surface,
              borderRadius: radii.md,
              padding: spacing.md,
            },
          ]}
        >
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.sm,
              color: theme.colors.textSecondary,
              textAlign: 'center',
            }}
          >
            Kein Problem. Wann immer du bereit bist.
          </Text>
        </View>
      )}

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
        showBack={canGoBack}
        isNextDisabled={isNextDisabled}
        isLastStep={isLastStep}
        isSaving={isSaving}
        paddingBottom={spacing.xl}
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
  resetHint: {
    alignItems: 'center',
  },
});
