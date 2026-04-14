import { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, AccessibilityInfo, Dimensions } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { useReducedMotion } from '../../lib/hooks/useReducedMotion';

export interface SpotlightStep {
  /** Screen-relative position of the element to highlight */
  targetY: number;
  targetHeight: number;
  /** Explanation text shown below/above the highlight */
  hint: string;
}

interface SpotlightOverlayProps {
  visible: boolean;
  steps: SpotlightStep[];
  currentStep: number;
  onNext: () => void;
  onSkip: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const PADDING = 8;

export function SpotlightOverlay({
  visible,
  steps,
  currentStep,
  onNext,
  onSkip,
}: SpotlightOverlayProps) {
  const { theme, spacing, typography, radii } = useTheme();
  const reducedMotion = useReducedMotion();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  useEffect(() => {
    if (!visible) return;
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: reducedMotion ? 0 : 200,
      useNativeDriver: true,
    }).start();
    AccessibilityInfo.announceForAccessibility(step?.hint ?? '');
  }, [visible, currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible || !step) return null;

  const spotTop = step.targetY - PADDING;
  const spotHeight = step.targetHeight + PADDING * 2;
  // Hint card: show below spotlight if space allows, else above
  const hintTop = spotTop + spotHeight + spacing.lg;
  const hintBelow = hintTop + 140 < SCREEN_HEIGHT;

  return (
    <Animated.View
      style={[styles.container, { opacity: fadeAnim }]}
      accessibilityViewIsModal
      accessibilityLabel={`Tutorial Schritt ${currentStep + 1} von ${steps.length}`}
    >
      {/* Top dark panel */}
      <View style={[styles.darkPanel, { top: 0, height: Math.max(0, spotTop) }]} />

      {/* Bottom dark panel */}
      <View
        style={[
          styles.darkPanel,
          { top: spotTop + spotHeight, bottom: 0 },
        ]}
      />

      {/* Left dark panel (beside spotlight) */}
      <View
        style={[
          styles.darkPanel,
          {
            top: spotTop,
            height: spotHeight,
            left: 0,
            width: 0,
          },
        ]}
      />

      {/* Right dark panel (beside spotlight) */}
      <View
        style={[
          styles.darkPanel,
          {
            top: spotTop,
            height: spotHeight,
            right: 0,
            width: 0,
          },
        ]}
      />

      {/* Hint card */}
      <View
        style={[
          styles.hintCard,
          {
            top: hintBelow ? hintTop : spotTop - 140 - spacing.lg,
            backgroundColor: theme.colors.surface,
            borderRadius: radii.lg,
            padding: spacing.lg,
            marginHorizontal: spacing.lg,
          },
        ]}
      >
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.md,
            color: theme.colors.text,
            lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
            marginBottom: spacing.md,
          }}
        >
          {step.hint}
        </Text>

        <Pressable
          onPress={onNext}
          style={[
            styles.nextButton,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: radii.md,
              paddingVertical: spacing.sm,
              minHeight: 44,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Tutorial beenden' : 'Weiter'}
        >
          <Text
            style={{
              fontFamily: typography.families.ui.semibold,
              fontSize: typography.sizes.md,
              color: theme.colors.textInverse,
              textAlign: 'center',
            }}
          >
            {isLast ? 'Los geht\'s' : 'OK'}
          </Text>
        </Pressable>
      </View>

      {/* Skip link */}
      <Pressable
        onPress={onSkip}
        style={[styles.skipButton, { top: spacing.lg, right: spacing.lg }]}
        accessibilityRole="button"
        accessibilityLabel="Tutorial überspringen"
        hitSlop={12}
      >
        <Text
          style={{
            fontFamily: typography.families.ui.medium,
            fontSize: typography.sizes.sm,
            color: theme.colors.textInverse,
          }}
        >
          Überspringen
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  darkPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  hintCard: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  nextButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    position: 'absolute',
  },
});
