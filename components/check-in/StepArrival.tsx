import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';
import { StepScaffold } from './StepScaffold';

interface StepArrivalProps {
  showHintIntro?: boolean;
}

export function StepArrival({ showHintIntro }: StepArrivalProps) {
  const { theme, spacing } = useTheme();

  return (
    <StepScaffold
      title="Ankommen"
      subtitle="Wenn du magst, halte einen Moment inne — bevor es weitergeht."
      centerContent
    >
      <AppText
        variant="body"
        color="secondary"
        style={[styles.body, { marginBottom: spacing.md }]}
      >
        Wenn du magst, bemerke wie du gerade atmest — oder wie du sitzt oder stehst.{'\n'}
        Oder einfach, wie es dir in diesem Moment geht.
      </AppText>
      <AppText variant="hint" style={[styles.hint, { marginTop: spacing.xl }]}>
        Es gibt kein Richtig oder Falsch. Einfach wahrnehmen, was da ist.
      </AppText>
      {showHintIntro && (
        <View style={[styles.hintIntro, { marginTop: spacing.xl, gap: spacing.xs }]}>
          <View style={styles.hintIcon}>
            <Ionicons name="bulb" size={18} color={theme.colors.accent} />
          </View>
          <AppText variant="hint" style={{ flexShrink: 1 }}>
            Bei jedem Schritt siehst du einen kurzen Hinweis. Ab dem nächsten Schritt kannst du sie
            mit diesem Symbol oben rechts ausschalten.
          </AppText>
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
