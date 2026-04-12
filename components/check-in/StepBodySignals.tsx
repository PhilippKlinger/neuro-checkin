import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { BodySignals } from '../../lib/types/checkin';

interface StepBodySignalsProps {
  value: BodySignals;
  onValueChange: (value: BodySignals) => void;
}

interface SignalItem {
  key: keyof BodySignals;
  label: string;
  description: string;
}

const SIGNALS: SignalItem[] = [
  { key: 'hunger', label: 'Hunger', description: 'Hast du Hunger?' },
  { key: 'thirst', label: 'Durst', description: 'Hast du Durst?' },
  {
    key: 'temperature',
    label: 'Temperatur',
    description: 'Ist dir zu warm oder zu kalt?',
  },
  { key: 'pain', label: 'Schmerzen', description: 'Hast du irgendwo Schmerzen?' },
  { key: 'restroom', label: 'Toilette', description: 'Musst du auf Toilette?' },
  {
    key: 'seating',
    label: 'Sitzposition',
    description: 'Sitzt du unbequem?',
  },
  {
    key: 'externalStimuli',
    label: 'Reize',
    description: 'Stören dich Licht, Geräusche oder Gerüche?',
  },
];

export function StepBodySignals({ value, onValueChange }: StepBodySignalsProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();

  function toggle(key: keyof BodySignals) {
    const current = value[key];
    // null -> true -> false -> null (three-state cycle)
    const next = current === null ? true : current === true ? false : null;
    onValueChange({ ...value, [key]: next });
  }

  function getButtonStyle(state: boolean | null) {
    if (state === true) {
      return {
        backgroundColor: theme.colors.primarySoft,
        borderColor: theme.colors.primary,
      };
    }
    if (state === false) {
      return {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      };
    }
    return {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
    };
  }

  function getLabel(state: boolean | null): string {
    if (state === true) return 'Ja';
    if (state === false) return 'Nein';
    return '—';
  }

  return (
    <View style={styles.container}>
      <Text
        style={{
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.xl,
          color: theme.colors.text,
          textAlign: 'center',
          marginBottom: spacing.sm,
        }}
      >
        Körpersignale
      </Text>
      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.md,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginBottom: spacing.xl,
        }}
      >
        Was nimmt dein Körper gerade wahr?
      </Text>

      <View style={[styles.signalList, { gap: spacing.sm }]}>
        {SIGNALS.map((signal) => {
          const state = value[signal.key];
          const buttonStyle = getButtonStyle(state);
          return (
            <Pressable
              key={signal.key}
              onPress={() => toggle(signal.key)}
              style={[
                styles.signalRow,
                {
                  minHeight: touchTarget.min,
                  borderRadius: radii.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  backgroundColor: buttonStyle.backgroundColor,
                  borderWidth: 1,
                  borderColor: buttonStyle.borderColor,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${signal.label}: ${getLabel(state)}`}
              accessibilityHint="Tippen zum Wechseln: nicht beantwortet, Ja, Nein"
            >
              <View style={styles.signalTextWrapper}>
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
              <Text
                style={{
                  fontFamily: typography.families.ui.semibold,
                  fontSize: typography.sizes.md,
                  color:
                    state === true
                      ? theme.colors.primary
                      : theme.colors.textSecondary,
                  minWidth: 36,
                  textAlign: 'center',
                }}
              >
                {getLabel(state)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  signalList: {
    flex: 1,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signalTextWrapper: {
    flex: 1,
  },
});
