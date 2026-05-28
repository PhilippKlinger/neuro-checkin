import { useState } from 'react';
import { View, Pressable, StyleSheet, AccessibilityInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';
import { FadeView } from '../ui/FadeView';
import { StepIndicator } from '../check-in/StepIndicator';
import type { OnboardingSlideContent } from '../../lib/constants/onboardingSlides';

interface OnboardingScaffoldProps {
  slides: OnboardingSlideContent[];
  renderSlide: (slide: OnboardingSlideContent, index: number) => React.ReactNode;
  onFinish: () => void;
}

export function OnboardingScaffold({ slides, renderSlide, onFinish }: OnboardingScaffoldProps) {
  const { theme, spacing, radii, touchTarget, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);

  const current = slides[step];
  const isLast = step === slides.length - 1;

  function handleNext() {
    if (isLast) {
      onFinish();
    } else {
      const nextStep = step + 1;
      setStep(nextStep);
      AccessibilityInfo.announceForAccessibility(slides[nextStep].title);
    }
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background, padding: spacing.lg }]}
    >
      <View style={[styles.skipRow, { paddingTop: spacing.md }]}>
        {current.hasSkip && !isLast ? (
          <Pressable
            onPress={onFinish}
            style={({ pressed }) => [
              styles.skipButton,
              { padding: spacing.sm },
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Onboarding überspringen"
          >
            <AppText
              variant="label"
              size="sm"
              color="secondary"
              style={{ fontFamily: typography.families.ui.medium }}
            >
              Überspringen
            </AppText>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <FadeView triggerKey={step} style={styles.content}>
        {renderSlide(current, step)}
      </FadeView>

      <View
        style={[
          styles.footer,
          { gap: spacing.lg, paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.md) },
        ]}
      >
        <StepIndicator totalSteps={slides.length} currentStep={step} />

        <Pressable
          onPress={handleNext}
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
          accessibilityLabel={current.ctaLabel}
        >
          <AppText variant="label" color="inverse">
            {current.ctaLabel}
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
  skipRow: {
    alignItems: 'flex-end',
  },
  skipButton: {},
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  ctaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
});
