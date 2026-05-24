import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/hooks/useTheme';

interface StepArrivalProps {
  showHintIntro?: boolean;
}

export function StepArrival({ showHintIntro }: StepArrivalProps) {
  const { theme, spacing, typography } = useTheme();

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.title,
          {
            fontFamily: typography.families.heading.semibold,
            fontSize: typography.sizes.xl,
            color: theme.colors.text,
            marginBottom: spacing.lg,
          },
        ]}
      >
        Ankommen
      </Text>
      <Text
        style={[
          styles.body,
          {
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.md,
            color: theme.colors.textSecondary,
            lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
            marginBottom: spacing.md,
          },
        ]}
      >
        Wenn du magst, halte einen Moment inne — bevor es weitergeht.
      </Text>
      <Text
        style={[
          styles.body,
          {
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.md,
            color: theme.colors.textSecondary,
            lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
            marginBottom: spacing.md,
          },
        ]}
      >
        Wenn du magst, bemerke wie du gerade atmest — oder wie du sitzt oder stehst.{'\n'}
        Oder einfach, wie es dir in diesem Moment geht.
      </Text>
      <Text
        style={[
          styles.hint,
          {
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.sm,
            color: theme.colors.textSecondary,
            marginTop: spacing.xl,
          },
        ]}
      >
        Es gibt kein Richtig oder Falsch. Einfach wahrnehmen, was da ist.
      </Text>
      {showHintIntro && (
        <View style={[styles.hintIntro, { marginTop: spacing.xl, gap: spacing.xs }]}>
          <Ionicons name="bulb" size={14} color={theme.colors.accent} />
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.xs,
              color: theme.colors.textSecondary,
              fontStyle: 'italic',
            }}
          >
            Bei jedem Schritt siehst du einen kurzen Hinweis. Das Symbol oben rechts schaltet sie
            aus.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
  },
  hint: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  hintIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
