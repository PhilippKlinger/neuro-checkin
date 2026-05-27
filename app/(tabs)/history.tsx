import { useState, useCallback } from 'react';
import { View, FlatList, Pressable, StyleSheet, Alert, ListRenderItem } from 'react-native';
import { AppText } from '../../components/ui/AppText';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { getCheckIns } from '../../lib/database/checkins';
import { getSettings, updateSettings } from '../../lib/database/settings';
import { CheckIn } from '../../lib/types/checkin';
import { CheckInCard } from '../../components/history/CheckInCard';
import { exportCheckInsAsPdf, saveCheckInsPdfToDevice, MAX_EXPORT_COUNT } from '../../lib/utils/pdfExport';
import { showToast } from '../../components/ui/Toast';
import * as Sentry from '@sentry/react-native';

export default function HistoryScreen() {
  const { theme, spacing, radii, touchTarget } = useTheme();
  const db = useDatabase();
  const router = useRouter();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        setIsLoading(true);
        try {
          const data = await getCheckIns(db, 10000);
          setCheckIns(data);
        } catch (error) {
          console.error('getCheckIns failed:', error);
          setCheckIns([]);
        } finally {
          setIsLoading(false);
        }
      }
      load();
    }, [db])
  );

  function enterSelectionMode() {
    setSelectionMode(true);
    setSelectedIds(new Set());
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  const toggleSelection = useCallback(
    (id: number) => {
      if (isExporting) return;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [isExporting]
  );

  function selectAll() {
    if (isExporting) return;
    setSelectedIds(new Set(checkIns.map((c) => c.id)));
  }

  async function handleExportSelected() {
    if (selectedIds.size === 0 || isExporting) return;
    if (selectedIds.size > MAX_EXPORT_COUNT) {
      Alert.alert(
        'Zu viele ausgewählt',
        `Maximal ${MAX_EXPORT_COUNT} Check-ins pro Export. Bitte wähle weniger aus.`
      );
      return;
    }
    const toExport = checkIns.filter((c) => selectedIds.has(c.id));
    setIsExporting(true);
    try {
      await exportCheckInsAsPdf(toExport);
      showToast('PDF erstellt');
    } catch (error) {
      Sentry.withScope((scope) => {
        scope.setTag('screen', 'history');
        scope.setTag('action', 'pdfExport');
        Sentry.captureException(error);
      });
      Alert.alert(
        'Export fehlgeschlagen',
        'PDF konnte nicht erstellt werden. Bitte versuche es erneut.'
      );
    } finally {
      setIsExporting(false);
      exitSelectionMode();
    }
  }

  async function handleSaveToDevice() {
    if (selectedIds.size === 0 || isExporting) return;
    if (selectedIds.size > MAX_EXPORT_COUNT) {
      Alert.alert(
        'Zu viele ausgewählt',
        `Maximal ${MAX_EXPORT_COUNT} Check-ins pro Export. Bitte wähle weniger aus.`
      );
      return;
    }
    const toExport = checkIns.filter((c) => selectedIds.has(c.id));
    setIsExporting(true);
    try {
      const settings = await getSettings(db);
      await saveCheckInsPdfToDevice(toExport, {
        savedDirectoryUri: settings.exportDirectoryUri,
        onDirectoryChosen: (uri) => updateSettings(db, { exportDirectoryUri: uri }),
      });
      showToast('PDF gespeichert');
    } catch (error) {
      if (error instanceof Error && error.message === 'Permission denied') {
        return;
      }
      Sentry.withScope((scope) => {
        scope.setTag('screen', 'history');
        scope.setTag('action', 'pdfSaveToDevice');
        Sentry.captureException(error);
      });
      Alert.alert(
        'Speichern fehlgeschlagen',
        'PDF konnte nicht gespeichert werden. Bitte versuche es erneut.'
      );
    } finally {
      setIsExporting(false);
      exitSelectionMode();
    }
  }

  const handlePress = useCallback(
    (id: number) => {
      router.push(`/history/${id}`);
    },
    // router is a stable ref from expo-router
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const renderItem = useCallback<ListRenderItem<CheckIn>>(
    ({ item }) => (
      <CheckInCard
        checkIn={item}
        onPress={handlePress}
        selectable={selectionMode}
        selected={selectedIds.has(item.id)}
        onToggle={toggleSelection}
      />
    ),
    [handlePress, selectionMode, selectedIds, toggleSelection]
  );

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <AppText variant="body" color="secondary">
          Laden...
        </AppText>
      </View>
    );
  }

  if (checkIns.length === 0) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background, padding: spacing.lg }]}
      >
        <AppText
          variant="title"
          size="xl"
          style={{ textAlign: 'center', marginBottom: spacing.md }}
        >
          Noch keine Check-ins
        </AppText>
        <AppText variant="body" color="secondary" style={{ textAlign: 'center' }}>
          Deine Check-ins erscheinen hier, sobald du deinen ersten abgeschlossen hast.
        </AppText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Selection mode header */}
      {selectionMode ? (
        <View
          style={[
            styles.selectionHeader,
            {
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: theme.colors.surface,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <Pressable
            onPress={selectAll}
            style={({ pressed }) => [
              { minHeight: touchTarget.min, justifyContent: 'center' as const },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Alle auswählen"
          >
            <AppText variant="label" size="sm" color="accent">
              Alle auswählen
            </AppText>
          </Pressable>

          <AppText variant="body" size="sm" color="secondary">
            {selectedIds.size === 0 ? 'Nichts ausgewählt' : `${selectedIds.size} ausgewählt`}
          </AppText>

          <Pressable
            onPress={exitSelectionMode}
            style={({ pressed }) => [
              { minHeight: touchTarget.min, justifyContent: 'center' as const },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Auswahl abbrechen"
          >
            <AppText variant="label" size="sm" color="secondary">
              Abbrechen
            </AppText>
          </Pressable>
        </View>
      ) : (
        <View
          style={{
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          }}
        >
          <Pressable
            onPress={enterSelectionMode}
            style={({ pressed }) => [
              styles.exportButton,
              {
                minHeight: touchTarget.min,
                borderRadius: radii.md,
                backgroundColor: theme.colors.primary,
              },
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Check-ins zum Teilen auswählen"
          >
            <AppText variant="label" weight="semibold" color="inverse">
              Auswählen & Teilen
            </AppText>
          </Pressable>
        </View>
      )}

      <FlatList
        data={checkIns}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.md }}
        extraData={selectionMode ? selectedIds : undefined}
      />

      {/* Export confirm bar */}
      {selectionMode && selectedIds.size > 0 && (
        <View
          style={[
            styles.exportBar,
            {
              padding: spacing.md,
              paddingBottom: spacing.lg,
              backgroundColor: theme.colors.surface,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
              gap: spacing.sm,
            },
          ]}
        >
          {selectedIds.size > 100 && (
            <AppText variant="body" size="xs" color="secondary" style={{ textAlign: 'center' }}>
              {selectedIds.size} Check-ins — das kann einen Moment dauern.
            </AppText>
          )}
          <Pressable
            onPress={handleExportSelected}
            disabled={isExporting}
            style={({ pressed }) => [
              styles.exportButton,
              {
                minHeight: touchTarget.min,
                borderRadius: radii.md,
                backgroundColor: isExporting ? theme.colors.border : theme.colors.primary,
              },
              pressed && !isExporting && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${selectedIds.size} Check-ins als PDF teilen`}
            accessibilityState={{ disabled: isExporting }}
          >
            <AppText variant="label" weight="semibold" color="inverse">
              {isExporting ? 'Erstelle PDF...' : `${selectedIds.size} als PDF teilen`}
            </AppText>
          </Pressable>
          <Pressable
            onPress={handleSaveToDevice}
            disabled={isExporting}
            style={({ pressed }) => [
              styles.exportButton,
              {
                minHeight: touchTarget.min,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
              pressed && !isExporting && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${selectedIds.size} Check-ins als PDF auf Gerät speichern`}
            accessibilityState={{ disabled: isExporting }}
          >
            <AppText variant="label" size="sm" color="secondary">
              Auf Gerät speichern
            </AppText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  selectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exportBar: {},
  exportButton: { alignItems: 'center', justifyContent: 'center' },
});
