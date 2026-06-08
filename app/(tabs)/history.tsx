import { useState, useCallback, useEffect } from 'react';
import {
  View,
  SectionList,
  Pressable,
  StyleSheet,
  Alert,
  SectionListRenderItem,
} from 'react-native';
import { AppText } from '../../components/ui/AppText';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { getCheckIns } from '../../lib/database/checkins';
import { getSettings, updateSettings } from '../../lib/database/settings';
import { CheckIn, HistoryViewMode } from '../../lib/types/checkin';
import { CheckInCard } from '../../components/history/CheckInCard';
import { CompactCheckInRow } from '../../components/history/CompactCheckInRow';
import { HistorySectionHeader } from '../../components/history/HistorySectionHeader';
import { usePagedCheckIns } from '../../lib/hooks/usePagedCheckIns';
import type { HistorySection } from '../../lib/utils/groupByDate';
import {
  exportCheckInsAsPdf,
  saveCheckInsPdfToDevice,
  MAX_EXPORT_COUNT,
} from '../../lib/utils/pdfExport';
import { showToast } from '../../components/ui/Toast';
import * as Sentry from '@sentry/react-native';

export default function HistoryScreen() {
  const { theme, spacing, radii, touchTarget } = useTheme();
  const db = useDatabase();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<HistoryViewMode>('compact');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const fetchPage = useCallback(
    (limit: number, offset: number) => getCheckIns(db, limit, offset),
    [db]
  );

  const { items, sections, hasMore, isLoading, isLoadingMore, loadMore } =
    usePagedCheckIns(fetchPage);

  useEffect(() => {
    getSettings(db).then((s) => setViewMode(s.historyViewMode));
  }, [db]);

  function toggleViewMode() {
    const next: HistoryViewMode = viewMode === 'compact' ? 'cards' : 'compact';
    setViewMode(next);
    updateSettings(db, { historyViewMode: next });
  }

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
    setSelectedIds(new Set(items.slice(0, MAX_EXPORT_COUNT).map((c) => c.id)));
  }

  async function handleExportSelected() {
    if (selectedIds.size === 0 || isExporting) return;
    if (selectedIds.size > MAX_EXPORT_COUNT) {
      Alert.alert('Zu viele ausgewählt', `Maximal ${MAX_EXPORT_COUNT} Check-ins pro Export.`);
      return;
    }
    const toExport = items.filter((c) => selectedIds.has(c.id));
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
        'Hat nicht geklappt',
        'Das PDF konnte nicht erstellt werden. Versuch es nochmal.'
      );
    } finally {
      setIsExporting(false);
      exitSelectionMode();
    }
  }

  async function handleSaveToDevice() {
    if (selectedIds.size === 0 || isExporting) return;
    if (selectedIds.size > MAX_EXPORT_COUNT) {
      Alert.alert('Zu viele ausgewählt', `Maximal ${MAX_EXPORT_COUNT} Check-ins pro Export.`);
      return;
    }
    const toExport = items.filter((c) => selectedIds.has(c.id));
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
        'Hat nicht geklappt',
        'Das PDF konnte nicht gespeichert werden. Versuch es nochmal.'
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const renderItem: SectionListRenderItem<CheckIn, HistorySection> = useCallback(
    ({ item, section }) => {
      const isInTodayOrYesterday = section.title === 'Heute' || section.title === 'Gestern';

      if (viewMode === 'compact') {
        return (
          <CompactCheckInRow
            checkIn={item}
            onPress={handlePress}
            selectable={selectionMode}
            selected={selectedIds.has(item.id)}
            onToggle={toggleSelection}
            showFullDate={!isInTodayOrYesterday}
          />
        );
      }

      return (
        <CheckInCard
          checkIn={item}
          onPress={handlePress}
          selectable={selectionMode}
          selected={selectedIds.has(item.id)}
          onToggle={toggleSelection}
        />
      );
    },
    [viewMode, handlePress, selectionMode, selectedIds, toggleSelection]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: HistorySection }) => <HistorySectionHeader title={section.title} />,
    []
  );

  const renderFooter = useCallback(() => {
    if (isLoadingMore) {
      return (
        <View style={styles.footer}>
          <AppText variant="body" size="xs" color="secondary">
            Laden...
          </AppText>
        </View>
      );
    }
    if (!hasMore && items.length > 0) {
      return (
        <View style={styles.footer}>
          <AppText variant="body" size="xs" color="secondary">
            Alle Check-ins geladen
          </AppText>
        </View>
      );
    }
    return null;
  }, [isLoadingMore, hasMore, items.length]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <AppText variant="body" color="secondary">
          Laden...
        </AppText>
      </View>
    );
  }

  if (items.length === 0) {
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
      {/* Header: selection mode or normal */}
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
          style={[
            styles.normalHeader,
            {
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            },
          ]}
        >
          <Pressable
            onPress={enterSelectionMode}
            style={({ pressed }) => [
              styles.exportButton,
              {
                minHeight: touchTarget.min,
                borderRadius: radii.md,
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.border,
                paddingHorizontal: spacing.md,
              },
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Check-ins zum Teilen auswählen"
          >
            <AppText variant="label" weight="semibold">
              Auswählen & Teilen
            </AppText>
          </Pressable>

          {/* View toggle */}
          <View
            style={[
              styles.toggleContainer,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: radii.sm,
                borderWidth: 1,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Pressable
              onPress={viewMode === 'cards' ? toggleViewMode : undefined}
              style={[
                styles.toggleBtn,
                viewMode === 'compact' && {
                  backgroundColor: theme.colors.card,
                  borderRadius: radii.sm - 2,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Kompaktansicht"
              accessibilityState={{ selected: viewMode === 'compact' }}
            >
              <AppText
                variant="label"
                size="xs"
                color={viewMode === 'compact' ? 'primary' : 'secondary'}
              >
                Kompakt
              </AppText>
            </Pressable>
            <Pressable
              onPress={viewMode === 'compact' ? toggleViewMode : undefined}
              style={[
                styles.toggleBtn,
                viewMode === 'cards' && {
                  backgroundColor: theme.colors.card,
                  borderRadius: radii.sm - 2,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Kartenansicht"
              accessibilityState={{ selected: viewMode === 'cards' }}
            >
              <AppText
                variant="label"
                size="xs"
                color={viewMode === 'cards' ? 'primary' : 'secondary'}
              >
                Karten
              </AppText>
            </Pressable>
          </View>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{ padding: spacing.md }}
        stickySectionHeadersEnabled
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={20}
        maxToRenderPerBatch={15}
        extraData={selectionMode ? selectedIds : viewMode}
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
                backgroundColor: isExporting ? theme.colors.border : theme.colors.accent,
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
  normalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exportBar: {},
  exportButton: { alignItems: 'center', justifyContent: 'center' },
  toggleContainer: { flexDirection: 'row', padding: 2 },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  footer: { alignItems: 'center', paddingVertical: 16 },
});
