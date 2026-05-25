import { forwardRef, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, NativeScrollEvent, NativeSyntheticEvent, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../lib/hooks/useTheme';

interface SkipConfig {
  onSkip: () => void;
  skipped?: boolean;
}

interface StepScaffoldProps {
  title: string;
  subtitle: string;
  hint?: string;
  skipConfig?: SkipConfig;
  centerContent?: boolean;
  keyboardPersistTaps?: boolean;
  children: React.ReactNode;
}

export const StepScaffold = forwardRef<ScrollView, StepScaffoldProps>(function StepScaffold(
  {
    title,
    subtitle,
    hint,
    skipConfig,
    centerContent = false,
    keyboardPersistTaps = false,
    children,
  },
  ref
) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const layoutHeight = useRef(0);

  const handleContentSizeChange = useCallback((_w: number, h: number) => {
    setHasOverflow(h > layoutHeight.current + 1);
  }, []);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    layoutHeight.current = e.nativeEvent.layout.height;
  }, []);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    setIsAtBottom(distanceFromBottom <= 8);
    setHasOverflow(contentSize.height > layoutMeasurement.height + 1);
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text
          style={{
            fontFamily: typography.families.heading.semibold,
            fontSize: typography.sizes.xl,
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: spacing.sm,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.md,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            marginBottom: hint ? spacing.sm : spacing.lg,
          }}
        >
          {subtitle}
        </Text>
        {hint && (
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.sm,
              color: theme.colors.textSecondary,
              textAlign: 'center',
              fontStyle: 'italic',
              marginBottom: spacing.lg,
            }}
          >
            {hint}
          </Text>
        )}
      </View>

      <View style={styles.scrollWrapper}>
      <ScrollView
        ref={ref}
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: spacing.lg },
          centerContent && styles.scrollContentCentered,
        ]}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps={keyboardPersistTaps ? 'handled' : 'never'}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {children}

        {skipConfig && (
          <>
            <View
              style={[
                styles.divider,
                { backgroundColor: theme.colors.border, marginVertical: spacing.md },
              ]}
            />
            <Pressable
              onPress={skipConfig.onSkip}
              style={({ pressed }) => [
                styles.skipButton,
                {
                  minHeight: touchTarget.min,
                  borderRadius: radii.md,
                  paddingHorizontal: spacing.md,
                  backgroundColor: skipConfig.skipped
                    ? theme.colors.accentSoft
                    : theme.colors.surface,
                  borderWidth: 1,
                  borderColor: skipConfig.skipped ? theme.colors.accent : theme.colors.border,
                },
                pressed && { opacity: 0.75 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Kann ich gerade nicht sagen"
              accessibilityState={{ selected: skipConfig.skipped }}
            >
              <Text
                style={{
                  fontFamily: typography.families.body.regular,
                  fontSize: typography.sizes.md,
                  color: theme.colors.textSecondary,
                  fontStyle: 'italic',
                }}
              >
                Kann ich gerade nicht sagen
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
      {hasOverflow && !isAtBottom && (
        <LinearGradient
          colors={[`${theme.colors.background}00`, theme.colors.background] as const}
          style={styles.fadeOverlay}
          pointerEvents="none"
        />
      )}
      </View>
    </View>
  );
});

const FADE_HEIGHT = 32;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
  },
  scrollWrapper: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentCentered: {
    justifyContent: 'center',
  },
  fadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: FADE_HEIGHT,
  },
  divider: {
    height: 1,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
