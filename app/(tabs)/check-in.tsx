import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, AccessibilityInfo, findNodeHandle } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SpotlightTourProvider, type SpotlightTour, type TourStep, type TourState } from 'react-native-spotlight-tour';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { CheckInDraft, EMPTY_DRAFT, EMPTY_BODY_SIGNALS } from '../../lib/types/checkin';
import { FadeView } from '../../components/ui/FadeView';
import { insertCheckIn, countCheckIns } from '../../lib/database/checkins';
import { getSettings, updateSettings } from '../../lib/database/settings';
import { StepIndicator } from '../../components/check-in/StepIndicator';
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
import { CoachMarkTooltip } from '../../components/check-in/CoachMarkTooltip';
import {
  TUTORIAL_COACH_MARK_TEXTS,
  TUTORIAL_CHECK_IN_STEPS,
  TUTORIAL_TOUR_INDICES,
} from '../../lib/constants/tutorialConfig';

const TOTAL_STEPS = 9;
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 1h

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
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
  const db = useDatabase();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CheckInDraft>({ ...EMPTY_DRAFT, bodySignals: { ...EMPTY_BODY_SIGNALS } });
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [wasReset, setWasReset] = useState(false);
  const stepContentRef = useRef<View>(null);
  const stepRef = useRef(step);
  const leftAtRef = useRef<number | null>(null);

  // Tutorial state
  const [tutorialActive, setTutorialActive] = useState(false);
  const [isFirstCheckin, setIsFirstCheckin] = useState(false);
  const tourRef = useRef<SpotlightTour>(null);
  // Tracks which coach marks the user already saw (dismissed with "Ok")
  const shownCoachMarksRef = useRef(new Set<number>());
  // True when user pressed "Überspringen" — skip all remaining marks
  const skipIntentRef = useRef(false);

  // Load tutorial state once on mount
  useEffect(() => {
    async function loadTutorialState() {
      try {
        const [settings, count] = await Promise.all([getSettings(db), countCheckIns(db)]);
        const active = settings.tutorialOffered && !settings.tutorialSeen;
        setTutorialActive(active);
        setIsFirstCheckin(count === 0);
      } catch {
        // Non-critical: tutorial stays inactive on error
      }
    }
    loadTutorialState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // db is a stable ref; load once at mount

  // Control tour based on current check-in step
  useEffect(() => {
    if (!tutorialActive) return;
    const tour = tourRef.current;
    if (!tour) return;

    const { levelSlider, feelingsChips, summary } = TUTORIAL_CHECK_IN_STEPS;
    const { levelSlider: idx0, feelingsChips: idx1, summary: idx2 } = TUTORIAL_TOUR_INDICES;

    if (step === levelSlider && !shownCoachMarksRef.current.has(idx0)) {
      // Small delay to let the step render before showing the spotlight
      const t = setTimeout(() => tour.start(), 200);
      return () => clearTimeout(t);
    }
    if (step === feelingsChips && !shownCoachMarksRef.current.has(idx1)) {
      const t = setTimeout(() => tour.goTo(idx1), 200);
      return () => clearTimeout(t);
    }
    if (step === summary && !shownCoachMarksRef.current.has(idx2)) {
      const t = setTimeout(() => tour.goTo(idx2), 200);
      return () => clearTimeout(t);
    }
  }, [step, tutorialActive]);

  async function markTutorialDone() {
    setTutorialActive(false);
    try {
      await updateSettings(db, { tutorialSeen: true });
    } catch {
      // Non-critical
    }
  }

  const handleTourStop = useCallback(({ index }: TourState) => {
    if (skipIntentRef.current) {
      skipIntentRef.current = false;
      markTutorialDone();
      return;
    }
    shownCoachMarksRef.current.add(index);
    // All 3 coach marks shown → tutorial complete
    if (shownCoachMarksRef.current.size >= 3) {
      markTutorialDone();
    }
  // markTutorialDone closes over db + setTutorialActive — both stable refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function makeSkipHandler(stop: () => void) {
    return () => {
      skipIntentRef.current = true;
      stop();
    };
  }

  const tourSteps = useMemo<TourStep[]>(() => [
    {
      render: ({ stop }) => (
        <CoachMarkTooltip
          text={TUTORIAL_COACH_MARK_TEXTS.levelSlider}
          onDismiss={stop}
          onSkip={makeSkipHandler(stop)}
        />
      ),
      shape: { type: 'rectangle', padding: 8 },
      motion: 'fade',
    },
    {
      render: ({ stop }) => (
        <CoachMarkTooltip
          text={TUTORIAL_COACH_MARK_TEXTS.feelingsChips}
          onDismiss={stop}
          onSkip={makeSkipHandler(stop)}
        />
      ),
      shape: { type: 'rectangle', padding: 8 },
      motion: 'fade',
    },
    {
      render: ({ stop }) => (
        <CoachMarkTooltip
          text={TUTORIAL_COACH_MARK_TEXTS.summary}
          onDismiss={stop}
          onSkip={makeSkipHandler(stop)}
        />
      ),
      shape: { type: 'rectangle', padding: 8 },
      motion: 'fade',
    },
  // makeSkipHandler only closes over skipIntentRef (stable ref), no reactive deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useFocusEffect(
    useCallback(() => {
      // On focus: reset if check-in was abandoned for too long
      if (leftAtRef.current !== null && stepRef.current > 0) {
        const elapsed = Date.now() - leftAtRef.current;
        if (elapsed > INACTIVITY_TIMEOUT_MS) {
          setStep(0);
          setDraft({ ...EMPTY_DRAFT, bodySignals: { ...EMPTY_BODY_SIGNALS } });
          setIsDone(false);
          setWasReset(true);
        }
      }
      leftAtRef.current = null;

      return () => {
        // On blur: record leave time if check-in is in progress
        if (stepRef.current > 0) {
          leftAtRef.current = Date.now();
        }
      };
    }, [])
  );

  const canGoBack = step > 0;
  const isLastStep = step === TOTAL_STEPS - 1;
  const isStepBlocked =
    (step === 1 && draft.energyLevel === 0) ||
    (step === 2 && draft.focusLevel === 0);
  const isNextDisabled = isSaving || isStepBlocked;

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

  function handleNext() {
    if (wasReset) setWasReset(false);
    if (isLastStep) {
      handleSave();
    } else {
      setStep(step + 1);
    }
  }

  function handleBack() {
    if (canGoBack) {
      setStep(step - 1);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await insertCheckIn(db, {
        energyLevel: draft.energyLevel,
        focusLevel: draft.focusLevel,
        bodySignals: draft.bodySignals,
        feelings: draft.feelings,
        distressLevel: draft.distressLevel,
        distressNote: draft.distressNote || null,
        thoughtsType: draft.thoughtsType,
        thoughtsNote: draft.thoughtsNote || null,
        selfCareNote: draft.selfCareNote || null,
        innerPart: draft.innerPart || null,
        note: draft.note || null,
      });
      setIsDone(true);
    } catch (error) {
      console.error('[CheckIn] save failed:', error instanceof Error ? error.message : String(error));
      Alert.alert('Fehler beim Speichern', 'Check-in konnte nicht gespeichert werden. Bitte versuche es erneut.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    setStep(0);
    setDraft({ ...EMPTY_DRAFT, bodySignals: { ...EMPTY_BODY_SIGNALS } });
    setIsDone(false);
    setWasReset(false);
  }

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
    const levelSliderTutorial = tutorialActive ? TUTORIAL_TOUR_INDICES.levelSlider : undefined;
    const feelingsTutorial = tutorialActive ? TUTORIAL_TOUR_INDICES.feelingsChips : undefined;
    const summaryTutorial = tutorialActive ? TUTORIAL_TOUR_INDICES.summary : undefined;

    switch (step) {
      case 0:
        return <StepArrival />;
      case 1:
        return (
          <StepEnergy
            value={draft.energyLevel}
            onValueChange={(v) => setDraft({ ...draft, energyLevel: v })}
            tutorialIndex={levelSliderTutorial}
          />
        );
      case 2:
        return (
          <StepFocus
            value={draft.focusLevel}
            onValueChange={(v) => setDraft({ ...draft, focusLevel: v })}
          />
        );
      case 3:
        return (
          <StepBodySignals
            value={draft.bodySignals}
            onValueChange={(v) => setDraft({ ...draft, bodySignals: v })}
          />
        );
      case 4:
        return (
          <StepFeelings
            value={draft.feelings}
            onValueChange={(v) => setDraft({ ...draft, feelings: v })}
            tutorialIndex={feelingsTutorial}
          />
        );
      case 5:
        return (
          <StepDistress
            distressLevel={draft.distressLevel}
            distressNote={draft.distressNote}
            onLevelChange={(v) => setDraft({ ...draft, distressLevel: v })}
            onNoteChange={(v) => setDraft({ ...draft, distressNote: v })}
          />
        );
      case 6:
        return (
          <StepThoughts
            type={draft.thoughtsType}
            note={draft.thoughtsNote}
            onTypeChange={(v) => setDraft({ ...draft, thoughtsType: v })}
            onNoteChange={(v) => setDraft({ ...draft, thoughtsNote: v })}
          />
        );
      case 7:
        return (
          <StepSelfCare
            value={draft.selfCareNote}
            onValueChange={(v) => setDraft({ ...draft, selfCareNote: v })}
          />
        );
      case 8:
        return (
          <StepSummary
            draft={draft}
            tutorialIndex={summaryTutorial}
            showPostFirstCheckinHint={isFirstCheckin && !tutorialActive}
          />
        );
      default:
        return null;
    }
  }

  const screenContent = (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.indicatorWrapper, { paddingTop: spacing.lg }]}>
        <StepIndicator totalSteps={TOTAL_STEPS} currentStep={step} />
      </View>

      {wasReset && step === 0 && (
        <View style={[styles.resetHint, { marginHorizontal: spacing.lg, marginTop: spacing.sm, backgroundColor: theme.colors.surface, borderRadius: radii.md, padding: spacing.md }]}>
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

      <FadeView
        triggerKey={step}
        style={[styles.stepContent, { padding: spacing.lg }]}
      >
        <View
          ref={stepContentRef}
          accessibilityLabel={`Schritt ${step + 1} von ${TOTAL_STEPS}: ${STEP_NAMES[step]}`}
          accessibilityRole="summary"
          style={styles.stepInner}
        >
          {renderStep()}
        </View>
      </FadeView>

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
            accessibilityLabel="Zurück"
          >
            <Text
              style={{
                fontFamily: typography.families.ui.medium,
                fontSize: typography.sizes.md,
                color: theme.colors.text,
              }}
            >
              Zurück
            </Text>
          </Pressable>
        ) : (
          <View style={styles.navButton} />
        )}

        <Pressable
          onPress={handleNext}
          disabled={isNextDisabled}
          style={({ pressed }) => [
            styles.navButton,
            {
              minHeight: touchTarget.min,
              borderRadius: radii.md,
              backgroundColor: isNextDisabled
                ? theme.colors.border
                : theme.colors.primary,
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
            {isLastStep ? (isSaving ? 'Speichern...' : 'Speichern') : 'Weiter'}
          </Text>
        </Pressable>
      </View>

    </View>
  );

  if (!tutorialActive) {
    return screenContent;
  }

  return (
    <SpotlightTourProvider
      ref={tourRef}
      steps={tourSteps}
      overlayColor={theme.colors.text}
      overlayOpacity={0.6}
      onStop={handleTourStop}
      nativeDriver={false}
    >
      {screenContent}
    </SpotlightTourProvider>
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
  navigation: {
    flexDirection: 'row',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetHint: {
    alignItems: 'center',
  },
});
