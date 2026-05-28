import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  AccessibilityInfo,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/hooks/useTheme';
import { useDatabase } from '../lib/hooks/useDatabase';
import { FadeView } from '../components/ui/FadeView';
import { updateSettings } from '../lib/database/settings';
import { StepIndicator } from '../components/check-in/StepIndicator';
import { themes, ThemeName } from '../lib/constants/themes';

interface OnboardingStep {
  title: string;
  body: string;
  hint: string;
}

const STEPS: OnboardingStep[] = [
  {
    title: 'Willkommen',
    body: 'Ein Check-in ist eine kurze Pause. Ein Moment, um zu schauen, wie es dir gerade geht — Körper, Gefühle, Gedanken.',
    hint: 'Alles bleibt auf deinem Gerät — kein Konto, keine Cloud.',
  },
  {
    title: 'So funktioniert es',
    body: '9 Schritte durch Körper, Gefühle und Gedanken. Du entscheidest, wie tief du gehst.',
    hint: 'Du kannst jeden Schritt überspringen.',
  },
  {
    title: 'Für dich gemacht',
    body: 'Keine Streaks, keine Punkte, kein Druck. Wähle deine Farbwelt.',
    hint: 'Farbe, Dark Mode und Erinnerungen sind jederzeit in den Einstellungen anpassbar.',
  },
];

const PALETTE_LABELS: Record<ThemeName, string> = {
  warmEarth: 'Warm\nEarth',
  coolMist: 'Cool\nMist',
  softSage: 'Soft\nSage',
};

export default function OnboardingScreen() {
  const { theme, themeName, setThemeName, spacing, typography, radii, touchTarget } = useTheme();
  const db = useDatabase();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(themeName);

  const isLastStep = step === STEPS.length - 1;
  const current = STEPS[step];

  function handleThemeSelect(name: ThemeName) {
    setSelectedTheme(name);
    setThemeName(name);
  }

  function handleNext() {
    setStep(step + 1);
    AccessibilityInfo.announceForAccessibility(STEPS[step + 1].title);
  }

  async function finish() {
    try {
      await updateSettings(db, {
        onboardingCompleted: true,
        themeName: selectedTheme,
        colorMode: 'light',
      });
      router.replace('/(tabs)');
    } catch (error) {
      console.error('onboarding save failed:', error);
      Alert.alert(
        'Hat nicht geklappt',
        'Einstellungen konnten nicht gespeichert werden. Versuch es nochmal.'
      );
    }
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background, padding: spacing.lg }]}
    >
      <View style={[styles.skipRow, { paddingTop: spacing.md }]}>
        {!isLastStep ? (
          <Pressable
            onPress={() => finish()}
            style={({ pressed }) => [
              styles.skipButton,
              { padding: spacing.sm },
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Onboarding überspringen"
          >
            <Text
              style={{
                fontFamily: typography.families.ui.medium,
                fontSize: typography.sizes.sm,
                color: theme.colors.textSecondary,
              }}
            >
              Überspringen
            </Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <FadeView triggerKey={step} style={styles.content}>
        <ScrollView
          contentContainerStyle={[styles.contentScroll, { paddingVertical: spacing.lg }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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

          {isLastStep ? (
            <View style={[styles.paletteSection, { gap: spacing.md }]}>
              <View style={[styles.paletteGrid, { gap: spacing.md }]}>
                {(Object.keys(themes) as ThemeName[]).map((name) => {
                  const palette = themes[name].light;
                  const isSelected = selectedTheme === name;
                  return (
                    <Pressable
                      key={name}
                      onPress={() => handleThemeSelect(name)}
                      style={({ pressed }) => [
                        styles.paletteCard,
                        {
                          borderRadius: radii.md,
                          borderWidth: 2,
                          borderColor: isSelected ? palette.colors.primary : palette.colors.border,
                          backgroundColor: palette.colors.surface,
                          padding: spacing.md,
                          minHeight: touchTarget.min,
                        },
                        pressed && { opacity: 0.75 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={PALETTE_LABELS[name]}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <View
                        style={[
                          styles.paletteSwatches,
                          { gap: spacing.xs, marginBottom: spacing.sm },
                        ]}
                      >
                        <View
                          style={[
                            styles.swatch,
                            { backgroundColor: palette.colors.primary, borderRadius: radii.full },
                          ]}
                        />
                        <View
                          style={[
                            styles.swatch,
                            { backgroundColor: palette.colors.accent, borderRadius: radii.full },
                          ]}
                        />
                        <View
                          style={[
                            styles.swatch,
                            {
                              backgroundColor: palette.colors.background,
                              borderRadius: radii.full,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={{
                          fontFamily: typography.families.ui.semibold,
                          fontSize: typography.sizes.sm,
                          color: palette.colors.text,
                          textAlign: 'center',
                        }}
                      >
                        {PALETTE_LABELS[name]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : (
            <>
              <Text
                style={{
                  fontFamily: typography.families.body.regular,
                  fontSize: typography.sizes.sm,
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                {current.hint}
              </Text>
              {step === 1 && (
                <Pressable
                  onPress={() => router.push('/check-in-info')}
                  style={({ pressed }) => [
                    styles.learnMoreButton,
                    {
                      marginTop: spacing.lg,
                      alignSelf: 'center',
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.sm,
                      borderRadius: radii.full,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                      minHeight: touchTarget.min,
                    },
                    pressed && { opacity: 0.6 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Mehr über einen Check-in erfahren"
                >
                  <Text
                    style={{
                      fontFamily: typography.families.ui.medium,
                      fontSize: typography.sizes.sm,
                      color: theme.colors.text,
                      textAlign: 'center',
                    }}
                  >
                    Mehr über einen Check-in erfahren
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </ScrollView>
      </FadeView>

      <View
        style={[
          styles.footer,
          { gap: spacing.lg, paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.md) },
        ]}
      >
        {isLastStep && (
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.sm,
              color: theme.colors.textSecondary,
              textAlign: 'center',
            }}
          >
            {current.hint}
          </Text>
        )}
        <StepIndicator totalSteps={STEPS.length} currentStep={step} />

        {isLastStep ? (
          <Pressable
            onPress={() => finish()}
            style={({ pressed }) => [
              styles.nextButton,
              {
                minHeight: touchTarget.min,
                borderRadius: radii.md,
                backgroundColor: theme.colors.accent,
                paddingHorizontal: spacing.xl,
              },
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Loslegen"
          >
            <Text
              style={{
                fontFamily: typography.families.ui.semibold,
                fontSize: typography.sizes.md,
                color: theme.colors.textInverse,
              }}
            >
              Loslegen
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.nextButton,
              {
                minHeight: touchTarget.min,
                borderRadius: radii.md,
                backgroundColor: theme.colors.accent,
                paddingHorizontal: spacing.xl,
              },
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Weiter"
          >
            <Text
              style={{
                fontFamily: typography.families.ui.semibold,
                fontSize: typography.sizes.md,
                color: theme.colors.textInverse,
              }}
            >
              Weiter
            </Text>
          </Pressable>
        )}
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
  },
  contentScroll: {
    flexGrow: 1,
  },
  footer: {
    alignItems: 'center',
  },
  nextButton: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  learnMoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteSection: {
    alignSelf: 'stretch',
  },
  paletteGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  paletteCard: {
    flex: 1,
    alignItems: 'center',
  },
  paletteSwatches: {
    flexDirection: 'row',
  },
  swatch: {
    width: 18,
    height: 18,
  },
});
