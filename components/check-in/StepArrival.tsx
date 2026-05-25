import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/hooks/useTheme';
import { StepScaffold } from './StepScaffold';

interface StepArrivalProps {
  showHintIntro?: boolean;
}

export function StepArrival({ showHintIntro }: StepArrivalProps) {
  const { theme, spacing, typography } = useTheme();

  return (
    <StepScaffold
      title="Ankommen"
      subtitle="Wenn du magst, halte einen Moment inne — bevor es weitergeht."
      centerContent
    >
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
          <View style={styles.hintIcon}>
            <Ionicons name="bulb" size={18} color={theme.colors.accent} />
          </View>
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.sm,
              color: theme.colors.textSecondary,
              fontStyle: 'italic',
              flexShrink: 1,
            }}
          >
            Bei jedem Schritt siehst du einen kurzen Hinweis. Ab dem nächsten Schritt kannst du sie
            mit diesem Symbol oben rechts ausschalten.
          </Text>
        </View>
      )}
    </StepScaffold>
  );
}

const styles = StyleSheet.create({
  body: {
    textAlign: 'center',
  },
  hint: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  hintIntro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  hintIcon: {
    flexShrink: 0,
    marginTop: 2,
  },
});
