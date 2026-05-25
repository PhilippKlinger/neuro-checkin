import { forwardRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { NAV_AREA_PADDING } from '../../lib/constants/layout';

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

      <ScrollView
        ref={ref}
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          centerContent && styles.scrollContentCentered,
        ]}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps={keyboardPersistTaps ? 'handled' : 'never'}
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
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: NAV_AREA_PADDING,
  },
  scrollContentCentered: {
    justifyContent: 'center',
  },
  divider: {
    height: 1,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
