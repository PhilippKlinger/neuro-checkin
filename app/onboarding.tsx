import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, AccessibilityInfo } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../lib/hooks/useTheme';
import { useDatabase } from '../lib/hooks/useDatabase';
import { FadeView } from '../components/ui/FadeView';
import { updateSettings } from '../lib/database/settings';
import { StepIndicator } from '../components/check-in/StepIndicator';

interface OnboardingStep {
  title: string;
  body: string;
  hint: string;
}

const STEPS: OnboardingStep[] = [
  {
    title: 'Willkommen',
    body: 'Neuro Check-in hilft dir, innere Zustaende wahrzunehmen und festzuhalten — in deinem Tempo, ohne Druck.',
    hint: 'Alles bleibt lokal auf deinem Geraet.',
  },
  {
    title: 'So funktioniert es',
    body: 'Ein Check-in fuehrt dich in 8 ruhigen Schritten durch Koerper, Gefuehle und Gedanken. Du entscheidest, wie tief du gehst.',
    hint: 'Stichworte reichen. Es muss nicht perfekt sein.',
  },
  {
    title: 'Fuer dich gemacht',
    body: 'Keine Streaks, keine Punkte, kein Druck. Diese App ist ein Werkzeug — kein Richter und kein Therapieersatz.',
    hint: 'Du kannst jederzeit in den Einstellungen die Farbpalette anpassen.',
  },
];

export default function OnboardingScreen() {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
  const db = useDatabase();
  const router = useRouter();
  const [step, setStep] = useState(0);

  const isLastStep = step === STEPS.length - 1;
  const current = STEPS[step];

  function handleNext() {
    if (isLastStep) {
      finish();
    } else {
      setStep(step + 1);
      AccessibilityInfo.announceForAccessibility(STEPS[step + 1].title);
    }
  }

  async function finish() {
    await updateSettings(db, { onboardingCompleted: true });
    router.replace('/(tabs)');
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, padding: spacing.lg }]}>
      <View style={[styles.skipRow, { paddingTop: spacing.md }]}>
        {!isLastStep ? (
          <Pressable
            onPress={finish}
            style={[styles.skipButton, { padding: spacing.sm }]}
            accessibilityRole="button"
            accessibilityLabel="Onboarding ueberspringen"
          >
            <Text
              style={{
                fontFamily: typography.families.ui.medium,
                fontSize: typography.sizes.sm,
                color: theme.colors.textSecondary,
              }}
            >
              Ueberspringen
            </Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <FadeView triggerKey={step} style={styles.content}>
        <Text
          style={{
            fontFamily: typography.families.heading.bold,
            fontSize: typography.sizes.xxl,
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: spacing.lg,
          }}
          accessibilityRole="header"
        >
          {current.title}
        </Text>
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.md,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            lineHeight: typography.sizes.md * 1.6,
            marginBottom: spacing.xl,
          }}
        >
          {current.body}
        </Text>
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.sm,
            color: theme.colors.primarySoft,
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          {current.hint}
        </Text>
      </FadeView>

      <View style={[styles.footer, { gap: spacing.lg, paddingBottom: spacing.xl }]}>
        <StepIndicator totalSteps={STEPS.length} currentStep={step} />

        <Pressable
          onPress={handleNext}
          style={[
            styles.nextButton,
            {
              minHeight: touchTarget.min,
              borderRadius: radii.md,
              backgroundColor: theme.colors.primary,
              paddingHorizontal: spacing.xl,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isLastStep ? 'Los gehts' : 'Weiter'}
        >
          <Text
            style={{
              fontFamily: typography.families.ui.semibold,
              fontSize: typography.sizes.md,
              color: theme.colors.textInverse,
            }}
          >
            {isLastStep ? 'Los gehts' : 'Weiter'}
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
  skipRow: {
    alignItems: 'flex-end',
  },
  skipButton: {},
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  nextButton: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
});
