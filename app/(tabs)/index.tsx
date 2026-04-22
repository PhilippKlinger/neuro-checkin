import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter, Link } from 'expo-router';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { getCheckIns } from '../../lib/database/checkins';
import { CheckIn, ENERGY_LABELS, FOCUS_LABELS, getLevelLabel } from '../../lib/types/checkin';
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
            fontFamily: typography.families.heading.bold,
            fontSize: typography.sizes.xxl,
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: spacing.sm,
          }}
          accessibilityRole="header"
        >
          {getGreeting()}
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
          Wie geht es dir gerade?
        </Text>

        <Pressable
          onPress={() => router.push('/(tabs)/check-in')}
          style={[
            styles.startButton,
            {
              minHeight: touchTarget.min + 8,
              borderRadius: radii.md,
              backgroundColor: theme.colors.primary,
              paddingHorizontal: spacing.xl,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Check-in starten"
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
        </Pressable>

        <Pressable
          onPress={() => router.push('/quick-check-in')}
          style={[
            styles.startButton,
            {
              minHeight: touchTarget.min,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              paddingHorizontal: spacing.xl,
              marginTop: spacing.sm,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Schnell-Check-in starten — 2 Schritte"
        >
          <Text
            style={{
              fontFamily: typography.families.ui.medium,
              fontSize: typography.sizes.md,
              color: theme.colors.textSecondary,
            }}
          >
            Schnell-Check-in
          </Text>
        </Pressable>
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.xs,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            marginTop: spacing.xs,
          }}
        >
          3 Schritte — wenn wenig Zeit oder Energie bleibt
        </Text>

        <Link
          href="/check-in-info"
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.sm,
            color: theme.colors.textSecondary,
            textDecorationLine: 'underline',
            marginTop: spacing.lg,
          }}
          accessibilityRole="link"
          accessibilityLabel="Was ist ein Check-in? Mehr erfahren"
        >
          Was ist ein Check-in?
        </Link>
      </View>

      {!isLoading && !lastCheckIn && (
        <View
          style={[
            styles.emptyHint,
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
            styles.lastCheckIn,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: radii.md,
              padding: spacing.md,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Letzter Check-in vom ${formatDate(lastCheckIn.createdAt)}`}
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
          <View style={[styles.miniMetrics, { marginTop: spacing.sm, gap: spacing.lg }]}>
            <Text style={{ fontFamily: typography.families.ui.medium, fontSize: typography.sizes.sm, color: theme.colors.primary }}>
              Energie {getLevelLabel(lastCheckIn.energyLevel, ENERGY_LABELS)}
            </Text>
            {lastCheckIn.focusLevel > 0 && (
              <Text style={{ fontFamily: typography.families.ui.medium, fontSize: typography.sizes.sm, color: theme.colors.primary }}>
                Fokus {getLevelLabel(lastCheckIn.focusLevel, FOCUS_LABELS)}
              </Text>
            )}
          </View>
        </Pressable>
      )}

      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.xs,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginTop: spacing.xl,
          fontStyle: 'italic',
        }}
      >
        Alle Daten bleiben lokal auf deinem Gerät.{'\n'}
        Kein Therapieersatz — ein Werkzeug für dich.
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
    alignItems: 'center',
  },
  startButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHint: {},
  lastCheckIn: {},
  miniMetrics: {
    flexDirection: 'row',
  },
});
