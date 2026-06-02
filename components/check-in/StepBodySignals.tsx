import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';
import { BodySignals } from '../../lib/types/checkin';
import { StepScaffold } from './StepScaffold';

interface StepBodySignalsProps {
  value: BodySignals;
  onValueChange: (value: BodySignals) => void;
  hint?: string;
}

interface SignalItem {
  key: keyof BodySignals;
  label: string;
  description?: string;
}

const SIGNALS: SignalItem[] = [
  { key: 'hunger', label: 'Hunger' },
  { key: 'thirst', label: 'Durst' },
  { key: 'temperature', label: 'Temperatur', description: 'Ist dir zu warm oder zu kalt?' },
  { key: 'pain', label: 'Schmerzen' },
  { key: 'restroom', label: 'Toilette', description: 'Musst du auf Toilette?' },
  { key: 'seating', label: 'Sitzposition', description: 'Sitzt du unbequem?' },
  {
    key: 'externalStimuli',
    label: 'Reize',
    description: 'Stören dich Licht, Geräusche oder Gerüche?',
  },
];

export function StepBodySignals({ value, onValueChange, hint }: StepBodySignalsProps) {
  const { theme, spacing, radii, touchTarget } = useTheme();

  function handlePress(key: keyof BodySignals, pressed: boolean) {
    const current = value[key];
    const next = current === pressed ? null : pressed;
    onValueChange({ ...value, [key]: next });
  }

  return (
    <StepScaffold title="Körpersignale" subtitle="Was ist gerade in deinem Körper?" hint={hint}>
      <View style={[styles.signalList, { gap: spacing.sm }]}>
        {SIGNALS.map((signal) => {
          const state = value[signal.key];
          return (
            <View
              key={signal.key}
              style={[
                styles.signalRow,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: radii.md,
                  paddingLeft: spacing.md,
                  paddingRight: spacing.sm,
                  paddingVertical: spacing.sm,
                  minHeight: touchTarget.min,
                  borderWidth: 1,
                  borderColor: state !== null ? theme.colors.accentSoft : theme.colors.border,
                },
              ]}
              accessibilityLabel={
                signal.description ? `${signal.label}: ${signal.description}` : signal.label
              }
            >
              <View style={[styles.signalTextWrapper, { marginRight: spacing.sm }]}>
                <AppText variant="label">{signal.label}</AppText>
                {signal.description && hint !== undefined && (
                  <AppText variant="hint" color="secondary">
                    {signal.description}
                  </AppText>
                )}
              </View>

              <View style={[styles.buttonGroup, { gap: spacing.xs }]}>
                <Pressable
                  onPress={() => handlePress(signal.key, true)}
                  style={[
                    styles.answerButton,
                    {
                      minWidth: touchTarget.min,
                      minHeight: touchTarget.min,
                      borderRadius: radii.sm,
                      borderWidth: 2,
                      backgroundColor:
                        state === true ? theme.colors.accent : theme.colors.background,
                      borderColor: state === true ? theme.colors.accent : theme.colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${signal.label}: Ja`}
                  accessibilityState={{ selected: state === true }}
                >
                  <AppText
                    variant="label"
                    weight="semibold"
                    size="sm"
                    color={state === true ? 'inverse' : 'secondary'}
                  >
                    Ja
                  </AppText>
                </Pressable>

                <Pressable
                  onPress={() => handlePress(signal.key, false)}
                  style={[
                    styles.answerButton,
                    {
                      minWidth: touchTarget.min,
                      minHeight: touchTarget.min,
                      borderRadius: radii.sm,
                      borderWidth: 2,
                      backgroundColor: theme.colors.background,
                      borderColor: state === false ? theme.colors.text : theme.colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${signal.label}: Nein`}
                  accessibilityState={{ selected: state === false }}
                >
                  <AppText
                    variant="label"
                    weight="semibold"
                    size="sm"
                    color={state === false ? 'primary' : 'secondary'}
                  >
                    Nein
                  </AppText>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </StepScaffold>
  );
}

const styles = StyleSheet.create({
  signalList: {},
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signalTextWrapper: {
    flex: 1,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
