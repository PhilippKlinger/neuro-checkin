import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { CheckInDraft, ENERGY_LABELS, FOCUS_LABELS, getLevelLabel } from '../../lib/types/checkin';

interface StepSummaryProps {
  draft: CheckInDraft;
}

function getThoughtsLabel(
  type: 'supportive' | 'burdening' | 'mixed' | null
): string {
  switch (type) {
    case 'supportive':
      return 'Unterstützend';
    case 'burdening':
      return 'Belastend';
    case 'mixed':
      return 'Gemischt';
    default:
      return '—';
  }
}

function getSignalLabel(val: boolean | null): string {
  if (val === true) return 'Ja';
  if (val === false) return 'Nein';
  return '—';
}

export function StepSummary({ draft }: StepSummaryProps) {
  const { theme, spacing, typography, radii } = useTheme();

  const bodySignalEntries = [
    { label: 'Hunger', value: draft.bodySignals.hunger },
    { label: 'Durst', value: draft.bodySignals.thirst },
    { label: 'Temperatur', value: draft.bodySignals.temperature },
    { label: 'Schmerzen', value: draft.bodySignals.pain },
    { label: 'Toilette', value: draft.bodySignals.restroom },
    { label: 'Sitzposition', value: draft.bodySignals.seating },
    { label: 'Reize', value: draft.bodySignals.externalStimuli },
  ];

  const activeSignals = bodySignalEntries.filter((s) => s.value === true);

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
        Zusammenfassung
      </Text>
      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.md,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginBottom: spacing.xs,
        }}
      >
        Dein Check-in auf einen Blick
      </Text>
      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.sm,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginBottom: spacing.lg,
          fontStyle: 'italic',
        }}
      >
        Alles davon ist okay.
      </Text>

      <ScrollView style={styles.scrollArea}>
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
            <Text style={rowLabel(typography, theme)}>Energie</Text>
            <Text style={rowValue(typography, theme)}>
              {getLevelLabel(draft.energyLevel, ENERGY_LABELS)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={rowLabel(typography, theme)}>Fokus</Text>
            <Text style={rowValue(typography, theme)}>
              {getLevelLabel(draft.focusLevel, FOCUS_LABELS)}
            </Text>
          </View>
        </View>

        {activeSignals.length > 0 && (
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
            {activeSignals.map((s) => (
              <View
                key={s.label}
                style={[styles.row, { marginBottom: spacing.xs }]}
              >
                <Text style={rowLabel(typography, theme)}>{s.label}</Text>
                <Text style={rowValue(typography, theme)}>
                  {getSignalLabel(s.value)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {draft.feelings.trim() !== '' && (
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
              Gefühle
            </Text>
            <Text style={bodyText(typography, theme)}>{draft.feelings}</Text>
          </View>
        )}

        {(draft.thoughtsType !== null || draft.thoughtsNote.trim() !== '') && (
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
              Gedanken
            </Text>
            {draft.thoughtsType !== null && (
              <Text style={bodyText(typography, theme)}>
                {getThoughtsLabel(draft.thoughtsType)}
              </Text>
            )}
            {draft.thoughtsNote.trim() !== '' && (
              <Text
                style={[
                  bodyText(typography, theme),
                  { marginTop: draft.thoughtsType !== null ? spacing.xs : 0, fontStyle: 'italic' },
                ]}
              >
                {draft.thoughtsNote}
              </Text>
            )}
          </View>
        )}

        {draft.selfCareNote.trim() !== '' && (
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
            <Text style={bodyText(typography, theme)}>
              {draft.selfCareNote}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function rowLabel(
  typography: ReturnType<typeof useTheme>['typography'],
  theme: ReturnType<typeof useTheme>['theme']
) {
  return {
    fontFamily: typography.families.body.regular,
    fontSize: typography.sizes.md,
    color: theme.colors.textSecondary,
  };
}

function rowValue(
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
    color: theme.colors.accent,
    marginBottom: spacing.sm,
  };
}

function bodyText(
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
  scrollArea: {
    flex: 1,
  },
  card: {},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
