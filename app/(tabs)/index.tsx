import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
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
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
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
      return () => { cancelled = true; };
    }, [db])
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, padding: spacing.lg }]}>
      <Text
        style={{
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.xl,
          color: theme.colors.text,
          textAlign: 'center',
          marginTop: spacing.lg,
          marginBottom: spacing.xl,
        }}
        accessibilityRole="header"
      >
        {getGreeting()}
      </Text>

      {isLoaded && (
        latestCheckIn ? (
          <Pressable
            onPress={() => router.push(`/history/${latestCheckIn.id}`)}
            style={({ pressed }) => [
              styles.anchor,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: radii.md,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
                minHeight: touchTarget.min,
                justifyContent: 'center',
              },
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Letzter Check-in, ansehen`}
          >
            <Text
              style={{
                fontFamily: typography.families.ui.medium,
                fontSize: typography.sizes.sm,
                color: theme.colors.textSecondary,
                marginBottom: spacing.xs,
              }}
            >
              Letzter Check-in
            </Text>
            <Text
              style={{
                fontFamily: typography.families.body.regular,
                fontSize: typography.sizes.md,
                color: theme.colors.text,
              }}
            >
              {isWithinSevenDays(latestCheckIn.createdAt)
                ? `${formatDate(latestCheckIn.createdAt)}, ${formatTime(latestCheckIn.createdAt)}`
                : `Energie: ${getLevelLabel(latestCheckIn.energyLevel, ENERGY_LABELS)}`}
            </Text>
          </Pressable>
        ) : (
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.md,
              color: theme.colors.textSecondary,
              textAlign: 'center',
              lineHeight: typography.sizes.md * 1.6,
            }}
          >
            Bereit, wenn du es bist.
          </Text>
        )
      )}

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
        <Text
          style={{
            fontFamily: typography.families.ui.semibold,
            fontSize: typography.sizes.lg,
            color: theme.colors.textInverse,
          }}
        >
          Beginnen
        </Text>
      </Pressable>

      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.xs,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginTop: spacing.lg,
        }}
      >
        Lokal gespeichert · kein Therapieersatz
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  anchor: {
    // intentionally empty — all styles via inline
  },
  spacer: {
    flex: 1,
  },
  cta: {
    alignItems: 'center',
  },
});
