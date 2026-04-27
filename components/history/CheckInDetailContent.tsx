import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/hooks/useTheme';
import { CheckIn, ENERGY_LABELS, FOCUS_LABELS, getLevelLabel, SIGNAL_LABELS, getThoughtsLabel } from '../../lib/types/checkin';
import { formatDateTime } from '../../lib/utils/format';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface CheckInDetailContentProps {
  checkIn: CheckIn;
  showDeleteDialog: boolean;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

export function CheckInDetailContent({
  checkIn,
  showDeleteDialog,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: CheckInDetailContentProps) {
  const { theme, spacing, typography, radii } = useTheme();
  const insets = useSafeAreaInsets();

  const { activeSignals, inactiveSignals } = useMemo(() => ({
    activeSignals: Object.entries(checkIn.bodySignals)
      .filter(([, v]) => v === true)
      .map(([key]) => SIGNAL_LABELS[key as keyof typeof SIGNAL_LABELS] || key),
    inactiveSignals: Object.entries(checkIn.bodySignals)
      .filter(([, v]) => v === false)
      .map(([key]) => SIGNAL_LABELS[key as keyof typeof SIGNAL_LABELS] || key),
  }), [checkIn.bodySignals]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl + insets.bottom }}
      >
        <Text style={{ fontFamily: typography.families.heading.semibold, fontSize: typography.sizes.xl, color: theme.colors.text, marginBottom: spacing.xs }}>
          Check-in
        </Text>
        <Text style={{ fontFamily: typography.families.body.regular, fontSize: typography.sizes.sm, color: theme.colors.textSecondary, marginBottom: spacing.xl }}>
          {formatDateTime(checkIn.createdAt)}
        </Text>

        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md }]}>
          <View style={[styles.row, { marginBottom: spacing.sm }]}>
            <Text style={label(typography, theme)}>Energie</Text>
            <Text style={value(typography, theme)}>{getLevelLabel(checkIn.energyLevel, ENERGY_LABELS)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={label(typography, theme)}>Fokus</Text>
            <Text style={value(typography, theme)}>{getLevelLabel(checkIn.focusLevel, FOCUS_LABELS)}</Text>
          </View>
        </View>

        {(activeSignals.length > 0 || inactiveSignals.length > 0) && (
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md }]}>
            <Text style={sectionTitle(typography, theme, spacing)}>Körpersignale</Text>
            {activeSignals.length > 0 && (
              <Text style={[body(typography, theme), { marginBottom: spacing.xs }]}>Ja: {activeSignals.join(', ')}</Text>
            )}
            {inactiveSignals.length > 0 && (
              <Text style={body(typography, theme)}>Nein: {inactiveSignals.join(', ')}</Text>
            )}
          </View>
        )}

        {checkIn.feelings.trim() !== '' && (
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md }]}>
            <Text style={sectionTitle(typography, theme, spacing)}>Gefühle</Text>
            <Text style={body(typography, theme)}>{checkIn.feelings}</Text>
          </View>
        )}

        {checkIn.thoughtsType && (
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md }]}>
            <Text style={sectionTitle(typography, theme, spacing)}>Gedanken</Text>
            <Text style={body(typography, theme)}>{getThoughtsLabel(checkIn.thoughtsType)}</Text>
            {checkIn.thoughtsNote && checkIn.thoughtsNote.trim() !== '' && (
              <Text style={[body(typography, theme), { marginTop: spacing.xs, fontStyle: 'italic' }]}>
                {checkIn.thoughtsNote}
              </Text>
            )}
          </View>
        )}

        {checkIn.selfCareNote && checkIn.selfCareNote.trim() !== '' && (
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md }]}>
            <Text style={sectionTitle(typography, theme, spacing)}>Selbstfürsorge</Text>
            <Text style={body(typography, theme)}>{checkIn.selfCareNote}</Text>
          </View>
        )}

        <Pressable
          onPress={onDeleteRequest}
          style={({ pressed }) => [
            styles.deleteButton,
            { marginTop: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: theme.colors.textSecondary },
            pressed && { opacity: 0.75 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Check-in löschen"
        >
          <Text style={{ fontFamily: typography.families.ui.medium, fontSize: typography.sizes.md, color: theme.colors.textSecondary, textAlign: 'center' }}>
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
        onConfirm={onDeleteConfirm}
        onCancel={onDeleteCancel}
      />
    </View>
  );
}

function label(typography: ReturnType<typeof useTheme>['typography'], theme: ReturnType<typeof useTheme>['theme']) {
  return { fontFamily: typography.families.body.regular, fontSize: typography.sizes.md, color: theme.colors.textSecondary };
}
function value(typography: ReturnType<typeof useTheme>['typography'], theme: ReturnType<typeof useTheme>['theme']) {
  return { fontFamily: typography.families.ui.semibold, fontSize: typography.sizes.md, color: theme.colors.text };
}
function sectionTitle(typography: ReturnType<typeof useTheme>['typography'], theme: ReturnType<typeof useTheme>['theme'], spacing: ReturnType<typeof useTheme>['spacing']) {
  return { fontFamily: typography.families.ui.medium, fontSize: typography.sizes.sm, color: theme.colors.accent, marginBottom: spacing.sm };
}
function body(typography: ReturnType<typeof useTheme>['typography'], theme: ReturnType<typeof useTheme>['theme']) {
  return { fontFamily: typography.families.body.regular, fontSize: typography.sizes.md, color: theme.colors.text };
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  card: {},
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deleteButton: { alignItems: 'center' },
});
