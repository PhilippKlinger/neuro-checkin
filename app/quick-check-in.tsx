import { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, AccessibilityInfo, findNodeHandle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/hooks/useTheme';
import { useDatabase } from '../lib/hooks/useDatabase';
import { EMPTY_BODY_SIGNALS } from '../lib/types/checkin';
import { FadeView } from '../components/ui/FadeView';
import { insertCheckIn } from '../lib/database/checkins';
import { StepIndicator } from '../components/check-in/StepIndicator';
import { CheckInSuccessView } from '../components/check-in/CheckInSuccessView';
import { StepEnergy } from '../components/check-in/StepEnergy';
import { StepFocus } from '../components/check-in/StepFocus';
import { QuickStepFeelings } from '../components/check-in/QuickStepFeelings';

const TOTAL_STEPS = 3;
const STEP_NAMES = ['Energie-Level', 'Fokus-Level', 'Gefühle'];

export default function QuickCheckInScreen() {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
  const db = useDatabase();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(0);
  const [focusLevel, setFocusLevel] = useState(0);
  const [feelings, setFeelings] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const stepContentRef = useRef<View>(null);

  // Energy and focus are required; feelings are optional
  const isStepBlocked =
    (step === 0 && energyLevel === 0) ||
    (step === 1 && focusLevel === 0);
  const isNextDisabled = isSaving || isStepBlocked;
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
    if (step > 0) {
      setStep(step - 1);
    } else {
      router.back();
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await insertCheckIn(db, {
        energyLevel,
        focusLevel,
        bodySignals: { ...EMPTY_BODY_SIGNALS },
        feelings,
        thoughtsType: null,
        thoughtsNote: null,
        selfCareNote: null,
        innerPart: null,
        note: null,
      });
      setIsDone(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[QuickCheckIn] save failed — SQLite error:', message, error);
      Alert.alert(
        'Fehler beim Speichern',
        `Check-in konnte nicht gespeichert werden.\n\n${message}`,
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    setStep(0);
    setEnergyLevel(0);
    setFocusLevel(0);
    setFeelings('');
    setIsDone(false);
  }

  if (isDone) {
    return (
      <CheckInSuccessView
        onReset={handleReset}
        energyLevel={energyLevel}
        focusLevel={focusLevel}
      />
    );
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <StepEnergy
            value={energyLevel}
            onValueChange={setEnergyLevel}
          />
        );
      case 1:
        return (
          <StepFocus
            value={focusLevel}
            onValueChange={setFocusLevel}
          />
        );
      case 2:
        return (
          <QuickStepFeelings
            value={feelings}
            onValueChange={setFeelings}
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
            paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.md),
            gap: spacing.md,
          },
        ]}
      >
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
          accessibilityLabel={step === 0 ? 'Abbrechen' : 'Zurück'}
        >
          <Text
            style={{
              fontFamily: typography.families.ui.medium,
              fontSize: typography.sizes.md,
              color: theme.colors.text,
            }}
          >
            {step === 0 ? 'Abbrechen' : 'Zurück'}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleNext}
          disabled={isNextDisabled}
          style={[
            styles.navButton,
            {
              minHeight: touchTarget.min,
              borderRadius: radii.md,
              backgroundColor: isNextDisabled
                ? theme.colors.border
                : theme.colors.primary,
            },
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
});
