import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { AppText } from '../../components/ui/AppText';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { getCheckInById, deleteCheckIn } from '../../lib/database/checkins';
import { getSettings, updateSettings } from '../../lib/database/settings';
import { CheckIn } from '../../lib/types/checkin';
import { CheckInDetailContent } from '../../components/history/CheckInDetailContent';
import { exportCheckInsAsPdf, saveCheckInsPdfToDevice } from '../../lib/utils/pdfExport';
import { showToast } from '../../components/ui/Toast';
import * as Sentry from '@sentry/react-native';

export default function CheckInDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const db = useDatabase();
  const router = useRouter();
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const parsedId = Number(id);
      if (!id || !Number.isInteger(parsedId) || parsedId <= 0) {
        if (!cancelled) setIsLoading(false);
        return;
      }
      try {
        const data = await getCheckInById(db, parsedId);
        if (cancelled) return;
        setCheckIn(data);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [db, id]);

  async function handleExport() {
    if (!checkIn) return;
    try {
      await exportCheckInsAsPdf([checkIn]);
      showToast('PDF erstellt');
    } catch (error) {
      Sentry.withScope((scope) => {
        scope.setTag('screen', 'checkInDetail');
        scope.setTag('action', 'pdfExport');
        Sentry.captureException(error);
      });
      Alert.alert(
        'Hat nicht geklappt',
        'Das PDF konnte nicht erstellt werden. Versuch es nochmal.'
      );
    }
  }

  async function handleSaveToDevice() {
    if (!checkIn) return;
    try {
      const settings = await getSettings(db);
      await saveCheckInsPdfToDevice([checkIn], {
        savedDirectoryUri: settings.exportDirectoryUri,
        onDirectoryChosen: (uri) => updateSettings(db, { exportDirectoryUri: uri }),
      });
      showToast('PDF gespeichert');
    } catch (error) {
      if (error instanceof Error && error.message === 'Permission denied') {
        return;
      }
      Sentry.withScope((scope) => {
        scope.setTag('screen', 'checkInDetail');
        scope.setTag('action', 'pdfSaveToDevice');
        Sentry.captureException(error);
      });
      Alert.alert(
        'Hat nicht geklappt',
        'Das PDF konnte nicht gespeichert werden. Versuch es nochmal.'
      );
    }
  }

  async function confirmDelete() {
    if (!checkIn) return;
    setShowDeleteDialog(false);
    try {
      await deleteCheckIn(db, checkIn.id);
      router.back();
    } catch (error) {
      console.error('deleteCheckIn failed:', error);
      Alert.alert(
        'Hat nicht geklappt',
        'Check-in konnte nicht gelöscht werden. Versuch es nochmal.'
      );
    }
  }

  if (isLoading || !checkIn) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <AppText variant="body" color="secondary">
          {isLoading ? 'Laden...' : 'Check-in nicht gefunden.'}
        </AppText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <CheckInDetailContent
        checkIn={checkIn}
        showDeleteDialog={showDeleteDialog}
        onDeleteRequest={() => setShowDeleteDialog(true)}
        onDeleteConfirm={confirmDelete}
        onDeleteCancel={() => setShowDeleteDialog(false)}
        onExport={handleExport}
        onSaveToDevice={handleSaveToDevice}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
});
