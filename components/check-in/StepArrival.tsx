import { StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';
import { StepScaffold } from './StepScaffold';

export function StepArrival() {
  const { spacing } = useTheme();

  return (
    <StepScaffold title="Ankommen" subtitle="Einen Moment, bevor es losgeht." centerContent>
      <AppText variant="body" color="secondary" style={[styles.body, { marginBottom: spacing.md }]}>
        Atme einmal langsam aus.
      </AppText>
    </StepScaffold>
  );
}

const styles = StyleSheet.create({
  body: {
    textAlign: 'center',
  },
});
