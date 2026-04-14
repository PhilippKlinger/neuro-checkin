import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

export function StepArrival() {
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
        Wenn du magst, nimm einen Moment inne — bevor es weitergeht.
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
        Vielleicht bemerkst du, wie du gerade atmest — oder wie du sitzt oder stehst.{'\n'}
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
});
