import { Alert, Text, Pressable, View, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/hooks/useTheme';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { deleteAllCheckIns } from '../../lib/database/checkins';
import { deleteUserChips, deleteUserChipByLabel, getUserChips } from '../../lib/database/userChips';
import { SQLiteDatabase } from 'expo-sqlite';
import { useState, useCallback, useEffect } from 'react';

interface ChipItem {
  category: 'feelings' | 'self_care';
  label: string;
}

interface DataSectionProps {
  db: SQLiteDatabase;
  checkInCount: number;
  chipCount: number;
  onDeleteComplete: () => void;
  onChipsDeleteComplete: () => void;
}

export function DataSection({
  db,
  checkInCount,
  chipCount,
  onDeleteComplete,
  onChipsDeleteComplete,
}: DataSectionProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
  const [showStep1, setShowStep1] = useState(false);
  const [showStep2, setShowStep2] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [showChipsConfirm, setShowChipsConfirm] = useState(false);
  const [showChipsDone, setShowChipsDone] = useState(false);
  const [chipsExpanded, setChipsExpanded] = useState(false);
  const [chipList, setChipList] = useState<ChipItem[]>([]);
  const [chipToDelete, setChipToDelete] = useState<ChipItem | null>(null);

  const loadChipList = useCallback(async () => {
    try {
      const [feelings, selfCare] = await Promise.all([
        getUserChips(db, 'feelings'),
        getUserChips(db, 'self_care'),
      ]);
      const items: ChipItem[] = [
        ...feelings.map((label) => ({ category: 'feelings' as const, label })),
        ...selfCare.map((label) => ({ category: 'self_care' as const, label })),
      ];
      setChipList(items);
    } catch {
      setChipList([]);
    }
  }, [db]);

  useEffect(() => {
    if (chipsExpanded && chipCount > 0) {
      loadChipList();
    }
  }, [chipsExpanded, chipCount, loadChipList]);

  async function handleConfirmDeleteChips() {
    setShowChipsConfirm(false);
    try {
      await deleteUserChips(db);
      onChipsDeleteComplete();
      setChipList([]);
      setChipsExpanded(false);
      setShowChipsDone(true);
    } catch {
      Alert.alert(
        'Fehler',
        'Eigene Chips konnten nicht gelöscht werden. Bitte versuche es erneut.'
      );
    }
  }

  async function handleDeleteSingleChip() {
    if (!chipToDelete) return;
    const { category, label } = chipToDelete;
    setChipToDelete(null);
    try {
      await deleteUserChipByLabel(db, category, label);
      setChipList((prev) => prev.filter((c) => !(c.category === category && c.label === label)));
      onChipsDeleteComplete();
    } catch {
      Alert.alert('Fehler', 'Chip konnte nicht gelöscht werden. Bitte versuche es erneut.');
    }
  }

  async function handleConfirmDeleteAll() {
    setShowStep2(false);
    try {
      await deleteAllCheckIns(db);
      onDeleteComplete();
      setShowDone(true);
    } catch {
      Alert.alert('Fehler', 'Daten konnten nicht gelöscht werden. Bitte versuche es erneut.');
    }
  }

  const feelingsChips = chipList.filter((c) => c.category === 'feelings');
  const selfCareChips = chipList.filter((c) => c.category === 'self_care');

  return (
    <>
      <Pressable
        onPress={() => Linking.openURL('https://neurocheckin.de/datenschutz')}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: radii.md,
            padding: spacing.md,
            minHeight: touchTarget.min,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginBottom: spacing.sm,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
        accessibilityRole="link"
        accessibilityLabel="Datenschutzerklärung öffnen"
        accessibilityHint="Öffnet die Datenschutzerklärung im Browser"
      >
        <Text
          style={{
            fontFamily: typography.families.ui.medium,
            fontSize: typography.sizes.md,
            color: theme.colors.text,
          }}
        >
          Datenschutzerklärung
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setShowStep1(true)}
        disabled={checkInCount === 0}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: radii.md,
            padding: spacing.md,
            minHeight: touchTarget.min,
            borderWidth: 1,
            borderColor: theme.colors.border,
            opacity: checkInCount === 0 ? 0.4 : pressed ? 0.75 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Alle Check-ins löschen"
        accessibilityHint="Löscht alle gespeicherten Check-ins dauerhaft"
        accessibilityState={{ disabled: checkInCount === 0 }}
      >
        <Text
          style={{
            fontFamily: typography.families.ui.medium,
            fontSize: typography.sizes.md,
            color: theme.colors.text,
          }}
        >
          Alle Check-ins löschen
        </Text>
      </Pressable>

      <Pressable
        onPress={() => {
          if (chipCount > 0) setChipsExpanded((o) => !o);
        }}
        disabled={chipCount === 0}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: radii.md,
            padding: spacing.md,
            minHeight: touchTarget.min,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginTop: spacing.sm,
            opacity: chipCount === 0 ? 0.4 : pressed ? 0.75 : 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Eigene Chips verwalten${chipCount > 0 ? ` (${chipCount})` : ''}`}
        accessibilityHint={
          chipsExpanded ? 'Chip-Liste einklappen' : 'Chip-Liste aufklappen zum einzelnen Löschen'
        }
        accessibilityState={{ disabled: chipCount === 0, expanded: chipsExpanded }}
      >
        <Text
          style={{
            fontFamily: typography.families.ui.medium,
            fontSize: typography.sizes.md,
            color: theme.colors.text,
          }}
        >
          Eigene Chips{chipCount > 0 ? ` (${chipCount})` : ''}
        </Text>
        {chipCount > 0 && (
          <Ionicons
            name={chipsExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.colors.textSecondary}
            accessibilityElementsHidden
          />
        )}
      </Pressable>

      {chipsExpanded && chipList.length > 0 && (
        <View
          style={{
            marginTop: spacing.xs,
            backgroundColor: theme.colors.surface,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: spacing.sm,
          }}
        >
          {feelingsChips.length > 0 && (
            <>
              <Text
                style={{
                  fontFamily: typography.families.ui.medium,
                  fontSize: typography.sizes.sm,
                  color: theme.colors.textSecondary,
                  marginBottom: spacing.xs,
                }}
                accessibilityRole="header"
              >
                Gefühle
              </Text>
              <View style={[styles.chipGrid, { gap: spacing.xs }]}>
                {feelingsChips.map((chip) => (
                  <View
                    key={chip.label}
                    style={[
                      styles.chipRow,
                      {
                        backgroundColor: theme.colors.background,
                        borderRadius: radii.sm,
                        borderWidth: 1,
                        borderStyle: 'dashed',
                        borderColor: theme.colors.border,
                        paddingLeft: spacing.sm,
                        paddingVertical: spacing.xs,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontFamily: typography.families.body.regular,
                        fontSize: typography.sizes.sm,
                        color: theme.colors.text,
                        flex: 1,
                      }}
                      numberOfLines={1}
                    >
                      {chip.label}
                    </Text>
                    <Pressable
                      onPress={() => setChipToDelete(chip)}
                      hitSlop={8}
                      style={({ pressed }) => [
                        styles.deleteIcon,
                        { minWidth: touchTarget.min, minHeight: touchTarget.min },
                        pressed && { opacity: 0.5 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${chip.label} löschen`}
                      accessibilityHint="Löscht diesen Chip dauerhaft"
                    >
                      <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </>
          )}

          {selfCareChips.length > 0 && (
            <>
              <Text
                style={{
                  fontFamily: typography.families.ui.medium,
                  fontSize: typography.sizes.sm,
                  color: theme.colors.textSecondary,
                  marginTop: feelingsChips.length > 0 ? spacing.sm : 0,
                  marginBottom: spacing.xs,
                }}
                accessibilityRole="header"
              >
                Selbstfürsorge
              </Text>
              <View style={[styles.chipGrid, { gap: spacing.xs }]}>
                {selfCareChips.map((chip) => (
                  <View
                    key={chip.label}
                    style={[
                      styles.chipRow,
                      {
                        backgroundColor: theme.colors.background,
                        borderRadius: radii.sm,
                        borderWidth: 1,
                        borderStyle: 'dashed',
                        borderColor: theme.colors.border,
                        paddingLeft: spacing.sm,
                        paddingVertical: spacing.xs,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontFamily: typography.families.body.regular,
                        fontSize: typography.sizes.sm,
                        color: theme.colors.text,
                        flex: 1,
                      }}
                      numberOfLines={1}
                    >
                      {chip.label}
                    </Text>
                    <Pressable
                      onPress={() => setChipToDelete(chip)}
                      hitSlop={8}
                      style={({ pressed }) => [
                        styles.deleteIcon,
                        { minWidth: touchTarget.min, minHeight: touchTarget.min },
                        pressed && { opacity: 0.5 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${chip.label} löschen`}
                      accessibilityHint="Löscht diesen Chip dauerhaft"
                    >
                      <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </>
          )}

          <Pressable
            onPress={() => setShowChipsConfirm(true)}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: radii.sm,
                borderWidth: 1,
                borderColor: theme.colors.border,
                padding: spacing.sm,
                marginTop: spacing.sm,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Alle eigenen Chips löschen"
            accessibilityHint="Löscht alle selbst erstellten Begriffe dauerhaft"
          >
            <Text
              style={{
                fontFamily: typography.families.ui.medium,
                fontSize: typography.sizes.sm,
                color: theme.colors.textSecondary,
                textAlign: 'center',
              }}
            >
              Alle löschen
            </Text>
          </Pressable>
        </View>
      )}

      <ConfirmDialog
        visible={showStep1}
        title="Alle Check-ins löschen"
        message={`Möchtest du wirklich ${checkInCount === 1 ? '1 gespeicherten Check-in' : `alle ${checkInCount} gespeicherten Check-ins`} löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        destructive
        onConfirm={() => {
          setShowStep1(false);
          setShowStep2(true);
        }}
        onCancel={() => setShowStep1(false)}
      />

      <ConfirmDialog
        visible={showStep2}
        title="Sicher?"
        message="Alle Check-ins werden unwiderruflich gelöscht."
        confirmLabel="Ja, alles löschen"
        cancelLabel="Abbrechen"
        destructive
        onConfirm={handleConfirmDeleteAll}
        onCancel={() => setShowStep2(false)}
      />

      <ConfirmDialog
        visible={showDone}
        title="Erledigt"
        message="Alle Check-ins wurden gelöscht."
        confirmLabel="OK"
        hideCancel
        onConfirm={() => setShowDone(false)}
        onCancel={() => setShowDone(false)}
      />

      <ConfirmDialog
        visible={showChipsConfirm}
        title="Eigene Chips löschen"
        message={`${chipCount === 1 ? '1 selbst erstellter Begriff wird' : `Alle ${chipCount} selbst erstellten Begriffe werden`} dauerhaft gelöscht.`}
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        destructive
        onConfirm={handleConfirmDeleteChips}
        onCancel={() => setShowChipsConfirm(false)}
      />

      <ConfirmDialog
        visible={showChipsDone}
        title="Erledigt"
        message="Deine eigenen Chips wurden gelöscht."
        confirmLabel="OK"
        hideCancel
        onConfirm={() => setShowChipsDone(false)}
        onCancel={() => setShowChipsDone(false)}
      />

      <ConfirmDialog
        visible={chipToDelete !== null}
        title="Chip löschen"
        message={chipToDelete ? `„${chipToDelete.label}" dauerhaft löschen?` : ''}
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        destructive
        onConfirm={handleDeleteSingleChip}
        onCancel={() => setChipToDelete(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
  },
  chipGrid: {
    flexDirection: 'column',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
