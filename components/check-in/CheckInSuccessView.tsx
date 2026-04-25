import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  function handleGoHome() {
    onReset();
    router.replace('/(tabs)/');
  }

  function handleGoHistory() {
    onReset();
    router.replace('/(tabs)/history');
  }

  const showSummary = energyLevel !== undefined && energyLevel > 0;
  const showFocus = focusLevel !== undefined && focusLevel > 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: spacing.lg,
          paddingHorizontal: spacing.lg,
        },
      ]}
    >
      <View style={styles.textBlock}>
        <Ionicons
          name="checkmark-circle"
          size={64}
          color={theme.colors.success}
          style={{ marginBottom: spacing.lg }}
          accessibilityElementsHidden
        />
        <Text
          style={{
            fontFamily: typography.families.heading.semibold,
            fontSize: typography.sizes.xl,
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: showSummary ? spacing.lg : spacing.xl,
          }}
          accessibilityRole="header"
        >
          Check-in gespeichert
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
                  color: theme.colors.accent,
                }}
              >
                {getLevelLabel(energyLevel!, ENERGY_LABELS)}
              </Text>
            </View>
            {showFocus && (
              <>
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
                      color: theme.colors.accent,
                    }}
                  >
                    {getLevelLabel(focusLevel!, FOCUS_LABELS)}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}
      </View>

      <View style={[styles.buttons, { gap: spacing.md, paddingBottom: Math.max(spacing.lg, insets.bottom + spacing.md) }]}>
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
  },
  textBlock: {
    flex: 1,
    justifyContent: 'center',
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
  buttons: {},
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
