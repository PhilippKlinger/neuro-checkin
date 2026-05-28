import { StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';
import { StepScaffold } from './StepScaffold';

interface StepArrivalProps {
  showHintIntro?: boolean;
}

export function StepArrival({ showHintIntro }: StepArrivalProps) {
  const { spacing } = useTheme();

  return (
    <StepScaffold
      title="Ankommen"
      subtitle="Einen Moment, bevor es losgeht."
      centerContent
    >
      <AppText variant="body" color="secondary" style={[styles.body, { marginBottom: spacing.md }]}>
        Atme einmal langsam aus.
      </AppText>
      {showHintIntro && (
        <AppText variant="hint" style={[styles.hint, { marginTop: spacing.xl }]}>
          Hinweise kannst du mit 💡 oben rechts ausschalten.
        </AppText>
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
});
