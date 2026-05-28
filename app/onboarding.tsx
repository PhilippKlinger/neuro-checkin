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
import type { ThemeName, ColorMode } from '../lib/constants/themes';
import type { FontFamily } from '../lib/types/checkin';

const TOTAL_SLIDES = 6;

const SLIDE_TITLES = [
  'Ein Moment für dich.',
  'Die Schritte eines Check-ins',
  'So sieht ein Schritt aus',
  'Dein Verlauf',
  'Deine Einstellungen',
  'Gestalte deine App.',
];

const STEP_LIST = [
  'Ankommen',
  'Energie & Fokus',
  'Körpersignale',
  'Gefühle',
  'Stress & Gedanken',
  'Selbstfürsorge',
];

const ENERGY_LABELS = ['Sehr wenig', 'Wenig', 'Mittel', 'Viel', 'Sehr viel'];

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
    typography,
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

  const isLastSlide = step === TOTAL_SLIDES - 1;
  const hasBack = step > 0 && !isLastSlide;
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
        return <SlideSteps />;
      case 2:
        return <SlideDetail />;
      case 3:
        return <SlideHistory />;
      case 4:
        return <SlideSettings />;
      case 5:
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
          <AppText
            variant="label"
            size="md"
            style={{ textAlign: 'center', marginTop: spacing.sm }}
          >
            Neuro Check-in
          </AppText>
          <AppText
            variant="title"
            size="xl"
            style={{ textAlign: 'center', marginTop: spacing.xl }}
            accessibilityRole="header"
          >
            Ein Moment für dich.
          </AppText>
          <AppText
            variant="body"
            color="secondary"
            style={{
              textAlign: 'center',
              marginTop: spacing.md,
              lineHeight: typography.sizes.md * 1.6,
            }}
          >
            Ein Check-in führt dich durch Körper, Gefühle und Gedanken. Für Menschen, die nicht
            immer leichten Zugang dazu haben.
          </AppText>
        </View>
        <View
          style={{
            padding: spacing.md,
            backgroundColor: theme.colors.surface,
            borderRadius: radii.md,
            marginTop: spacing.lg,
          }}
        >
          <AppText variant="body" size="sm" color="secondary" style={{ textAlign: 'center' }}>
            Alles bleibt lokal auf deinem Gerät. Kein Konto, keine Cloud, keine Analyse.
          </AppText>
        </View>
      </View>
    );
  }

  function SlideSteps() {
    return (
      <View style={styles.slideContent}>
        <AppText
          variant="title"
          size="xl"
          style={{ textAlign: 'center', marginBottom: spacing.md }}
          accessibilityRole="header"
        >
          Die Schritte eines Check-ins
        </AppText>
        <AppText
          variant="body"
          color="secondary"
          style={{ textAlign: 'center', marginBottom: spacing.lg }}
        >
          9 Schritte beim vollen Check-in. 3 beim Schnell-Check.
        </AppText>

        <View style={{ gap: spacing.xs }}>
          {STEP_LIST.map((label, index) => (
            <View
              key={label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                padding: spacing.sm,
                paddingHorizontal: spacing.md,
                backgroundColor: theme.colors.surface,
                borderRadius: 10,
              }}
            >
              <AppText
                variant="label"
                size="sm"
                style={{ color: theme.colors.accent, minWidth: 16 }}
              >
                {index + 1}
              </AppText>
              <AppText variant="body" size="sm">
                {label}
              </AppText>
            </View>
          ))}
        </View>

        <AppText
          variant="body"
          size="sm"
          color="secondary"
          style={{ textAlign: 'center', marginTop: spacing.lg }}
        >
          Jeder Schritt ist freiwillig.
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

  function SlideDetail() {
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
          So sieht ein Schritt aus
        </AppText>

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
          <AppText variant="title" size="xl" style={{ textAlign: 'center', marginBottom: spacing.sm }}>
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

          {ENERGY_LABELS.map((label, index) => (
            <View
              key={label}
              style={{
                minHeight: touchTarget.min,
                borderRadius: radii.md,
                backgroundColor: index === 1 ? theme.colors.accentSoft : theme.colors.surface,
                borderWidth: 1,
                borderColor: index === 1 ? theme.colors.accent : theme.colors.border,
                marginBottom: spacing.sm,
                paddingHorizontal: spacing.md,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText variant="label">{label}</AppText>
            </View>
          ))}
        </View>

        <AppText
          variant="body"
          size="sm"
          color="secondary"
          style={{ textAlign: 'center', marginTop: spacing.md }}
        >
          Eine Auswahl antippen — fertig. Kein Schritt muss exakt sein.
        </AppText>
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
          Alle Check-ins auf einen Blick. Antippen für Details.
        </AppText>

        <View style={{ gap: spacing.xs }}>
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderWidth: 1,
              borderColor: theme.colors.border,
              ...shadows.md,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
              <AppText variant="label" size="sm">Heute</AppText>
              <AppText variant="body" size="sm" color="secondary">09:15</AppText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <View style={{ width: 8, height: 8, borderRadius: radii.full, backgroundColor: theme.colors.accent }} />
              <AppText variant="body" size="sm" color="secondary">Energie: Wenig</AppText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 }}>
              <View style={{ width: 8, height: 8, borderRadius: radii.full, backgroundColor: theme.colors.accent }} />
              <AppText variant="body" size="sm" color="secondary">Fokus: Mittel</AppText>
            </View>
          </View>

          <View
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderWidth: 1,
              borderColor: theme.colors.border,
              ...shadows.md,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
              <AppText variant="label" size="sm">Gestern</AppText>
              <AppText variant="body" size="sm" color="secondary">21:40</AppText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <View style={{ width: 8, height: 8, borderRadius: radii.full, backgroundColor: theme.colors.accent }} />
              <AppText variant="body" size="sm" color="secondary">Energie: Mittel</AppText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 }}>
              <View style={{ width: 8, height: 8, borderRadius: radii.full, backgroundColor: theme.colors.accent }} />
              <AppText variant="body" size="sm" color="secondary">Fokus: Viel</AppText>
            </View>
          </View>
        </View>

        <View
          style={{
            padding: spacing.sm + 2,
            paddingHorizontal: spacing.md,
            backgroundColor: theme.colors.surface,
            borderRadius: 10,
            marginTop: spacing.md,
          }}
        >
          <AppText variant="body" size="sm" color="secondary" style={{ textAlign: 'center' }}>
            Exportiere einzelne oder mehrere Check-ins als PDF — zum Teilen mit Therapeut:innen
            oder für dich selbst.
          </AppText>
        </View>
      </View>
    );
  }

  function SlideSettings() {
    return (
      <View style={styles.slideContent}>
        <AppText
          variant="title"
          size="xl"
          style={{ textAlign: 'center', marginBottom: spacing.sm }}
          accessibilityRole="header"
        >
          Deine Einstellungen
        </AppText>
        <AppText
          variant="body"
          color="secondary"
          style={{ textAlign: 'center', marginBottom: spacing.lg }}
        >
          Du hast die volle Kontrolle.
        </AppText>

        {/* Group: Erinnerungen */}
        <AppText
          variant="label"
          size="sm"
          color="secondary"
          style={{
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: spacing.sm,
            paddingLeft: spacing.xs,
          }}
        >
          Erinnerungen
        </AppText>
        <View
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: radii.md,
            overflow: 'hidden',
            ...shadows.sm,
            marginBottom: spacing.md,
          }}
        >
          <SettingsRowMock
            label="Morgens"
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <AppText variant="body" size="sm" color="secondary">09:00</AppText>
                <ToggleMock active />
              </View>
            }
            showBorder
          />
          <SettingsRowMock
            label="Abends"
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <AppText variant="body" size="sm" color="secondary">21:00</AppText>
                <ToggleMock active={false} />
              </View>
            }
          />
        </View>

        {/* Group: Check-in */}
        <AppText
          variant="label"
          size="sm"
          color="secondary"
          style={{
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: spacing.sm,
            paddingLeft: spacing.xs,
          }}
        >
          Check-in
        </AppText>
        <View
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: radii.md,
            overflow: 'hidden',
            ...shadows.sm,
            marginBottom: spacing.md,
          }}
        >
          <SettingsRowMock
            label="Hilfe im Check-in"
            right={<ToggleMock active />}
          />
        </View>

        {/* Group: Daten */}
        <AppText
          variant="label"
          size="sm"
          color="secondary"
          style={{
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: spacing.sm,
            paddingLeft: spacing.xs,
          }}
        >
          Daten
        </AppText>
        <View
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: radii.md,
            overflow: 'hidden',
            ...shadows.sm,
            marginBottom: spacing.md,
          }}
        >
          <SettingsRowMock
            label="PDF-Speicherort"
            right={<AppText variant="body" color="secondary">›</AppText>}
            showBorder
          />
          <SettingsRowMock
            label="Eigene Chips verwalten"
            right={<AppText variant="body" color="secondary">›</AppText>}
          />
        </View>

        <AppText
          variant="body"
          size="sm"
          color="secondary"
          style={{ textAlign: 'center', marginTop: spacing.sm }}
        >
          Erinnerungen, Hilfe-Texte und Daten — alles anpassbar.
        </AppText>
      </View>
    );
  }

  function SettingsRowMock({
    label,
    right,
    showBorder = false,
  }: {
    label: string;
    right: React.ReactNode;
    showBorder?: boolean;
  }) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          minHeight: touchTarget.min,
          borderBottomWidth: showBorder ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: theme.colors.border,
        }}
      >
        <AppText variant="body" size="sm">{label}</AppText>
        {right}
      </View>
    );
  }

  function ToggleMock({ active }: { active: boolean }) {
    return (
      <View
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          backgroundColor: active ? theme.colors.accent : theme.colors.border,
          justifyContent: 'center',
          paddingHorizontal: 2,
        }}
      >
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            alignSelf: active ? 'flex-end' : 'flex-start',
          }}
        />
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
          Gestalte deine App.
        </AppText>

        <AppText
          variant="label"
          size="sm"
          color="secondary"
          style={{ marginBottom: spacing.sm }}
        >
          Modus
        </AppText>
        <AppearanceModeSection
          currentMode={selectedMode}
          onModeChange={handleModeChange}
          hideTitle
        />

        <View style={{ height: spacing.lg }} />

        <AppText
          variant="label"
          size="sm"
          color="secondary"
          style={{ marginBottom: spacing.sm }}
        >
          Farbwelt
        </AppText>
        <ThemeSection
          currentTheme={selectedTheme}
          onThemeChange={handleThemeSelect}
          hideTitle
        />

        <View style={{ height: spacing.lg }} />

        <AppText
          variant="label"
          size="sm"
          color="secondary"
          style={{ marginBottom: spacing.sm }}
        >
          Schriftart
        </AppText>
        <FontSection
          currentFont={selectedFont}
          onFontChange={handleFontChange}
          hideTitle
        />

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
