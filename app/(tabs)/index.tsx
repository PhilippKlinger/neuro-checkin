import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { getCheckIns } from '../../lib/database/checkins';
import { CheckIn } from '../../lib/types/checkin';
import { formatDate, formatTime } from '../../lib/utils/format';

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
  const [lastCheckIn, setLastCheckIn] = useState<CheckIn | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        try {
          const data = await getCheckIns(db, 1);
          setLastCheckIn(data.length > 0 ? data[0] : null);
        } finally {
          setIsLoading(false);
        }
      }
      load();
    }, [db])
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, padding: spacing.lg }]}>
      <View style={styles.hero}>
        <Text
          style={{
            fontFamily: typography.families.heading.semibold,
            fontSize: typography.sizes.xl,
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: spacing.xl,
          }}
          accessibilityRole="header"
        >
          {getGreeting()}
        </Text>

        <Pressable
          onPress={() => router.push('/(tabs)/check-in')}
          style={[
            styles.cta,
            {
              borderRadius: radii.md,
              backgroundColor: theme.colors.primary,
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.md,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Check-in starten, 8 Schritte, geführt"
        >
          <Text
            style={{
              fontFamily: typography.families.ui.semibold,
              fontSize: typography.sizes.lg,
              color: theme.colors.textInverse,
            }}
          >
            Check-in starten
          </Text>
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.sm,
              color: theme.colors.textInverse,
              marginTop: 2,
              opacity: 0.8,
            }}
          >
            8 Schritte, geführt
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/quick-check-in')}
          style={[
            styles.cta,
            {
              borderRadius: radii.md,
              borderWidth: 1.5,
              borderColor: theme.colors.primary,
              backgroundColor: theme.colors.surface,
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.md,
              marginTop: spacing.sm,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Schnell-Check-in starten, 3 Schritte, wenn es schnell gehen muss"
        >
          <Text
            style={{
              fontFamily: typography.families.ui.semibold,
              fontSize: typography.sizes.lg,
              color: theme.colors.primary,
            }}
          >
            Schnell-Check-in
          </Text>
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.sm,
              color: theme.colors.textSecondary,
              marginTop: 2,
            }}
          >
            3 Schritte · wenn es schnell gehen muss
          </Text>
        </Pressable>
      </View>

      {!isLoading && !lastCheckIn && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: radii.md,
              padding: spacing.md,
            },
          ]}
        >
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.md,
              color: theme.colors.textSecondary,
              textAlign: 'center',
            }}
          >
            Wann immer du bereit bist — ein paar Minuten reichen für deinen ersten Check-in.
          </Text>
        </View>
      )}

      {!isLoading && lastCheckIn && (
        <Pressable
          onPress={() => router.push(`/history/${lastCheckIn.id}`)}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: radii.md,
              padding: spacing.md,
              minHeight: touchTarget.min,
              justifyContent: 'center',
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Letzter Check-in vom ${formatDate(lastCheckIn.createdAt)}, ansehen`}
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
            {formatDate(lastCheckIn.createdAt)}, {formatTime(lastCheckIn.createdAt)}
          </Text>
        </Pressable>
      )}

      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.xs,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginTop: spacing.xl,
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
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  cta: {
    alignItems: 'center',
  },
  card: {},
});
