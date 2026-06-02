import { useEffect, useRef } from 'react';
import { View, StyleSheet, AccessibilityInfo, findNodeHandle, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { useTheme } from '../lib/hooks/useTheme';
import { useDatabase } from '../lib/hooks/useDatabase';
import { useCheckInFlow, TOTAL_STEPS } from '../lib/hooks/useCheckInFlow';
import { clearDraft } from '../lib/database/checkInDraft';
import { FadeView } from '../components/ui/FadeView';
import { AppText } from '../components/ui/AppText';
import { CheckInNavButtons } from '../components/check-in/CheckInNavButtons';
import { StepIndicator } from '../components/check-in/StepIndicator';
import { GuidedToggle } from '../components/check-in/GuidedToggle';
import { CheckInSuccessView } from '../components/check-in/CheckInSuccessView';
import { StepArrival } from '../components/check-in/StepArrival';
import { StepEnergy } from '../components/check-in/StepEnergy';
import { StepFocus } from '../components/check-in/StepFocus';
import { StepBodySignals } from '../components/check-in/StepBodySignals';
import { StepFeelings } from '../components/check-in/StepFeelings';
import { StepDistress } from '../components/check-in/StepDistress';
import { StepThoughts } from '../components/check-in/StepThoughts';
import { StepSelfCare } from '../components/check-in/StepSelfCare';
import { StepSummary } from '../components/check-in/StepSummary';
import { STEP_HINTS } from '../lib/constants/hintConfig';

// Steps that have a guided hint — toggle is only useful when a hint exists
const STEPS_WITH_HINTS = new Set([1, 3, 4, 6]); // energy, bodySignals, feelings, thoughts

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

export default function FullCheckInScreen() {
  const { theme, spacing, radii } = useTheme();
  const db = useDatabase();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const stepContentRef = useRef<View>(null);

  const {
    step,
    draft,
    actions,
    isSaving,
    isDone,
    wasReset,
    isFirstCheckin,
    guidedMode,
    feelingUserChips,
    selfCareUserChips,
    canGoBack,
    isLastStep,
    isNextDisabled,
    handleGuidedToggle,
    handleNext,
    handleBack,
    handleReset,
  } = useCheckInFlow(db);

  // Intercept back navigation to offer resume on next open
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (step === 0 || isDone) return; // nothing to protect
      e.preventDefault();
      Alert.alert('Check-in beenden?', 'Dein Fortschritt wird gespeichert.', [
        { text: 'Hierbleiben', style: 'cancel' },
        {
          text: 'Beenden',
          style: 'destructive',
          onPress: () => {
            clearDraft(db).catch(console.error);
            navigation.dispatch(e.data.action);
          },
        },
      ]);
    });
    return unsubscribe;
  }, [navigation, step, isDone, db]);

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
            onValueChange={actions.setEnergy}
            skipped={draft.energySkipped}
            onSkip={actions.skipEnergy}
            hint={guidedMode ? STEP_HINTS.energy : undefined}
          />
        );
      case 2:
        return (
          <StepFocus
            value={draft.focusLevel}
            onValueChange={actions.setFocus}
            skipped={draft.focusSkipped}
            onSkip={actions.skipFocus}
            hint={undefined}
          />
        );
      case 3:
        return (
          <StepBodySignals
            value={draft.bodySignals}
            onValueChange={actions.setBodySignals}
            hint={guidedMode ? STEP_HINTS.bodySignals : undefined}
          />
        );
      case 4:
        return (
          <StepFeelings
            value={draft.feelings}
            onValueChange={actions.setFeelings}
            hint={guidedMode ? STEP_HINTS.feelings : undefined}
            userChips={feelingUserChips}
            skipped={draft.feelingsSkipped}
            onSkip={actions.skipFeelings}
          />
        );
      case 5:
        return (
          <StepDistress
            distressLevel={draft.distressLevel}
            distressNote={draft.distressNote}
            onLevelChange={actions.setDistressLevel}
            onNoteChange={actions.setDistressNote}
            hint={undefined}
          />
        );
      case 6:
        return (
          <StepThoughts
            type={draft.thoughtsType}
            note={draft.thoughtsNote}
            onTypeChange={actions.setThoughtsType}
            onNoteChange={actions.setThoughtsNote}
            hint={guidedMode ? STEP_HINTS.thoughts : undefined}
          />
        );
      case 7:
        return (
          <StepSelfCare
            value={draft.selfCareNote}
            onValueChange={actions.setSelfCare}
            hint={undefined}
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
      <View
        style={[styles.indicatorRow, { paddingTop: spacing.lg, paddingHorizontal: spacing.lg }]}
      >
        <View style={styles.indicatorSpacer} />
        <StepIndicator totalSteps={TOTAL_STEPS} currentStep={step} />
        <View style={styles.indicatorSpacer}>
          {STEPS_WITH_HINTS.has(step) && (
            <GuidedToggle enabled={guidedMode} onToggle={handleGuidedToggle} />
          )}
        </View>
      </View>

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
          <AppText variant="body" size="sm" color="secondary" style={{ textAlign: 'center' }}>
            Kein Problem. Wann immer du bereit bist.
          </AppText>
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
  resetHint: {
    alignItems: 'center',
  },
});
