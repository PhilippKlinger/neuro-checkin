import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  AccessibilityInfo,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { useReducedMotion } from '../../lib/hooks/useReducedMotion';

export interface SpotlightTarget {
  ref: React.RefObject<View | null>;
  hint: string;
}

interface MeasuredArea {
  y: number;
  height: number;
}

interface SpotlightOverlayProps {
  visible: boolean;
  targets: SpotlightTarget[];
  currentStep: number;
  onNext: () => void;
  onSkip: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const PADDING = 12;

export function SpotlightOverlay({
  visible,
  targets,
  currentStep,
  onNext,
  onSkip,
}: SpotlightOverlayProps) {
  const { theme, spacing, typography, radii } = useTheme();
  const reducedMotion = useReducedMotion();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [measured, setMeasured] = useState<MeasuredArea | null>(null);

  const target = targets[currentStep];
  const isLast = currentStep === targets.length - 1;

  useEffect(() => {
    if (!visible || !target?.ref?.current) return;

    // Reset fade and measurement for each step
    fadeAnim.setValue(0);
    setMeasured(null);

    // measure() gives position relative to the window
    target.ref.current.measureInWindow((_x, y, _width, height) => {
      setMeasured({ y, height });
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: reducedMotion ? 0 : 200,
        useNativeDriver: true,
      }).start();
      AccessibilityInfo.announceForAccessibility(target.hint);
    });
  }, [visible, currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible || !target || !measured) return null;

  const spotTop = Math.max(0, measured.y - PADDING);
  const spotHeight = measured.height + PADDING * 2;
  const spotBottom = spotTop + spotHeight;

  // Show hint card below spotlight if enough space, else above
  const hintTop = spotBottom + spacing.md;
  const hintBelow = hintTop + 160 < SCREEN_HEIGHT - 80; // 80 = approx tab bar height

  return (
    <Animated.View
      style={[styles.container, { opacity: fadeAnim }]}
      accessibilityViewIsModal
      accessibilityLabel={`Tutorial Schritt ${currentStep + 1} von ${targets.length}`}
    >
      {/* Top dark panel */}
      <View style={[styles.darkPanel, { top: 0, height: spotTop }]} />

      {/* Bottom dark panel */}
      <View style={[styles.darkPanel, { top: spotBottom, bottom: 0 }]} />

      {/* Hint card */}
      <View
        style={[
          styles.hintCard,
          {
            top: hintBelow
              ? hintTop
              : spotTop - spacing.md - 160,
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
          {target.hint}
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
          accessibilityLabel={isLast ? 'Tutorial beenden' : 'OK'}
        >
          <Text
            style={{
              fontFamily: typography.families.ui.semibold,
              fontSize: typography.sizes.md,
              color: theme.colors.textInverse,
              textAlign: 'center',
            }}
          >
            {isLast ? "Los geht's" : 'OK'}
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
