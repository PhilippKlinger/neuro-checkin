import { useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';
import { ENERGY_LABELS, FOCUS_LABELS, getLevelLabel } from '../../lib/types/checkin';

interface CheckInSuccessViewProps {
  onReset: () => void;
  energyLevel?: number;
  focusLevel?: number;
}

export function CheckInSuccessView({ onReset, energyLevel, focusLevel }: CheckInSuccessViewProps) {
  const { theme, spacing, radii, touchTarget, shadows } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    navigation.setOptions({ headerBackVisible: false });
  }, [navigation]);

  function handleGoHome() {
    onReset();
    router.replace('/(tabs)/');
  }

  function handleGoHistory() {
    onReset();
    router.replace('/(tabs)/history');
  }

  // Energy and focus are shown independently so skipping one ("Kann ich gerade
  // nicht sagen") never hides the other — skipping must stay equivalent.
  const showEnergy = energyLevel !== undefined && energyLevel > 0;
  const showFocus = focusLevel !== undefined && focusLevel > 0;
  const showSummary = showEnergy || showFocus;

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
          size={36}
          color={theme.colors.textSecondary}
          style={{ marginBottom: spacing.md }}
          accessibilityElementsHidden
        />
        <AppText
          variant="title"
          size="xl"
          style={{ textAlign: 'center', marginBottom: showSummary ? spacing.lg : spacing.xl }}
          accessibilityRole="header"
        >
          Gespeichert.
        </AppText>

        {showSummary && (
          <View
            style={[
              styles.summaryRow,
              {
                backgroundColor: theme.colors.card,
                borderRadius: radii.md,
                padding: spacing.md,
                marginBottom: spacing.xl,
                gap: spacing.lg,
                ...shadows.md,
              },
            ]}
          >
            {showEnergy && (
              <View style={styles.summaryItem}>
                <AppText
                  variant="label"
                  color="secondary"
                  size="xs"
                  style={{ textTransform: 'uppercase', marginBottom: spacing.xs }}
                >
                  Energie
                </AppText>
                <AppText variant="display" size="lg" color="accent">
                  {getLevelLabel(energyLevel!, ENERGY_LABELS)}
                </AppText>
              </View>
            )}
            {showFocus && (
              <>
                {showEnergy && (
                  <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
                )}
                <View style={styles.summaryItem}>
                  <AppText
                    variant="label"
                    color="secondary"
                    size="xs"
                    style={{ textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}
                  >
                    Fokus
                  </AppText>
                  <AppText variant="display" size="lg" color="accent">
                    {getLevelLabel(focusLevel!, FOCUS_LABELS)}
                  </AppText>
                </View>
              </>
            )}
          </View>
        )}
      </View>

      <View
        style={[
          styles.buttons,
          { gap: spacing.md, paddingBottom: Math.max(spacing.lg, insets.bottom + spacing.md) },
        ]}
      >
        <Pressable
          onPress={handleGoHome}
          style={({ pressed }) => [
            styles.button,
            {
              minHeight: touchTarget.min,
              borderRadius: radii.md,
              backgroundColor: theme.colors.accent,
            },
            pressed && { opacity: 0.75 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Zu Home"
        >
          <AppText variant="label" weight="semibold" color="inverse">
            Zu Home
          </AppText>
        </Pressable>

        <Pressable
          onPress={handleGoHistory}
          style={({ pressed }) => [
            styles.button,
            {
              minHeight: touchTarget.min,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
            pressed && { opacity: 0.75 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Im Verlauf ansehen"
        >
          <AppText variant="label">Im Verlauf ansehen</AppText>
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
