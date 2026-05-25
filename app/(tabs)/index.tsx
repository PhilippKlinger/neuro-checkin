import { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { AppText } from '../../components/ui/AppText';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { getCheckIns } from '../../lib/database/checkins';
import type { CheckIn } from '../../lib/types/checkin';
import { ENERGY_LABELS, getLevelLabel } from '../../lib/types/checkin';
import { formatDate, formatTime } from '../../lib/utils/format';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isWithinSevenDays(isoDate: string): boolean {
  return Date.now() - new Date(isoDate).getTime() < SEVEN_DAYS_MS;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Guten Morgen';
  if (hour >= 12 && hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}

export default function HomeScreen() {
  const { theme, spacing, radii, touchTarget } = useTheme();
  const db = useDatabase();
  const router = useRouter();
  const [latestCheckIn, setLatestCheckIn] = useState<CheckIn | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        try {
          const results = await getCheckIns(db, 1);
          if (!cancelled) {
            setLatestCheckIn(results[0] ?? null);
            setIsLoaded(true);
          }
        } catch {
          if (!cancelled) setIsLoaded(true);
        }
      }
      load();
      return () => {
        cancelled = true;
      };
    }, [db])
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background, padding: spacing.lg }]}
    >
      <AppText
        variant="title"
        size="xl"
        accessibilityRole="header"
        style={[styles.greeting, { marginTop: spacing.lg, marginBottom: spacing.xl }]}
      >
        {getGreeting()}
      </AppText>

      {isLoaded &&
        (latestCheckIn ? (
          <Pressable
            onPress={() => router.push(`/history/${latestCheckIn.id}`)}
            style={({ pressed }) => [
              styles.anchor,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: radii.md,
                padding: spacing.md,
                borderColor: theme.colors.border,
                minHeight: touchTarget.min,
              },
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Letzter Check-in, ansehen`}
          >
            <AppText variant="label" size="sm" color="secondary" style={{ marginBottom: spacing.xs }}>
              Letzter Check-in
            </AppText>
            <AppText variant="body">
              {isWithinSevenDays(latestCheckIn.createdAt)
                ? `${formatDate(latestCheckIn.createdAt)}, ${formatTime(latestCheckIn.createdAt)}`
                : `Energie: ${getLevelLabel(latestCheckIn.energyLevel, ENERGY_LABELS)}`}
            </AppText>
          </Pressable>
        ) : (
          <AppText variant="body" color="secondary" style={styles.emptyText}>
            Bereit, wenn du es bist.
          </AppText>
        ))}

      <View style={styles.spacer} />

      <Pressable
        onPress={() => router.push('/check-in-selector')}
        style={({ pressed }) => [
          styles.cta,
          {
            borderRadius: radii.md,
            backgroundColor: theme.colors.primary,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.lg,
          },
          pressed && { opacity: 0.75 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Beginnen, Tiefe wählen"
      >
        <AppText variant="label" weight="semibold" size="lg" color="inverse">Beginnen</AppText>
      </Pressable>

      <AppText variant="body" size="xs" color="secondary" style={[styles.footer, { marginTop: spacing.lg }]}>
        Lokal gespeichert · kein Therapieersatz
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  greeting: {
    textAlign: 'center',
  },
  anchor: {
    borderWidth: 1,
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
  },
  cta: {
    alignItems: 'center',
  },
  footer: {
    textAlign: 'center',
  },
});
