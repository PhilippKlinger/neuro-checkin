import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/hooks/useTheme';
import { ENERGY_LABELS, FOCUS_LABELS, getLevelLabel } from '../../lib/types/checkin';

interface CheckInSuccessViewProps {
  onReset: () => void;
  energyLevel?: number;
  focusLevel?: number;
}

export function CheckInSuccessView({ onReset, energyLevel, focusLevel }: CheckInSuccessViewProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
  const router = useRouter();

  function handleGoHome() {
    onReset();
    router.replace('/(tabs)/');
  }

  function handleGoHistory() {
    onReset();
    router.replace('/(tabs)/history');
  }

  const showSummary = energyLevel !== undefined && focusLevel !== undefined;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          padding: spacing.lg,
        },
      ]}
    >
      <View style={styles.textBlock}>
        <Text
          style={{
            fontFamily: typography.families.heading.semibold,
            fontSize: typography.sizes.xl,
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: spacing.md,
          }}
          accessibilityRole="header"
        >
          Check-in gespeichert
        </Text>
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.md,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            lineHeight: typography.sizes.md * 1.6,
            marginBottom: showSummary ? spacing.lg : spacing.xl,
          }}
        >
          Du hast dir einen Moment für dich genommen. Das zählt.
        </Text>

        {showSummary && (
          <View
            style={[
              styles.summaryRow,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: radii.md,
                padding: spacing.md,
                marginBottom: spacing.xl,
                gap: spacing.lg,
              },
            ]}
          >
            <View style={styles.summaryItem}>
              <Text
                style={{
                  fontFamily: typography.families.ui.medium,
                  fontSize: typography.sizes.xs,
                  color: theme.colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 2,
                }}
              >
                Energie
              </Text>
              <Text
                style={{
                  fontFamily: typography.families.heading.bold,
                  fontSize: typography.sizes.lg,
                  color: theme.colors.primary,
                }}
              >
                {getLevelLabel(energyLevel, ENERGY_LABELS)}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.summaryItem}>
              <Text
                style={{
                  fontFamily: typography.families.ui.medium,
                  fontSize: typography.sizes.xs,
                  color: theme.colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 2,
                }}
              >
                Fokus
              </Text>
              <Text
                style={{
                  fontFamily: typography.families.heading.bold,
                  fontSize: typography.sizes.lg,
                  color: theme.colors.primary,
                }}
              >
                {getLevelLabel(focusLevel, FOCUS_LABELS)}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={[styles.buttons, { gap: spacing.md }]}>
        <Pressable
          onPress={handleGoHome}
          style={[
            styles.button,
            {
              minHeight: touchTarget.min,
              borderRadius: radii.md,
              backgroundColor: theme.colors.primary,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Zurück zu Home"
        >
          <Text
            style={{
              fontFamily: typography.families.ui.semibold,
              fontSize: typography.sizes.md,
              color: theme.colors.textInverse,
            }}
          >
            Zurück zu Home
          </Text>
        </Pressable>

        <Pressable
          onPress={handleGoHistory}
          style={[
            styles.button,
            {
              minHeight: touchTarget.min,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Im Verlauf ansehen"
        >
          <Text
            style={{
              fontFamily: typography.families.ui.medium,
              fontSize: typography.sizes.md,
              color: theme.colors.text,
            }}
          >
            Im Verlauf ansehen
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 32,
  },
  buttons: {
    marginTop: 'auto' as unknown as number,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
