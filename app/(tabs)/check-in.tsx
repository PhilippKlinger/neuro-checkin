import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  AccessibilityInfo,
  findNodeHandle,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { CheckInDraft, EMPTY_DRAFT, EMPTY_BODY_SIGNALS } from '../../lib/types/checkin';
import { FadeView } from '../../components/ui/FadeView';
import { insertCheckIn, countCheckIns } from '../../lib/database/checkins';
import { getSettings, updateSettings } from '../../lib/database/settings';
import { saveUserChips, getUserChips } from '../../lib/database/userChips';
import { StepIndicator } from '../../components/check-in/StepIndicator';
import { GuidedToggle } from '../../components/check-in/GuidedToggle';
import { CheckInSuccessView } from '../../components/check-in/CheckInSuccessView';
import { StepArrival } from '../../components/check-in/StepArrival';
import { StepEnergy } from '../../components/check-in/StepEnergy';
import { StepFocus } from '../../components/check-in/StepFocus';
import { StepBodySignals } from '../../components/check-in/StepBodySignals';
import { StepFeelings, FEELING_CHIPS } from '../../components/check-in/StepFeelings';
import { StepDistress } from '../../components/check-in/StepDistress';
import { StepThoughts } from '../../components/check-in/StepThoughts';
import { StepSelfCare, SELF_CARE_CHIPS } from '../../components/check-in/StepSelfCare';
import { StepSummary } from '../../components/check-in/StepSummary';
import { STEP_HINTS } from '../../lib/constants/hintConfig';
import { INACTIVITY_TIMEOUT_MS } from '../../lib/constants/timing';
import * as Sentry from '@sentry/react-native';

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
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
  const db = useDatabase();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CheckInDraft>({
    ...EMPTY_DRAFT,
    bodySignals: { ...EMPTY_BODY_SIGNALS },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [wasReset, setWasReset] = useState(false);
  const [isFirstCheckin, setIsFirstCheckin] = useState(false);
  const [guidedMode, setGuidedMode] = useState(true);
  const [showToggleIntroHint, setShowToggleIntroHint] = useState(false);
  const [feelingUserChips, setFeelingUserChips] = useState<string[]>([]);
  const [selfCareUserChips, setSelfCareUserChips] = useState<string[]>([]);
  const stepContentRef = useRef<View>(null);
  const stepRef = useRef(step);
  const leftAtRef = useRef<number | null>(null);
  const savingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function loadState() {
        try {
          const [settings, count, feelingChips, selfCareChips] = await Promise.all([
            getSettings(db),
            countCheckIns(db),
            getUserChips(db, 'feelings'),
            getUserChips(db, 'self_care'),
          ]);
          if (cancelled) return;
          setIsFirstCheckin(count === 0);
          setGuidedMode(settings.guidedModeEnabled);
          setShowToggleIntroHint(!settings.guidedToggleIntroduced);
          setFeelingUserChips(feelingChips);
          setSelfCareUserChips(selfCareChips);
        } catch {
          // Non-critical — defaults are safe fallbacks
        }
      }
      loadState();
      return () => {
        cancelled = true;
      };
    }, [db])
  );

  async function handleGuidedToggle(value: boolean) {
    setGuidedMode(value);
    try {
      if (showToggleIntroHint) {
        setShowToggleIntroHint(false);
        await updateSettings(db, { guidedModeEnabled: value, guidedToggleIntroduced: true });
      } else {
        await updateSettings(db, { guidedModeEnabled: value });
      }
    } catch {
      setGuidedMode(!value);
    }
  }

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useFocusEffect(
    useCallback(() => {
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
        if (stepRef.current > 0) {
          leftAtRef.current = Date.now();
        }
      };
    }, [])
  );

  const canGoBack = step > 0;
  const isLastStep = step === TOTAL_STEPS - 1;
  const isStepBlocked =
    (step === 1 && draft.energyLevel === 0 && !draft.energySkipped) ||
    (step === 2 && draft.focusLevel === 0 && !draft.focusSkipped);
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
    if (savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    try {
      await insertCheckIn(db, {
        energyLevel: draft.energyLevel,
        focusLevel: draft.focusLevel,
        energySkipped: draft.energySkipped,
        focusSkipped: draft.focusSkipped,
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
      await Promise.all([
        saveUserChips(db, 'feelings', draft.feelings, [...FEELING_CHIPS]),
        saveUserChips(db, 'self_care', draft.selfCareNote, [...SELF_CARE_CHIPS]),
      ]);
      setIsDone(true);
    } catch (error) {
      Sentry.captureException(error);
      Alert.alert(
        'Fehler beim Speichern',
        'Check-in konnte nicht gespeichert werden. Bitte versuche es erneut.'
      );
    } finally {
      setIsSaving(false);
      savingRef.current = false;
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
            onValueChange={(v) => setDraft({ ...draft, feelings: v })}
            hint={guidedMode ? STEP_HINTS.feelings : undefined}
            userChips={feelingUserChips}
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
            {isLastStep ? (isSaving ? 'Speichern...' : 'Speichern') : 'Weiter'}
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
