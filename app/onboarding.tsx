import { useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  AccessibilityInfo,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/hooks/useTheme';
import { useDatabase } from '../lib/hooks/useDatabase';
import { FadeView } from '../components/ui/FadeView';
import { updateSettings } from '../lib/database/settings';
import { StepIndicator } from '../components/check-in/StepIndicator';
import { AppText } from '../components/ui/AppText';
import { AppearanceModeSection } from '../components/settings/AppearanceModeSection';
import { ThemeSection } from '../components/settings/ThemeSection';
import { FontSection } from '../components/settings/FontSection';
import { ReflectionCard } from '../components/home/ReflectionCard';
import { ENERGY_LABELS, FOCUS_LABELS } from '../lib/types/checkin';
import type { ReflectionResult } from '../lib/utils/reflection';
import type { ThemeName, ColorMode } from '../lib/constants/themes';
import type { FontFamily } from '../lib/types/checkin';

const TOTAL_SLIDES = 5;

// Used only for the VoiceOver/TalkBack slide announcement on navigation.
const SLIDE_TITLES = [
  'Neuro Check-in',
  'Probier einen Schritt',
  'Dein Verlauf',
  'Deine Muster',
  'Aussehen wählen',
];

const DEMO_REFLECTION: ReflectionResult = {
  state: 'active',
  lines: [
    { key: 'energyLow', text: 'Deine Energie war oft niedrig.' },
    { key: 'externalStimuli', text: 'Reize waren oft viel für dich.' },
  ],
};

// Static example check-ins for the history preview. Level indices map into the
// real ENERGY_LABELS / FOCUS_LABELS arrays so the preview can never show a
// label the real app would not produce.
const HISTORY_DEMO = [
  { date: 'Mi., 28.05.2026', time: '09:15', energy: 2, focus: 3, signals: 3 },
  { date: 'Di., 27.05.2026', time: '21:40', energy: 3, focus: 5, signals: 0 },
] as const;

export default function OnboardingScreen() {
  const {
    theme,
    themeName,
    setThemeName,
    colorMode,
    setColorMode,
    fontFamily,
    setFontFamily,
    spacing,
    radii,
    shadows,
    touchTarget,
  } = useTheme();
  const db = useDatabase();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(themeName);
  const [selectedMode, setSelectedMode] = useState<ColorMode>(colorMode);
  const [selectedFont, setSelectedFont] = useState<FontFamily>(fontFamily);
  // Local-only selection for the interactive demo step (level 1-5, default "Wenig").
  const [demoEnergy, setDemoEnergy] = useState(2);

  const isLastSlide = step === TOTAL_SLIDES - 1;
  const hasBack = step > 0;
  const hasSkip = !isLastSlide;

  function handleThemeSelect(name: ThemeName) {
    setSelectedTheme(name);
    setThemeName(name);
  }

  function handleModeChange(mode: ColorMode) {
    setSelectedMode(mode);
    setColorMode(mode);
  }

  function handleFontChange(font: FontFamily) {
    setSelectedFont(font);
    setFontFamily(font);
  }

  function handleNext() {
    if (step < TOTAL_SLIDES - 1) {
      setStep(step + 1);
      AccessibilityInfo.announceForAccessibility(SLIDE_TITLES[step + 1]);
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1);
      AccessibilityInfo.announceForAccessibility(SLIDE_TITLES[step - 1]);
    }
  }

  async function finish() {
    try {
      await updateSettings(db, {
        onboardingCompleted: true,
        themeName: selectedTheme,
        colorMode: selectedMode,
        fontFamily: selectedFont,
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

  function renderSlide() {
    switch (step) {
      case 0:
        return <SlideWelcome />;
      case 1:
        return <SlideStep />;
      case 2:
        return <SlideHistory />;
      case 3:
        return <SlidePatterns />;
      case 4:
        return <SlidePersonalize />;
      default:
        return null;
    }
  }

  function SlideWelcome() {
    return (
      <View style={styles.slideContent}>
        <View style={styles.slideCenter}>
          <Image
            source={require('../assets/icon.png')}
            style={[styles.appIcon, { borderRadius: 16 }]}
            accessibilityLabel="Neuro Check-in App-Icon"
          />
          <AppText variant="label" size="md" style={{ textAlign: 'center', marginTop: spacing.sm }}>
            Neuro Check-in
          </AppText>
          <AppText
            variant="title"
            size="xl"
            style={{ textAlign: 'center', marginTop: spacing.xl }}
            accessibilityRole="header"
          >
            Ein Check-in für Körper, Gefühle und Gedanken.
          </AppText>
          <AppText
            variant="body"
            color="secondary"
            style={{ textAlign: 'center', marginTop: spacing.md }}
          >
            Für Menschen, die nicht immer leichten Zugang dazu haben.
          </AppText>
        </View>
        <View
          style={{
            padding: spacing.md,
            backgroundColor: theme.colors.card,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginTop: spacing.lg,
            ...shadows.sm,
          }}
        >
          <AppText variant="body" size="sm" color="secondary" style={{ textAlign: 'center' }}>
            Keine Streaks, keine Punkte, kein Druck.
          </AppText>
          <AppText
            variant="body"
            size="sm"
            color="secondary"
            style={{ textAlign: 'center', marginTop: spacing.xs }}
          >
            Lokal gespeichert · kein Therapieersatz
          </AppText>
        </View>
      </View>
    );
  }

  function SlideStep() {
    return (
      <View style={styles.slideContent}>
        <AppText
          variant="label"
          size="sm"
          color="secondary"
          style={{
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: spacing.lg,
          }}
        >
          Probier einen Schritt
        </AppText>

        {/* Energy step — same styles + labels as the real StepEnergy / LevelSlider */}
        <View
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: spacing.md,
            ...shadows.sm,
          }}
        >
          <AppText
            variant="title"
            size="xl"
            style={{ textAlign: 'center', marginBottom: spacing.sm }}
            accessibilityRole="header"
          >
            Energie
          </AppText>
          <AppText
            variant="body"
            color="secondary"
            style={{ textAlign: 'center', marginBottom: spacing.sm }}
          >
            Wie viel Energie hast du gerade?
          </AppText>
          <AppText variant="hint" style={{ textAlign: 'center', marginBottom: spacing.lg }}>
            Eine grobe Einschätzung reicht.
          </AppText>

          <View accessibilityRole="radiogroup" accessibilityLabel="Energie">
            {ENERGY_LABELS.map((label, index) => {
              const level = index + 1;
              const isSelected = level === demoEnergy;
              return (
                <Pressable
                  key={label}
                  onPress={() => setDemoEnergy(level)}
                  style={{
                    minHeight: touchTarget.min,
                    borderRadius: radii.md,
                    backgroundColor: isSelected ? theme.colors.accentSoft : theme.colors.surface,
                    borderWidth: 1,
                    borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                    marginBottom: spacing.sm,
                    paddingHorizontal: spacing.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={label}
                  accessibilityHint={`Energie auf „${label}" setzen`}
                  accessibilityState={{ checked: isSelected }}
                >
                  <AppText variant="label">{label}</AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <AppText
          variant="body"
          size="sm"
          color="secondary"
          style={{ textAlign: 'center', marginTop: spacing.md }}
        >
          Eine Auswahl antippen — fertig.
        </AppText>

        <Pressable
          onPress={() => router.push('/check-in-info')}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              marginTop: spacing.md,
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
          <AppText variant="label" size="sm">
            Mehr über einen Check-in erfahren
          </AppText>
        </Pressable>
      </View>
    );
  }

  function SlideHistory() {
    return (
      <View style={styles.slideContent}>
        <AppText
          variant="title"
          size="xl"
          style={{ textAlign: 'center', marginBottom: spacing.sm }}
          accessibilityRole="header"
        >
          Dein Verlauf
        </AppText>
        <AppText
          variant="body"
          color="secondary"
          style={{ textAlign: 'center', marginBottom: spacing.lg }}
        >
          Alle Check-ins untereinander. Antippen für Details.
        </AppText>

        {/* Static history cards — same styles as CheckInCard.tsx, labels derived
            from the real label arrays so they always match the live app. */}
        {HISTORY_DEMO.map((item) => (
          <View
            key={item.date}
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              marginBottom: spacing.xs,
              borderWidth: 1,
              borderColor: theme.colors.border,
              ...shadows.md,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <AppText variant="label" size="sm">
                {item.date}
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppText variant="body" size="xs" color="secondary">
                  {item.time}
                </AppText>
                <AppText
                  variant="label"
                  style={{ color: theme.colors.border, marginLeft: spacing.xs }}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                >
                  ›
                </AppText>
              </View>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: spacing.xs,
                gap: spacing.md,
              }}
            >
              <View style={{ alignItems: 'center' }}>
                <AppText variant="body" size="xs" color="secondary">
                  Energie
                </AppText>
                <AppText variant="label" weight="semibold" size="sm" color="accent">
                  {ENERGY_LABELS[item.energy - 1]}
                </AppText>
              </View>
              <View style={{ alignItems: 'center' }}>
                <AppText variant="body" size="xs" color="secondary">
                  Fokus
                </AppText>
                <AppText variant="label" weight="semibold" size="sm" color="accent">
                  {FOCUS_LABELS[item.focus - 1]}
                </AppText>
              </View>
              {item.signals > 0 && (
                <View style={{ alignItems: 'center' }}>
                  <AppText variant="body" size="xs" color="secondary">
                    Signale
                  </AppText>
                  <AppText variant="label" weight="semibold" size="sm" color="accent">
                    {item.signals}
                  </AppText>
                </View>
              )}
            </View>
          </View>
        ))}

        <AppText
          variant="body"
          size="sm"
          color="secondary"
          style={{ textAlign: 'center', marginTop: spacing.md }}
        >
          Alle Check-ins bleiben auf deinem Gerät.
        </AppText>

        <View
          style={{
            padding: spacing.md,
            backgroundColor: theme.colors.card,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginTop: spacing.md,
            ...shadows.sm,
          }}
        >
          <AppText variant="body" size="sm" color="secondary" style={{ textAlign: 'center' }}>
            Exportierbar als PDF — zum Teilen oder für dich.
          </AppText>
        </View>
      </View>
    );
  }

  function SlidePatterns() {
    return (
      <View style={styles.slideContent}>
        <AppText
          variant="title"
          size="xl"
          style={{ textAlign: 'center', marginBottom: spacing.sm }}
          accessibilityRole="header"
        >
          Deine Muster
        </AppText>
        <AppText
          variant="body"
          color="secondary"
          style={{ textAlign: 'center', marginBottom: spacing.lg }}
        >
          Nach ein paar Check-ins zeigt sich, was sich wiederholt.
        </AppText>

        <ReflectionCard result={DEMO_REFLECTION} hideEyebrow />

        <AppText
          variant="body"
          size="sm"
          color="secondary"
          style={{ textAlign: 'center', marginTop: spacing.lg }}
        >
          Keine KI. Nur zählen, was oft vorkommt.
        </AppText>
        <AppText
          variant="body"
          size="sm"
          color="secondary"
          style={{ textAlign: 'center', marginTop: spacing.xs }}
        >
          Jederzeit in den Einstellungen abschaltbar.
        </AppText>
      </View>
    );
  }

  function SlidePersonalize() {
    return (
      <View style={styles.slideContent}>
        <AppText
          variant="title"
          size="xl"
          style={{ textAlign: 'center', marginBottom: spacing.lg }}
          accessibilityRole="header"
        >
          Aussehen wählen
        </AppText>

        <AppText variant="label" size="sm" color="secondary" style={{ marginBottom: spacing.sm }}>
          Modus
        </AppText>
        <AppearanceModeSection
          currentMode={selectedMode}
          onModeChange={handleModeChange}
          hideTitle
        />

        <View style={{ height: spacing.lg }} />

        <AppText variant="label" size="sm" color="secondary" style={{ marginBottom: spacing.sm }}>
          Farbpalette
        </AppText>
        <ThemeSection currentTheme={selectedTheme} onThemeChange={handleThemeSelect} hideTitle />

        <View style={{ height: spacing.lg }} />

        <AppText variant="label" size="sm" color="secondary" style={{ marginBottom: spacing.sm }}>
          Schriftart
        </AppText>
        <FontSection currentFont={selectedFont} onFontChange={handleFontChange} hideTitle />

        <AppText
          variant="body"
          size="sm"
          color="secondary"
          style={{ textAlign: 'center', marginTop: spacing.lg }}
        >
          Jederzeit in den Einstellungen änderbar.
        </AppText>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingHorizontal: spacing.lg,
          paddingTop: insets.top + spacing.sm,
          paddingBottom: insets.bottom + spacing.md,
        },
      ]}
    >
      {/* Header: Back + Skip */}
      <View style={styles.header}>
        {hasBack ? (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              { padding: spacing.sm, minHeight: touchTarget.min, justifyContent: 'center' },
              pressed && { opacity: 0.6 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Zurück"
          >
            <AppText variant="label" size="sm" color="secondary">
              ← Zurück
            </AppText>
          </Pressable>
        ) : (
          <View />
        )}
        {hasSkip ? (
          <Pressable
            onPress={finish}
            style={({ pressed }) => [
              { padding: spacing.sm, minHeight: touchTarget.min, justifyContent: 'center' },
              pressed && { opacity: 0.6 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Onboarding überspringen"
          >
            <AppText variant="label" size="sm" color="secondary">
              Überspringen
            </AppText>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      {/* Content */}
      <FadeView triggerKey={step} style={styles.contentArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderSlide()}
        </ScrollView>
      </FadeView>

      {/* Footer: Dots + CTA */}
      <View style={[styles.footer, { gap: spacing.md }]}>
        <StepIndicator totalSteps={TOTAL_SLIDES} currentStep={step} />
        <Pressable
          onPress={isLastSlide ? finish : handleNext}
          style={({ pressed }) => [
            styles.ctaButton,
            {
              minHeight: touchTarget.min,
              borderRadius: radii.md,
              backgroundColor: theme.colors.accent,
              paddingHorizontal: spacing.xl,
            },
            pressed && { opacity: 0.75 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isLastSlide ? 'Beginnen' : 'Weiter'}
        >
          <AppText variant="label" weight="semibold" color="inverse">
            {isLastSlide ? 'Beginnen' : 'Weiter'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  slideContent: {
    alignSelf: 'stretch',
  },
  slideCenter: {
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  ctaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  secondaryButton: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIcon: {
    width: 72,
    height: 72,
  },
});
