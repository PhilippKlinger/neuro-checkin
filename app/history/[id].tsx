import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ToastAndroid } from 'react-native';
import { AppText } from '../../components/ui/AppText';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { getCheckInById, deleteCheckIn } from '../../lib/database/checkins';
import { getSettings, updateSettings } from '../../lib/database/settings';
import { CheckIn } from '../../lib/types/checkin';
import { CheckInDetailContent } from '../../components/history/CheckInDetailContent';
import { exportCheckInsAsPdf, saveCheckInsPdfToDevice } from '../../lib/utils/pdfExport';
import * as Sentry from '@sentry/react-native';

export default function CheckInDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, spacing } = useTheme();
  const db = useDatabase();
  const router = useRouter();
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailHint, setShowDetailHint] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const parsedId = Number(id);
      if (!id || !Number.isInteger(parsedId) || parsedId <= 0) {
        if (!cancelled) setIsLoading(false);
        return;
      }
      try {
        const [data, settings] = await Promise.all([getCheckInById(db, parsedId), getSettings(db)]);
        if (cancelled) return;
        setCheckIn(data);
        if (!settings.detailViewIntroduced) {
          setShowDetailHint(true);
          await updateSettings(db, { detailViewIntroduced: true });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [db, id]);

  async function handleExport() {
    if (!checkIn) return;
    try {
      await exportCheckInsAsPdf([checkIn]);
      ToastAndroid.show('PDF erstellt', ToastAndroid.SHORT);
    } catch (error) {
      Sentry.withScope((scope) => {
        scope.setTag('screen', 'checkInDetail');
        scope.setTag('action', 'pdfExport');
        Sentry.captureException(error);
      });
      Alert.alert(
        'Export fehlgeschlagen',
        'PDF konnte nicht erstellt werden. Bitte versuche es erneut.'
      );
    }
  }

  async function handleSaveToDevice() {
    if (!checkIn) return;
    try {
      const fileUri = await saveCheckInsPdfToDevice([checkIn]);
      ToastAndroid.show('PDF gespeichert', ToastAndroid.SHORT);
    } catch (error) {
      Sentry.withScope((scope) => {
        scope.setTag('screen', 'checkInDetail');
        scope.setTag('action', 'pdfSaveToDevice');
        Sentry.captureException(error);
      });
      const message =
        error instanceof Error && error.message === 'Permission denied'
          ? 'Berechtigung verweigert. Bitte wähle einen Ordner aus.'
          : 'PDF konnte nicht gespeichert werden. Bitte versuche es erneut.';
      Alert.alert('Speichern fehlgeschlagen', message);
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
      Alert.alert('Fehler', 'Check-in konnte nicht gelöscht werden. Bitte versuche es erneut.');
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
      {showDetailHint && (
        <AppText
          variant="hint"
          style={{
            textAlign: 'center',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          }}
        >
          Einzelne Check-ins können über das Papierkorb-Symbol unten gelöscht werden.
        </AppText>
      )}
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
