import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../lib/hooks/useTheme';
import { useDatabase } from '../lib/hooks/useDatabase';
import { updateSettings } from '../lib/database/settings';
import { OnboardingScaffold } from '../components/onboarding/OnboardingScaffold';
import { EnsoIllustration } from '../components/onboarding/EnsoIllustration';
import { AppDisplayFrame } from '../components/onboarding/AppDisplayFrame';
import { NotificationMock } from '../components/onboarding/NotificationMock';
import { OnboardingBullet } from '../components/onboarding/OnboardingBullet';
import { PaletteSelect } from '../components/onboarding/PaletteSelect';
import { AppText } from '../components/ui/AppText';
import { ONBOARDING_SLIDES, OnboardingSlideContent } from '../lib/constants/onboardingSlides';
import { ThemeName } from '../lib/constants/themes';

export default function OnboardingScreen() {
  const { theme, themeName, setThemeName, spacing } = useTheme();
  const db = useDatabase();
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(themeName);

  function handleThemeSelect(name: ThemeName) {
    setSelectedTheme(name);
    setThemeName(name);
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

  function renderSlide(slide: OnboardingSlideContent, _index: number) {
    return (
      <View style={[styles.slideContent, { gap: spacing.lg }]}>
        {renderVisual(slide)}
        <View style={[styles.textSection, { gap: spacing.sm }]}>
          <AppText variant="display" style={{ textAlign: 'center' }} accessibilityRole="header">
            {slide.title}
          </AppText>
          {slide.body && (
            <AppText variant="body" color="secondary" style={{ textAlign: 'center' }}>
              {slide.body}
            </AppText>
          )}
        </View>
        {slide.bullets && (
          <View style={[styles.bullets, { gap: spacing.sm }]}>
            {slide.bullets.map((bullet, i) => (
              <OnboardingBullet key={i} icon={bullet.icon} text={bullet.text} />
            ))}
          </View>
        )}
      </View>
    );
  }

  function renderVisual(slide: OnboardingSlideContent) {
    switch (slide.kind) {
      case 'enso':
        return (
          <View style={styles.visualCenter}>
            <EnsoIllustration size={130} />
          </View>
        );

      case 'levelDemo':
        return (
          <AppDisplayFrame>
            <AppText variant="label" size="sm" weight="semibold" style={{ marginBottom: 4 }}>
              Energie
            </AppText>
            <AppText variant="body" size="sm" color="secondary" style={{ marginBottom: 10 }}>
              Wie viel Energie hast du gerade?
            </AppText>
            <View style={[styles.levelRow, { gap: spacing.xs }]}>
              {['Sehr\nwenig', 'Wenig', 'Mittel', 'Viel', 'Sehr\nviel'].map((label, i) => (
                <View
                  key={i}
                  style={[
                    styles.levelBox,
                    {
                      backgroundColor: i === 1 ? theme.colors.accentSoft : theme.colors.surface,
                      borderColor: i === 1 ? theme.colors.accent : theme.colors.border,
                      borderWidth: 1,
                      borderRadius: 8,
                      padding: 6,
                    },
                  ]}
                >
                  <AppText variant="body" size="sm" style={{ textAlign: 'center', fontSize: 10 }}>
                    {label}
                  </AppText>
                </View>
              ))}
            </View>
          </AppDisplayFrame>
        );

      case 'bulbDemo':
        return (
          <AppDisplayFrame>
            <View style={styles.bulbHeader}>
              <View style={{ flex: 1 }}>
                <AppText variant="label" size="sm" weight="semibold" style={{ marginBottom: 4 }}>
                  Gefühle
                </AppText>
                <AppText variant="body" size="sm" color="secondary">
                  Welche Gefühle sind gerade da?
                </AppText>
              </View>
              <View
                style={[
                  styles.bulbIcon,
                  {
                    backgroundColor: theme.colors.accentSoft,
                    borderRadius: 14,
                  },
                ]}
              >
                <AppText variant="label" size="sm">💡</AppText>
              </View>
            </View>
            <AppText variant="hint" style={{ marginTop: 6, marginBottom: 10 }}>
              Ein Wort reicht. Mehrere sind ok.
            </AppText>
            <View style={[styles.chipRow, { gap: spacing.xs }]}>
              {['neutral', 'erschöpft', 'leer', 'leicht'].map((chip, i) => (
                <View
                  key={i}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: i === 1 ? theme.colors.accentSoft : theme.colors.surface,
                      borderColor: i === 1 ? theme.colors.accent : theme.colors.border,
                      borderWidth: 1,
                      borderRadius: 16,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                    },
                  ]}
                >
                  <AppText variant="body" size="sm">{chip}</AppText>
                </View>
              ))}
            </View>
          </AppDisplayFrame>
        );

      case 'notificationPriming':
        return <NotificationMock />;

      case 'palette':
        return <PaletteSelect currentTheme={selectedTheme} onSelect={handleThemeSelect} />;

      default:
        return null;
    }
  }

  return (
    <OnboardingScaffold
      slides={ONBOARDING_SLIDES}
      renderSlide={renderSlide}
      onFinish={finish}
    />
  );
}

const styles = StyleSheet.create({
  slideContent: {
    alignItems: 'center',
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  bullets: {
    alignSelf: 'stretch',
    paddingHorizontal: 8,
  },
  visualCenter: {
    alignItems: 'center',
    marginBottom: 8,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulbHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulbIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {},
});
