import { memo } from 'react';
import { View, Pressable, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';
import { type NotificationSlot } from '../../lib/types/checkin';
import { SlotCard } from './SlotCard';

interface NotificationsSectionProps {
  slots: NotificationSlot[];
  showTimePicker: 0 | 1 | null;
  isEmulator: boolean;
  permissionDenied: boolean;
  onToggle: (slotId: 0 | 1, value: boolean) => void;
  onTimePress: (slotId: 0 | 1) => void;
  onTimeChange: (slotId: 0 | 1, event: DateTimePickerEvent, date?: Date) => void;
  onWeekdayToggle: (slotId: 0 | 1, bitIndex: number) => void;
}

const SLOT_LABELS: Record<0 | 1, string> = {
  0: 'Morgen-Erinnerung',
  1: 'Abend-Erinnerung',
};

export const NotificationsSection = memo(function NotificationsSection({
  slots,
  showTimePicker,
  isEmulator,
  permissionDenied,
  onToggle,
  onTimePress,
  onTimeChange,
  onWeekdayToggle,
}: NotificationsSectionProps) {
  const { theme, spacing, radii } = useTheme();
  const anySlotEnabled = slots.some((s) => s.enabled);

  function openAppSettings() {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    }
  }

  return (
    <>
      <AppText variant="title" size="lg" style={{ marginBottom: spacing.md }}>
        Erinnerungen
      </AppText>

      <AppText variant="body" size="sm" color="secondary" style={{ marginBottom: spacing.md }}>
        Du kannst eine oder zwei Erinnerungen einstellen — oder keine.
      </AppText>

      {isEmulator && anySlotEnabled && (
        <AppText variant="hint" size="xs" style={{ marginBottom: spacing.sm }}>
          Hinweis: Benachrichtigungen funktionieren nur auf einem echten Gerät, nicht im Emulator.
        </AppText>
      )}

      {permissionDenied && !isEmulator && (
        <Pressable
          onPress={openAppSettings}
          style={({ pressed }) => [
            styles.permissionHint,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              padding: spacing.sm,
              marginBottom: spacing.md,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Benachrichtigungen sind deaktiviert"
          accessibilityHint="Öffnet die Systemeinstellungen um Benachrichtigungen zu erlauben"
        >
          <Ionicons name="notifications-off-outline" size={16} color={theme.colors.textSecondary} />
          <AppText
            variant="body"
            size="sm"
            color="secondary"
            style={{ flex: 1, marginLeft: spacing.xs }}
          >
            Erinnerungen sind deaktiviert — tippe hier für die Einstellungen.
          </AppText>
        </Pressable>
      )}

      <View style={styles.slots}>
        {slots.map((slot) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            label={SLOT_LABELS[slot.id]}
            showTimePicker={showTimePicker === slot.id}
            onToggle={(value) => onToggle(slot.id, value)}
            onTimePress={() => onTimePress(slot.id)}
            onTimeChange={(e, d) => onTimeChange(slot.id, e, d)}
            onWeekdayToggle={(i) => onWeekdayToggle(slot.id, i)}
          />
        ))}
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  slots: {},
  permissionHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
