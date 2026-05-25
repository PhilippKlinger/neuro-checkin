import { memo } from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../lib/hooks/useTheme';
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
  const { theme, spacing, typography, radii } = useTheme();
  const anySlotEnabled = slots.some((s) => s.enabled);

  function openAppSettings() {
    if (Platform.OS === 'android') {
      Linking.openSettings();
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
        Erinnerungen
      </Text>

      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.sm,
          color: theme.colors.textSecondary,
          marginBottom: spacing.md,
          lineHeight: typography.sizes.sm * 1.5,
        }}
      >
        Du kannst eine oder zwei Erinnerungen einstellen — oder keine.
      </Text>

      {isEmulator && anySlotEnabled && (
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.xs,
            color: theme.colors.textSecondary,
            marginBottom: spacing.sm,
            fontStyle: 'italic',
          }}
        >
          Hinweis: Benachrichtigungen funktionieren nur auf einem echten Gerät, nicht im Emulator.
        </Text>
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
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.sm,
              color: theme.colors.textSecondary,
              flex: 1,
              marginLeft: spacing.xs,
              lineHeight: typography.sizes.sm * 1.4,
            }}
          >
            Benachrichtigungen sind in den Systemeinstellungen deaktiviert. Tippe hier um sie zu
            erlauben.
          </Text>
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
