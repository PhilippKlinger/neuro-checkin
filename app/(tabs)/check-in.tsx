import { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, AccessibilityInfo, findNodeHandle } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { CheckInDraft, EMPTY_DRAFT, EMPTY_BODY_SIGNALS } from '../../lib/types/checkin';
import { FadeView } from '../../components/ui/FadeView';
import { insertCheckIn } from '../../lib/database/checkins';
import { getSettings, updateSettings } from '../../lib/database/settings';
import { StepIndicator } from '../../components/check-in/StepIndicator';
import { TutorialHint } from '../../components/check-in/TutorialHint';
import { CheckInSuccessView } from '../../components/check-in/CheckInSuccessView';
import { StepArrival } from '../../components/check-in/StepArrival';
import { StepEnergy } from '../../components/check-in/StepEnergy';
import { StepFocus } from '../../components/check-in/StepFocus';
import { StepBodySignals } from '../../components/check-in/StepBodySignals';
import { StepFeelings } from '../../components/check-in/StepFeelings';
import { StepThoughts } from '../../components/check-in/StepThoughts';
import { StepSelfCare } from '../../components/check-in/StepSelfCare';
import { StepSummary } from '../../components/check-in/StepSummary';

const TOTAL_STEPS = 8;

const TUTORIAL_HINTS: string[] = [
  'Hier geht es nur ums Wahrnehmen. Schließ die Augen wenn du magst, atme ein paar Mal tief. Es gibt nichts zu tun.',
  'Tippe auf die Zahl, die sich am passendsten anfühlt. Es gibt keine richtige Antwort — dein Gefühl zählt.',
  'Wie klar fühlst du dich gerade im Kopf? 1 = ganz vernebelt, 10 = glasklar.',
  'Geh die Liste durch und tippe Ja oder Nein. Wenn du dir nicht sicher bist, lass es einfach offen.',
  'Stichworte reichen völlig. Beispiele: müde, unruhig, dankbar, überfordert, ruhig.',
  'Wähle aus, wie sich deine Gedanken gerade anfühlen. Das muss kein exaktes Urteil sein.',
  'Was bräuchtest du gerade? Auch kleine Dinge zählen — Wasser, frische Luft, eine kurze Pause.',
  'Hier siehst du alles auf einen Blick. Tippe auf Speichern wenn du bereit bist.',
];

const STEP_NAMES = [
  'Ankommen',
  'Energie-Level',
  'Fokus-Level',
  'Körpersignale',
  'Gefühle',
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
  const [isTutorial, setIsTutorial] = useState(false);
  const stepContentRef = useRef<View>(null);

  useEffect(() => {
    async function loadTutorialState() {
      const settings = await getSettings(db);
      setIsTutorial(!settings.firstCheckInCompleted);
    }
    loadTutorialState();
  }, [db]);

  const canGoBack = step > 0;
  const isLastStep = step === TOTAL_STEPS - 1;

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
      if (isTutorial) {
        await updateSettings(db, { firstCheckInCompleted: true });
        setIsTutorial(false);
      }
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
    return <CheckInSuccessView onReset={handleReset} />;
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
          {isTutorial && (
            <TutorialHint key={step} text={TUTORIAL_HINTS[step]} />
          )}
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
});
