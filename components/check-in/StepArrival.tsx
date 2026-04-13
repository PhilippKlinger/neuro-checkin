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
        Nimm ein paar tiefe Atemzüge.
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
        Wie fühlt sich dein Atem gerade an?{'\n'}
        Ist er eher schnell oder langsam?{'\n'}
        Atmest du mehr in den Bauch oder in den Brustraum?
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
        Es gibt kein Richtig oder Falsch. Einfach wahrnehmen.
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
