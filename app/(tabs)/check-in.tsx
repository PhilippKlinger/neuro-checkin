import { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, AccessibilityInfo } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { CheckInDraft, EMPTY_DRAFT, EMPTY_BODY_SIGNALS } from '../../lib/types/checkin';
import { insertCheckIn } from '../../lib/database/checkins';
import { StepIndicator } from '../../components/check-in/StepIndicator';
import { StepArrival } from '../../components/check-in/StepArrival';
import { StepEnergy } from '../../components/check-in/StepEnergy';
import { StepFocus } from '../../components/check-in/StepFocus';
import { StepBodySignals } from '../../components/check-in/StepBodySignals';
import { StepFeelings } from '../../components/check-in/StepFeelings';
import { StepThoughts } from '../../components/check-in/StepThoughts';
import { StepSelfCare } from '../../components/check-in/StepSelfCare';
import { StepSummary } from '../../components/check-in/StepSummary';

const TOTAL_STEPS = 8;

const STEP_NAMES = [
  'Ankommen',
  'Energie-Level',
  'Fokus-Level',
  'Koerpersignale',
  'Gefuehle',
  'Gedanken',
  'Selbstfuersorge',
  'Zusammenfassung',
];

export default function CheckInScreen() {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
  const db = useDatabase();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CheckInDraft>({ ...EMPTY_DRAFT, bodySignals: { ...EMPTY_BODY_SIGNALS } });
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const stepContentRef = useRef<View>(null);

  const canGoBack = step > 0;
  const isLastStep = step === TOTAL_STEPS - 1;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      `Schritt ${step + 1} von ${TOTAL_STEPS}: ${STEP_NAMES[step]}`
    );
    if (stepContentRef.current) {
      stepContentRef.current.setNativeProps({ accessible: true });
      AccessibilityInfo.setAccessibilityFocus(
        stepContentRef.current as unknown as number
      );
    }
  }, [step]);

  function handleNext() {
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
        thoughtsType: draft.thoughtsType,
        thoughtsNote: draft.thoughtsNote || null,
        selfCareNote: draft.selfCareNote || null,
        innerPart: draft.innerPart || null,
        note: draft.note || null,
      });
      setIsDone(true);
    } catch {
      Alert.alert('Fehler', 'Check-in konnte nicht gespeichert werden.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    setStep(0);
    setDraft({ ...EMPTY_DRAFT, bodySignals: { ...EMPTY_BODY_SIGNALS } });
    setIsDone(false);
  }

  if (isDone) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.lg,
          },
        ]}
      >
        <Text
          style={{
            fontFamily: typography.families.heading.semibold,
            fontSize: typography.sizes.xl,
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: spacing.md,
          }}
        >
          Check-in gespeichert
        </Text>
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.md,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            marginBottom: spacing.xl,
          }}
        >
          Gut gemacht. Du hast dir einen Moment fuer dich genommen.
        </Text>
        <Pressable
          onPress={handleReset}
          style={[
            styles.navButton,
            {
              minHeight: touchTarget.min,
              borderRadius: radii.md,
              backgroundColor: theme.colors.primary,
              paddingHorizontal: spacing.xl,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Neuer Check-in"
        >
          <Text
            style={{
              fontFamily: typography.families.ui.semibold,
              fontSize: typography.sizes.md,
              color: theme.colors.textInverse,
            }}
          >
            Neuer Check-in
          </Text>
        </Pressable>
      </View>
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
          />
        );
      case 5:
        return (
          <StepThoughts
            type={draft.thoughtsType}
            note={draft.thoughtsNote}
            onTypeChange={(v) => setDraft({ ...draft, thoughtsType: v })}
            onNoteChange={(v) => setDraft({ ...draft, thoughtsNote: v })}
          />
        );
      case 6:
        return (
          <StepSelfCare
            value={draft.selfCareNote}
            onValueChange={(v) => setDraft({ ...draft, selfCareNote: v })}
          />
        );
      case 7:
        return <StepSummary draft={draft} />;
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

      <View
        ref={stepContentRef}
        style={[styles.stepContent, { padding: spacing.lg }]}
        accessibilityLabel={`Schritt ${step + 1} von ${TOTAL_STEPS}: ${STEP_NAMES[step]}`}
        accessibilityRole="summary"
      >
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
          disabled={isSaving}
          style={[
            styles.navButton,
            {
              minHeight: touchTarget.min,
              borderRadius: radii.md,
              backgroundColor: isSaving
                ? theme.colors.border
                : theme.colors.primary,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isLastStep ? 'Speichern' : 'Weiter'}
        >
          <Text
            style={{
              fontFamily: typography.families.ui.semibold,
              fontSize: typography.sizes.md,
              color: theme.colors.textInverse,
            }}
          >
            {isLastStep ? 'Speichern' : 'Weiter'}
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
