import { Alert, Pressable, View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { deleteAllCheckIns } from '../../lib/database/checkins';
import { deleteUserChips, deleteUserChipByLabel, getUserChips } from '../../lib/database/userChips';
import { MAX_USER_CHIPS_PER_CATEGORY } from '../../lib/constants/userChips';
import { updateSettings } from '../../lib/database/settings';
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
  chipCountFeelings?: number;
  chipCountSelfCare?: number;
  exportDirectoryUri: string | null;
  onDeleteComplete: () => void;
  onChipsDeleteComplete: () => void;
  onExportDirectoryChanged: (uri: string | null) => void;
}

export function DataSection({
  db,
  checkInCount,
  chipCount,
  chipCountFeelings,
  chipCountSelfCare,
  exportDirectoryUri,
  onDeleteComplete,
  onChipsDeleteComplete,
  onExportDirectoryChanged,
}: DataSectionProps) {
  const { theme, spacing, radii, touchTarget, shadows } = useTheme();
  const [showStep1, setShowStep1] = useState(false);
  const [showStep2, setShowStep2] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [showChipsConfirm, setShowChipsConfirm] = useState(false);
  const [showChipsDone, setShowChipsDone] = useState(false);
  const [chipsExpanded, setChipsExpanded] = useState(false);
  const [chipList, setChipList] = useState<ChipItem[]>([]);
  const [chipToDelete, setChipToDelete] = useState<ChipItem | null>(null);
  const [exportDirExpanded, setExportDirExpanded] = useState(false);
  const [showResetDirConfirm, setShowResetDirConfirm] = useState(false);

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
    } catch (error) {
      console.error('loadChipList failed:', error);
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
    } catch (error) {
      console.error('deleteUserChips failed:', error);
      Alert.alert(
        'Hat nicht geklappt',
        'Eigene Chips konnten nicht gelöscht werden. Versuch es nochmal.'
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
    } catch (error) {
      console.error('deleteUserChipByLabel failed:', error);
      Alert.alert('Hat nicht geklappt', 'Chip konnte nicht gelöscht werden. Versuch es nochmal.');
    }
  }

  async function handleConfirmDeleteAll() {
    setShowStep2(false);
    try {
      await deleteAllCheckIns(db);
      onDeleteComplete();
      setShowDone(true);
    } catch (error) {
      console.error('deleteAllCheckIns failed:', error);
      Alert.alert('Hat nicht geklappt', 'Daten konnten nicht gelöscht werden. Versuch es nochmal.');
    }
  }

  async function handleChangeExportDir() {
    try {
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) return;
      await updateSettings(db, { exportDirectoryUri: permissions.directoryUri });
      onExportDirectoryChanged(permissions.directoryUri);
      setExportDirExpanded(false);
    } catch (error) {
      console.error('changeExportDirectory failed:', error);
      Alert.alert(
        'Hat nicht geklappt',
        'Speicherort konnte nicht geändert werden. Versuch es nochmal.'
      );
    }
  }

  async function handleResetExportDir() {
    try {
      await updateSettings(db, { exportDirectoryUri: null });
      onExportDirectoryChanged(null);
      setExportDirExpanded(false);
    } catch (error) {
      console.error('resetExportDirectory failed:', error);
      Alert.alert(
        'Hat nicht geklappt',
        'Speicherort konnte nicht zurückgesetzt werden. Versuch es nochmal.'
      );
    }
  }

  const feelingsChips = chipList.filter((c) => c.category === 'feelings');
  const selfCareChips = chipList.filter((c) => c.category === 'self_care');

  return (
    <>
      {Platform.OS === 'android' && (
        <View
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginBottom: spacing.sm,
            overflow: 'hidden',
            ...shadows.sm,
          }}
        >
          <Pressable
            onPress={() => setExportDirExpanded((o) => !o)}
            style={({ pressed }) => [
              {
                padding: spacing.md,
                minHeight: touchTarget.min,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="PDF-Speicherort"
            accessibilityHint={exportDirExpanded ? 'Zuklappen' : 'Aufklappen'}
            accessibilityState={{ expanded: exportDirExpanded }}
          >
            <AppText variant="label">PDF-Speicherort</AppText>
            <Ionicons
              name={exportDirExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.colors.textSecondary}
              accessibilityElementsHidden
            />
          </Pressable>

          {exportDirExpanded && (
            <View style={{ paddingHorizontal: spacing.sm, paddingBottom: spacing.sm }}>
              <Pressable
                onPress={handleChangeExportDir}
                style={({ pressed }) => [
                  styles.button,
                  {
                    backgroundColor: theme.colors.background,
                    borderRadius: radii.sm,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    padding: spacing.sm,
                    minHeight: touchTarget.min,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Neuen Speicherort wählen"
                accessibilityHint="Öffnet die Ordnerauswahl für den PDF-Export"
              >
                <AppText variant="label" size="sm">
                  Neuen Speicherort wählen
                </AppText>
                <AppText
                  variant="body"
                  size="xs"
                  color="secondary"
                  numberOfLines={1}
                  style={{ marginTop: 2 }}
                  accessibilityLabel={
                    exportDirectoryUri
                      ? `Aktueller Speicherort: ${decodeURIComponent(exportDirectoryUri.split('%3A').pop() ?? '').replace(/\//g, ', ')}`
                      : 'Noch nicht festgelegt'
                  }
                >
                  {exportDirectoryUri
                    ? decodeURIComponent(exportDirectoryUri.split('%3A').pop() ?? '').replace(
                        /\//g,
                        ' › '
                      ) || 'Ordner gewählt'
                    : 'Noch nicht festgelegt'}
                </AppText>
              </Pressable>

              {exportDirectoryUri && (
                <Pressable
                  onPress={() => setShowResetDirConfirm(true)}
                  style={({ pressed }) => [
                    styles.button,
                    {
                      backgroundColor: theme.colors.background,
                      borderRadius: radii.sm,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      padding: spacing.sm,
                      marginTop: spacing.xs,
                      minHeight: touchTarget.min,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Speicherort zurücksetzen"
                >
                  <AppText variant="label" size="sm" color="secondary">
                    Speicherort zurücksetzen
                  </AppText>
                  <AppText variant="body" size="xs" color="secondary" style={{ marginTop: 2 }}>
                    Wird beim nächsten Speichern im Verlauf neu festgelegt
                  </AppText>
                </Pressable>
              )}
            </View>
          )}
        </View>
      )}

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
        <AppText variant="label">Alle Check-ins löschen</AppText>
      </Pressable>

      <View
        style={{
          backgroundColor: theme.colors.card,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          marginTop: spacing.sm,
          overflow: 'hidden',
          opacity: chipCount === 0 ? 0.4 : 1,
          ...shadows.sm,
        }}
      >
        <Pressable
          onPress={() => {
            if (chipCount > 0) setChipsExpanded((o) => !o);
          }}
          disabled={chipCount === 0}
          style={({ pressed }) => [
            {
              padding: spacing.md,
              minHeight: touchTarget.min,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              opacity: pressed ? 0.75 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Eigene Chips verwalten${chipCount > 0 ? ` (${chipCount} gesamt)` : ''}`}
          accessibilityHint={
            chipsExpanded ? 'Chip-Liste einklappen' : 'Chip-Liste aufklappen zum einzelnen Löschen'
          }
          accessibilityState={{ disabled: chipCount === 0, expanded: chipsExpanded }}
        >
          <AppText variant="label">
            {chipCount > 0 && chipCountFeelings != null && chipCountSelfCare != null
              ? `Eigene Chips (${chipCountFeelings}/${MAX_USER_CHIPS_PER_CATEGORY} · ${chipCountSelfCare}/${MAX_USER_CHIPS_PER_CATEGORY})`
              : chipCount > 0
                ? `Eigene Chips (${chipCount})`
                : 'Eigene Chips'}
          </AppText>
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
          <View style={{ paddingHorizontal: spacing.sm, paddingBottom: spacing.sm }}>
            {feelingsChips.length > 0 && (
              <>
                <AppText
                  variant="label"
                  size="sm"
                  color="secondary"
                  accessibilityRole="header"
                  style={{ marginBottom: spacing.xs }}
                >
                  Gefühle
                </AppText>
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
                      <AppText variant="body" size="sm" style={{ flex: 1 }} numberOfLines={1}>
                        {chip.label}
                      </AppText>
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
                <AppText
                  variant="label"
                  size="sm"
                  color="secondary"
                  accessibilityRole="header"
                  style={{
                    marginTop: feelingsChips.length > 0 ? spacing.sm : 0,
                    marginBottom: spacing.xs,
                  }}
                >
                  Selbstfürsorge
                </AppText>
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
                      <AppText variant="body" size="sm" style={{ flex: 1 }} numberOfLines={1}>
                        {chip.label}
                      </AppText>
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
                  minHeight: touchTarget.min,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Alle eigenen Chips löschen"
              accessibilityHint="Löscht alle selbst erstellten Begriffe dauerhaft"
            >
              <AppText variant="label" size="sm" color="secondary" style={{ textAlign: 'center' }}>
                Alle löschen
              </AppText>
            </Pressable>
          </View>
        )}
      </View>

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

      <ConfirmDialog
        visible={showResetDirConfirm}
        title="Speicherort zurücksetzen"
        message="Der gespeicherte Ordner wird vergessen. Beim nächsten Speichern im Verlauf wirst du erneut nach einem Ordner gefragt."
        confirmLabel="Zurücksetzen"
        cancelLabel="Abbrechen"
        onConfirm={() => {
          setShowResetDirConfirm(false);
          handleResetExportDir();
        }}
        onCancel={() => setShowResetDirConfirm(false)}
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
