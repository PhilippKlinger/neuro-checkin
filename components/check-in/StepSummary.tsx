import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';
import { StepScaffold } from './StepScaffold';
import { CheckInDraft } from '../../lib/types/checkin';
import { presentCheckIn } from '../../lib/utils/presentCheckIn';

interface StepSummaryProps {
  draft: CheckInDraft;
  showPostFirstCheckinHint?: boolean;
}

export function StepSummary({ draft, showPostFirstCheckinHint }: StepSummaryProps) {
  const { theme, spacing, radii, shadows } = useTheme();
  const p = presentCheckIn(draft);
  const activeSignals = p.bodySignals.filter((s) => s.active);

  return (
    <StepScaffold title="Zusammenfassung" subtitle="Dein Check-in auf einen Blick">
      {showPostFirstCheckinHint && (
        <AppText variant="hint" style={{ textAlign: 'center', marginBottom: spacing.md }}>
          Check-ins lassen sich jederzeit im Verlauf nachlesen — und Muster werden über Zeit
          sichtbar.
        </AppText>
      )}

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderRadius: radii.md,
            padding: spacing.md,
            marginBottom: spacing.md,
            ...shadows.sm,
          },
        ]}
      >
        <View style={[styles.row, { marginBottom: spacing.sm }]}>
          <AppText variant="body" color="secondary">
            Energie
          </AppText>
          <AppText variant="label" weight="semibold">
            {p.energy ?? 'Nicht angegeben'}
          </AppText>
        </View>
        <View style={styles.row}>
          <AppText variant="body" color="secondary">
            Fokus
          </AppText>
          <AppText variant="label" weight="semibold">
            {p.focus ?? 'Nicht angegeben'}
          </AppText>
        </View>
      </View>

      {activeSignals.length > 0 && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderRadius: radii.md,
              padding: spacing.md,
              marginBottom: spacing.md,
              ...shadows.sm,
            },
          ]}
        >
          <AppText variant="label" color="accent" style={{ marginBottom: spacing.sm }}>
            Körpersignale
          </AppText>
          {activeSignals.map((s) => (
            <View key={s.label} style={[styles.row, { marginBottom: spacing.xs }]}>
              <AppText variant="body" color="secondary">
                {s.label}
              </AppText>
              <AppText variant="label" weight="semibold">
                Ja
              </AppText>
            </View>
          ))}
        </View>
      )}

      {p.feelings && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderRadius: radii.md,
              padding: spacing.md,
              marginBottom: spacing.md,
              ...shadows.sm,
            },
          ]}
        >
          <AppText variant="label" color="accent" style={{ marginBottom: spacing.sm }}>
            Gefühle
          </AppText>
          <AppText variant="body">{p.feelings}</AppText>
        </View>
      )}

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderRadius: radii.md,
            padding: spacing.md,
            marginBottom: spacing.md,
            ...shadows.sm,
          },
        ]}
      >
        <AppText variant="label" color="accent" style={{ marginBottom: spacing.sm }}>
          Stress-Level
        </AppText>
        <AppText variant="body">{p.distress ?? 'Nicht angegeben'}</AppText>
        {draft.distressNote.trim() !== '' && (
          <AppText variant="hint" style={{ marginTop: spacing.xs }}>
            {draft.distressNote}
          </AppText>
        )}
      </View>

      {(p.thoughtsType || p.thoughtsNote) && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderRadius: radii.md,
              padding: spacing.md,
              marginBottom: spacing.md,
              ...shadows.sm,
            },
          ]}
        >
          <AppText variant="label" color="accent" style={{ marginBottom: spacing.sm }}>
            Gedanken
          </AppText>
          {p.thoughtsType && <AppText variant="body">{p.thoughtsType}</AppText>}
          {p.thoughtsNote && (
            <AppText variant="hint" style={{ marginTop: p.thoughtsType ? spacing.xs : 0 }}>
              {p.thoughtsNote}
            </AppText>
          )}
        </View>
      )}

      {p.selfCare && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderRadius: radii.md,
              padding: spacing.md,
              marginBottom: spacing.md,
              ...shadows.sm,
            },
          ]}
        >
          <AppText variant="label" color="accent" style={{ marginBottom: spacing.sm }}>
            Selbstfürsorge
          </AppText>
          <AppText variant="body">{p.selfCare}</AppText>
        </View>
      )}
    </StepScaffold>
  );
}

const styles = StyleSheet.create({
  card: {},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
