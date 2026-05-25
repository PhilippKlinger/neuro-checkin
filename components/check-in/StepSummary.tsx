import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { StepScaffold } from './StepScaffold';
import { CheckInDraft } from '../../lib/types/checkin';
import { presentCheckIn } from '../../lib/utils/presentCheckIn';

interface StepSummaryProps {
  draft: CheckInDraft;
  showPostFirstCheckinHint?: boolean;
}

export function StepSummary({ draft, showPostFirstCheckinHint }: StepSummaryProps) {
  const { theme, spacing, typography, radii } = useTheme();
  const p = presentCheckIn(draft);
  const activeSignals = p.bodySignals.filter((s) => s.active);

  return (
    <StepScaffold title="Zusammenfassung" subtitle="Dein Check-in auf einen Blick">
      {showPostFirstCheckinHint && (
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.sm,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            marginBottom: spacing.md,
            fontStyle: 'italic',
          }}
        >
          Check-ins lassen sich jederzeit im Verlauf nachlesen — und Muster werden über Zeit
          sichtbar.
        </Text>
      )}

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
          <Text style={rowValue(typography, theme)}>{p.energy ?? 'Nicht angegeben'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={rowLabel(typography, theme)}>Fokus</Text>
          <Text style={rowValue(typography, theme)}>{p.focus ?? 'Nicht angegeben'}</Text>
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
          <Text style={sectionTitle(typography, theme, spacing)}>Körpersignale</Text>
          {activeSignals.map((s) => (
            <View key={s.label} style={[styles.row, { marginBottom: spacing.xs }]}>
              <Text style={rowLabel(typography, theme)}>{s.label}</Text>
              <Text style={rowValue(typography, theme)}>Ja</Text>
            </View>
          ))}
        </View>
      )}

      {p.feelings && (
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
          <Text style={bodyText(typography, theme)}>{p.feelings}</Text>
        </View>
      )}

      {p.distress && (
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
          <Text style={sectionTitle(typography, theme, spacing)}>Stress-Level</Text>
          <Text style={bodyText(typography, theme)}>{p.distress}</Text>
          {draft.distressNote.trim() !== '' && (
            <Text
              style={[bodyText(typography, theme), { marginTop: spacing.xs, fontStyle: 'italic' }]}
            >
              {draft.distressNote}
            </Text>
          )}
        </View>
      )}

      {(p.thoughtsType || p.thoughtsNote) && (
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
          {p.thoughtsType && <Text style={bodyText(typography, theme)}>{p.thoughtsType}</Text>}
          {p.thoughtsNote && (
            <Text
              style={[
                bodyText(typography, theme),
                { marginTop: p.thoughtsType ? spacing.xs : 0, fontStyle: 'italic' },
              ]}
            >
              {p.thoughtsNote}
            </Text>
          )}
        </View>
      )}

      {p.selfCare && (
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
          <Text style={sectionTitle(typography, theme, spacing)}>Selbstfürsorge</Text>
          <Text style={bodyText(typography, theme)}>{p.selfCare}</Text>
        </View>
      )}
    </StepScaffold>
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
  card: {},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
