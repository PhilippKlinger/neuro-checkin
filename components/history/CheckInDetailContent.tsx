import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/hooks/useTheme';
import { CheckIn } from '../../lib/types/checkin';
import { presentCheckIn } from '../../lib/utils/presentCheckIn';
import { formatDateTime } from '../../lib/utils/format';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface CheckInDetailContentProps {
  checkIn: CheckIn;
  showDeleteDialog: boolean;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onExport?: () => void;
}

export function CheckInDetailContent({
  checkIn,
  showDeleteDialog,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onExport,
}: CheckInDetailContentProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
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
            <Text style={value(typography, theme)}>{p.energy ?? 'Nicht angegeben'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={label(typography, theme)}>Fokus</Text>
            <Text style={value(typography, theme)}>{p.focus ?? 'Nicht angegeben'}</Text>
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
            <Text style={sectionTitle(typography, theme, spacing)}>Körpersignale</Text>
            {activeSignals.length > 0 && (
              <Text style={[body(typography, theme), { marginBottom: spacing.xs }]}>
                Ja: {activeSignals.join(', ')}
              </Text>
            )}
            {inactiveSignals.length > 0 && (
              <Text style={body(typography, theme)}>Nein: {inactiveSignals.join(', ')}</Text>
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
            <Text style={sectionTitle(typography, theme, spacing)}>Gefühle</Text>
            <Text style={body(typography, theme)}>{p.feelings}</Text>
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
            <Text style={body(typography, theme)}>{p.distress}</Text>
            {checkIn.distressNote && checkIn.distressNote.trim() !== '' && (
              <Text
                style={[body(typography, theme), { marginTop: spacing.xs, fontStyle: 'italic' }]}
              >
                {checkIn.distressNote}
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
            {p.thoughtsType && <Text style={body(typography, theme)}>{p.thoughtsType}</Text>}
            {p.thoughtsNote && (
              <Text
                style={[
                  body(typography, theme),
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
            <Text style={body(typography, theme)}>{p.selfCare}</Text>
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

        {onExport && (
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
            accessibilityRole="button"
            accessibilityLabel="Check-in als PDF exportieren"
            accessibilityHint="Erstellt eine PDF-Datei und öffnet das Teilen-Menü"
          >
            <Text
              style={{
                fontFamily: typography.families.ui.medium,
                fontSize: typography.sizes.sm,
                color: theme.colors.textSecondary,
                textAlign: 'center',
              }}
            >
              Als PDF exportieren
            </Text>
          </Pressable>
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
    color: theme.colors.accent,
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
  container: { flex: 1 },
  scroll: { flex: 1 },
  card: {},
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionButton: { alignItems: 'center' },
});
