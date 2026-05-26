import { useMemo } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/hooks/useTheme';
import { CheckIn } from '../../lib/types/checkin';
import { presentCheckIn } from '../../lib/utils/presentCheckIn';
import { formatDateTime } from '../../lib/utils/format';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { AppText } from '../ui/AppText';

interface CheckInDetailContentProps {
  checkIn: CheckIn;
  showDeleteDialog: boolean;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onExport?: () => void;
  onSaveToDevice?: () => void;
}

export function CheckInDetailContent({
  checkIn,
  showDeleteDialog,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onExport,
  onSaveToDevice,
}: CheckInDetailContentProps) {
  const { theme, spacing, radii, touchTarget } = useTheme();
  const insets = useSafeAreaInsets();

  const p = useMemo(() => presentCheckIn(checkIn), [checkIn]);
  const activeSignals = p.bodySignals.filter((s) => s.active).map((s) => s.label);
  const inactiveSignals = p.bodySignals.filter((s) => !s.active).map((s) => s.label);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl + insets.bottom }}
      >
        <AppText variant="title" size="xl" style={{ marginBottom: spacing.xs }}>
          Check-in
        </AppText>
        <AppText variant="body" size="sm" color="secondary" style={{ marginBottom: spacing.xl }}>
          {formatDateTime(checkIn.createdAt)}
        </AppText>

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
            <AppText variant="label" size="sm" color="accent" style={{ marginBottom: spacing.sm }}>
              Körpersignale
            </AppText>
            {activeSignals.length > 0 && (
              <AppText variant="body" style={{ marginBottom: spacing.xs }}>
                Ja: {activeSignals.join(', ')}
              </AppText>
            )}
            {inactiveSignals.length > 0 && (
              <AppText variant="body">Nein: {inactiveSignals.join(', ')}</AppText>
            )}
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
            <AppText variant="label" size="sm" color="accent" style={{ marginBottom: spacing.sm }}>
              Gefühle
            </AppText>
            <AppText variant="body">{p.feelings}</AppText>
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
            <AppText variant="label" size="sm" color="accent" style={{ marginBottom: spacing.sm }}>
              Stress-Level
            </AppText>
            <AppText variant="body">{p.distress}</AppText>
            {checkIn.distressNote && checkIn.distressNote.trim() !== '' && (
              <AppText variant="body" style={{ marginTop: spacing.xs, fontStyle: 'italic' }}>
                {checkIn.distressNote}
              </AppText>
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
            <AppText variant="label" size="sm" color="accent" style={{ marginBottom: spacing.sm }}>
              Gedanken
            </AppText>
            {p.thoughtsType && <AppText variant="body">{p.thoughtsType}</AppText>}
            {p.thoughtsNote && (
              <AppText
                variant="body"
                style={{ marginTop: p.thoughtsType ? spacing.xs : 0, fontStyle: 'italic' }}
              >
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
                backgroundColor: theme.colors.surface,
                borderRadius: radii.md,
                padding: spacing.md,
                marginBottom: spacing.md,
              },
            ]}
          >
            <AppText variant="label" size="sm" color="accent" style={{ marginBottom: spacing.sm }}>
              Selbstfürsorge
            </AppText>
            <AppText variant="body">{p.selfCare}</AppText>
          </View>
        )}

        <Pressable
          onPress={onDeleteRequest}
          style={({ pressed }) => [
            styles.actionButton,
            {
              marginTop: spacing.xl,
              paddingVertical: spacing.md,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: theme.colors.textSecondary,
            },
            pressed && { opacity: 0.75 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Check-in löschen"
        >
          <AppText variant="label" color="secondary" style={{ textAlign: 'center' }}>
            Check-in löschen
          </AppText>
        </Pressable>

        {onExport && (
          <>
            <Pressable
              onPress={onExport}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  marginTop: spacing.md,
                  paddingVertical: spacing.md,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  minHeight: touchTarget.min,
                },
                pressed && { opacity: 0.75 },
              ]}
              testID="detail-export-button"
              accessibilityRole="button"
              accessibilityLabel="Check-in als PDF teilen"
              accessibilityHint="Erstellt eine PDF-Datei und öffnet das Teilen-Menü"
            >
              <AppText variant="label" size="sm" color="secondary" style={{ textAlign: 'center' }}>
                Als PDF teilen
              </AppText>
            </Pressable>

            {onSaveToDevice && (
              <Pressable
                onPress={onSaveToDevice}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    marginTop: spacing.sm,
                    paddingVertical: spacing.md,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    minHeight: touchTarget.min,
                  },
                  pressed && { opacity: 0.75 },
                ]}
                testID="detail-save-button"
                accessibilityRole="button"
                accessibilityLabel="Check-in als PDF auf Gerät speichern"
                accessibilityHint="Öffnet Dateiauswahl zum Speichern der PDF"
              >
                <AppText variant="label" size="sm" color="secondary" style={{ textAlign: 'center' }}>
                  Auf Gerät speichern
                </AppText>
              </Pressable>
            )}
          </>
        )}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  card: {},
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionButton: { alignItems: 'center' },
});
