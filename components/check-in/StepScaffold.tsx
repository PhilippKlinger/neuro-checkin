import { forwardRef } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';
import { ScrollIndicator, useScrollIndicator } from './ScrollIndicator';

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
  avoidKeyboard?: boolean;
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
    avoidKeyboard = false,
    children,
  },
  ref
) {
  const { theme, spacing, radii, touchTarget } = useTheme();
  const { isScrollable, thumbRatio, scrollRatio, scrollViewProps } = useScrollIndicator();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AppText
          variant="title"
          size="xl"
          style={{ textAlign: 'center', marginBottom: spacing.sm }}
        >
          {title}
        </AppText>
        <AppText
          variant="body"
          color="secondary"
          style={{ textAlign: 'center', marginBottom: hint ? spacing.sm : spacing.lg }}
        >
          {subtitle}
        </AppText>
        {hint && (
          <AppText variant="hint" style={{ textAlign: 'center', marginBottom: spacing.lg }}>
            {hint}
          </AppText>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={avoidKeyboard ? (Platform.OS === 'ios' ? 'padding' : 'height') : undefined}
        style={styles.scrollWrapper}
      >
        <View style={styles.scrollRow}>
          <ScrollView
            ref={ref}
            style={styles.scrollArea}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: spacing.lg },
              centerContent && styles.scrollContentCentered,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps={keyboardPersistTaps ? 'handled' : 'never'}
            {...scrollViewProps}
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
                  <AppText variant="label" color="secondary">
                    Kann ich gerade nicht sagen
                  </AppText>
                </Pressable>
              </>
            )}
          </ScrollView>
          <ScrollIndicator
            visible={isScrollable}
            thumbRatio={thumbRatio}
            scrollRatio={scrollRatio}
          />
        </View>
      </KeyboardAvoidingView>
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
  scrollWrapper: {
    flex: 1,
  },
  scrollRow: {
    flex: 1,
    flexDirection: 'row',
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
  divider: {
    height: 1,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
