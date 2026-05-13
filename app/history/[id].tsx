import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { getCheckInById, deleteCheckIn } from '../../lib/database/checkins';
import { getSettings, updateSettings } from '../../lib/database/settings';
import { CheckIn } from '../../lib/types/checkin';
import { CheckInDetailContent } from '../../components/history/CheckInDetailContent';

export default function CheckInDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, spacing, typography } = useTheme();
  const db = useDatabase();
  const router = useRouter();
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailHint, setShowDetailHint] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const [data, settings] = await Promise.all([
          getCheckInById(db, Number(id)),
          getSettings(db),
        ]);
        setCheckIn(data);
        if (!settings.detailViewIntroduced) {
          setShowDetailHint(true);
          await updateSettings(db, { detailViewIntroduced: true });
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [db, id]);

  async function confirmDelete() {
    if (!checkIn) return;
    setShowDeleteDialog(false);
    try {
      await deleteCheckIn(db, checkIn.id);
      router.back();
    } catch {
      Alert.alert('Fehler', 'Check-in konnte nicht gelöscht werden. Bitte versuche es erneut.');
    }
  }

  if (isLoading || !checkIn) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={{ fontFamily: typography.families.body.regular, fontSize: typography.sizes.md, color: theme.colors.textSecondary }}>
          {isLoading ? 'Laden...' : 'Check-in nicht gefunden.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {showDetailHint && (
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.sm,
            color: theme.colors.textSecondary,
            fontStyle: 'italic',
            textAlign: 'center',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          }}
        >
          Einzelne Check-ins können über das Papierkorb-Symbol unten gelöscht werden.
        </Text>
      )}
      <CheckInDetailContent
        checkIn={checkIn}
        showDeleteDialog={showDeleteDialog}
        onDeleteRequest={() => setShowDeleteDialog(true)}
        onDeleteConfirm={confirmDelete}
        onDeleteCancel={() => setShowDeleteDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
});
