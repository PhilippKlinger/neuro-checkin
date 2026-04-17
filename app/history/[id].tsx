import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { getCheckInById, deleteCheckIn } from '../../lib/database/checkins';
import { CheckIn, ENERGY_LABELS, FOCUS_LABELS, getLevelLabel } from '../../lib/types/checkin';
import { formatDateTime } from '../../lib/utils/format';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

function getThoughtsLabel(type: string | null): string {
  switch (type) {
    case 'supportive': return 'Unterstützend';
    case 'burdening': return 'Belastend';
    case 'mixed': return 'Gemischt';
    default: return '—';
  }
}

const SIGNAL_LABELS: Record<string, string> = {
  hunger: 'Hunger',
  thirst: 'Durst',
  temperature: 'Temperatur',
  pain: 'Schmerzen',
  restroom: 'Toilette',
  seating: 'Sitzposition',
  externalStimuli: 'Reize',
};

export default function CheckInDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, spacing, typography, radii } = useTheme();
  const db = useDatabase();
  const router = useRouter();
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const data = await getCheckInById(db, Number(id));
        setCheckIn(data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [db, id]);

  function handleDelete() {
    if (!checkIn) return;
    setShowDeleteDialog(true);
  }

  async function confirmDelete() {
    if (!checkIn) return;
    setShowDeleteDialog(false);
    await deleteCheckIn(db, checkIn.id);
    router.back();
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.md,
            color: theme.colors.textSecondary,
          }}
        >
          Laden...
        </Text>
      </View>
    );
  }

  if (!checkIn) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.md,
            color: theme.colors.textSecondary,
          }}
        >
          Check-in nicht gefunden.
        </Text>
      </View>
    );
  }

  const activeSignals = Object.entries(checkIn.bodySignals)
    .filter(([, v]) => v === true)
    .map(([key]) => SIGNAL_LABELS[key] || key);

  const inactiveSignals = Object.entries(checkIn.bodySignals)
    .filter(([, v]) => v === false)
    .map(([key]) => SIGNAL_LABELS[key] || key);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
    >
      <Text
        style={{
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.xl,
          color: theme.colors.text,
          marginBottom: spacing.xs,
        }}
      >
        Check-in
      </Text>
      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.sm,
          color: theme.colors.textSecondary,
          marginBottom: spacing.xl,
        }}
      >
        {formatDateTime(checkIn.createdAt)}
      </Text>

      {/* Energy & Focus */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: radii.md,
            padding: spacing.md,
            marginBottom: spacing.md,
          },
        ]}
      >
        <View style={[styles.row, { marginBottom: spacing.sm }]}>
          <Text style={label(typography, theme)}>Energie</Text>
          <Text style={value(typography, theme)}>
            {getLevelLabel(checkIn.energyLevel, ENERGY_LABELS)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={label(typography, theme)}>Fokus</Text>
          <Text style={value(typography, theme)}>
            {getLevelLabel(checkIn.focusLevel, FOCUS_LABELS)}
          </Text>
        </View>
      </View>

      {/* Body Signals */}
      {(activeSignals.length > 0 || inactiveSignals.length > 0) && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: radii.md,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Text style={sectionTitle(typography, theme, spacing)}>
            Körpersignale
          </Text>
          {activeSignals.length > 0 && (
            <Text style={[body(typography, theme), { marginBottom: spacing.xs }]}>
              Ja: {activeSignals.join(', ')}
            </Text>
          )}
          {inactiveSignals.length > 0 && (
            <Text style={body(typography, theme)}>
              Nein: {inactiveSignals.join(', ')}
            </Text>
          )}
        </View>
      )}

      {/* Feelings — rendered as pills matching the chip selection UI */}
      {checkIn.feelings.trim() !== '' && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: radii.md,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Text style={sectionTitle(typography, theme, spacing)}>Gefühle</Text>
          <View style={styles.feelingPills}>
            {checkIn.feelings
              .split(',')
              .map((f) => f.trim())
              .filter(Boolean)
              .map((feeling) => (
                <View
                  key={feeling}
                  style={[
                    styles.feelingPill,
                    {
                      backgroundColor: theme.colors.primarySoft,
                      borderRadius: radii.full,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontFamily: typography.families.ui.medium,
                      fontSize: typography.sizes.sm,
                      color: theme.colors.primary,
                    }}
                  >
                    {feeling}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      )}

      {/* Thoughts */}
      {checkIn.thoughtsType && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: radii.md,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Text style={sectionTitle(typography, theme, spacing)}>Gedanken</Text>
          <Text style={body(typography, theme)}>
            {getThoughtsLabel(checkIn.thoughtsType)}
          </Text>
          {checkIn.thoughtsNote && checkIn.thoughtsNote.trim() !== '' && (
            <Text
              style={[
                body(typography, theme),
                { marginTop: spacing.xs, fontStyle: 'italic' },
              ]}
            >
              {checkIn.thoughtsNote}
            </Text>
          )}
        </View>
      )}

      {/* Self-care */}
      {checkIn.selfCareNote && checkIn.selfCareNote.trim() !== '' && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: radii.md,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Text style={sectionTitle(typography, theme, spacing)}>
            Selbstfürsorge
          </Text>
          <Text style={body(typography, theme)}>{checkIn.selfCareNote}</Text>
        </View>
      )}

      {/* Delete */}
      <Pressable
        onPress={handleDelete}
        style={[
          styles.deleteButton,
          {
            marginTop: spacing.xl,
            paddingVertical: spacing.md,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: theme.colors.textSecondary,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Check-in löschen"
      >
        <Text
          style={{
            fontFamily: typography.families.ui.medium,
            fontSize: typography.sizes.md,
            color: theme.colors.textSecondary,
            textAlign: 'center',
          }}
        >
          Check-in löschen
        </Text>
      </Pressable>
    </ScrollView>

    <ConfirmDialog
      visible={showDeleteDialog}
      title="Check-in löschen?"
      message="Dieser Check-in wird unwiderruflich gelöscht."
      confirmLabel="Löschen"
      cancelLabel="Abbrechen"
      destructive
      onConfirm={confirmDelete}
      onCancel={() => setShowDeleteDialog(false)}
    />
    </View>
  );
}

function label(
  typography: ReturnType<typeof useTheme>['typography'],
  theme: ReturnType<typeof useTheme>['theme']
) {
  return {
    fontFamily: typography.families.body.regular,
    fontSize: typography.sizes.md,
    color: theme.colors.textSecondary,
  };
}

function value(
  typography: ReturnType<typeof useTheme>['typography'],
  theme: ReturnType<typeof useTheme>['theme']
) {
  return {
    fontFamily: typography.families.ui.semibold,
    fontSize: typography.sizes.md,
    color: theme.colors.text,
  };
}

function sectionTitle(
  typography: ReturnType<typeof useTheme>['typography'],
  theme: ReturnType<typeof useTheme>['theme'],
  spacing: ReturnType<typeof useTheme>['spacing']
) {
  return {
    fontFamily: typography.families.ui.medium,
    fontSize: typography.sizes.sm,
    color: theme.colors.primary,
    marginBottom: spacing.sm,
  };
}

function body(
  typography: ReturnType<typeof useTheme>['typography'],
  theme: ReturnType<typeof useTheme>['theme']
) {
  return {
    fontFamily: typography.families.body.regular,
    fontSize: typography.sizes.md,
    color: theme.colors.text,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    alignItems: 'center',
  },
  feelingPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  feelingPill: {},
});
