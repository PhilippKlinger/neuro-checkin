import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
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
  description: string;
}

const SIGNALS: SignalItem[] = [
  { key: 'hunger', label: 'Hunger', description: 'Hast du Hunger?' },
  { key: 'thirst', label: 'Durst', description: 'Hast du Durst?' },
  { key: 'temperature', label: 'Temperatur', description: 'Ist dir zu warm oder zu kalt?' },
  { key: 'pain', label: 'Schmerzen', description: 'Hast du irgendwo Schmerzen?' },
  { key: 'restroom', label: 'Toilette', description: 'Musst du auf Toilette?' },
  { key: 'seating', label: 'Sitzposition', description: 'Sitzt du unbequem?' },
  {
    key: 'externalStimuli',
    label: 'Reize',
    description: 'Stören dich Licht, Geräusche oder Gerüche?',
  },
];

export function StepBodySignals({ value, onValueChange, hint }: StepBodySignalsProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();

  function handlePress(key: keyof BodySignals, pressed: boolean) {
    const current = value[key];
    const next = current === pressed ? null : pressed;
    onValueChange({ ...value, [key]: next });
  }

  return (
    <StepScaffold
      title="Körpersignale"
      subtitle="Was nimmt dein Körper gerade wahr?"
      hint={hint}
    >
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
              accessibilityLabel={signal.label}
            >
              <View style={[styles.signalTextWrapper, { marginRight: spacing.sm }]}>
                <Text
                  style={{
                    fontFamily: typography.families.ui.medium,
                    fontSize: typography.sizes.md,
                    color: theme.colors.text,
                  }}
                >
                  {signal.label}
                </Text>
                <Text
                  style={{
                    fontFamily: typography.families.body.regular,
                    fontSize: typography.sizes.sm,
                    color: theme.colors.textSecondary,
                  }}
                >
                  {signal.description}
                </Text>
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
                  <Text
                    style={{
                      fontFamily: typography.families.ui.semibold,
                      fontSize: typography.sizes.sm,
                      color:
                        state === true ? theme.colors.textInverse : theme.colors.textSecondary,
                    }}
                  >
                    Ja
                  </Text>
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
                  <Text
                    style={{
                      fontFamily: typography.families.ui.semibold,
                      fontSize: typography.sizes.sm,
                      color: state === false ? theme.colors.text : theme.colors.textSecondary,
                    }}
                  >
                    Nein
                  </Text>
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
