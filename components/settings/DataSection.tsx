import { Alert, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { deleteAllCheckIns } from '../../lib/database/checkins';
import { SQLiteDatabase } from 'expo-sqlite';
import { useState } from 'react';

interface DataSectionProps {
  db: SQLiteDatabase;
  checkInCount: number;
  onDeleteComplete: () => void;
}

export function DataSection({ db, checkInCount, onDeleteComplete }: DataSectionProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
  const [showStep1, setShowStep1] = useState(false);
  const [showStep2, setShowStep2] = useState(false);
  const [showDone, setShowDone] = useState(false);

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

  return (
    <>
      <Text
        style={{
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.lg,
          color: theme.colors.text,
          marginBottom: spacing.md,
        }}
      >
        Daten & Datenschutz
      </Text>

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

      <ConfirmDialog
        visible={showStep1}
        title="Alle Check-ins löschen"
        message={`Möchtest du wirklich ${checkInCount === 1 ? '1 gespeicherten Check-in' : `alle ${checkInCount} gespeicherten Check-ins`} löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        destructive
        onConfirm={() => { setShowStep1(false); setShowStep2(true); }}
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
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
  },
});
