import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Switch,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import * as Device from 'expo-device';
import { useFocusEffect } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../lib/hooks/useTheme';
import type { ThemeContextValue } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { getSettings, updateSettings } from '../../lib/database/settings';
import { deleteAllCheckIns } from '../../lib/database/checkins';
import { getNotificationSlots, saveNotificationSlot } from '../../lib/database/notificationQueries';
import { themes, ThemeName } from '../../lib/constants/themes';
import {
  requestNotificationPermission,
  scheduleSingleSlot,
  cancelSingleSlot,
  scheduleAllSlots,
} from '../../lib/notifications/notifications';
import { type NotificationSlot, WEEKDAY_LABELS, WEEKDAY_BITS, ALL_WEEKDAYS } from '../../lib/types/checkin';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import * as MailComposer from 'expo-mail-composer';
import Constants from 'expo-constants';

const THEME_OPTIONS: { key: ThemeName; label: string }[] = [
  { key: 'warmEarth', label: 'Warm Earth' },
  { key: 'coolMist', label: 'Cool Mist' },
  { key: 'softSage', label: 'Soft Sage' },
];

const SLOT_LABELS: Record<0 | 1, string> = {
  0: 'Morgen-Erinnerung',
  1: 'Abend-Erinnerung',
};

function timeStringToDate(time: string): Date {
  const date = new Date();
  const [h, m] = time.split(':').map(Number);
  date.setHours(h, m, 0, 0);
  return date;
}

function dateToTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

const DEFAULT_SLOTS: NotificationSlot[] = [
  { id: 0, enabled: false, time: '09:00', weekdays: ALL_WEEKDAYS },
  { id: 1, enabled: false, time: '20:00', weekdays: ALL_WEEKDAYS },
];

export default function SettingsScreen() {
  const { theme, themeName, setThemeName, spacing, typography, radii, touchTarget } =
    useTheme();
  const db = useDatabase();

  const [slots, setSlots] = useState<NotificationSlot[]>(DEFAULT_SLOTS);
  const [showTimePicker, setShowTimePicker] = useState<0 | 1 | null>(null);
  const [isEmulator, setIsEmulator] = useState(false);
  const [showDeleteStep1Dialog, setShowDeleteStep1Dialog] = useState(false);
  const [showDeleteStep2Dialog, setShowDeleteStep2Dialog] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const settings = await getSettings(db);
        setThemeName(settings.themeName as ThemeName);
        setIsEmulator(!Device.isDevice);

        const dbSlots = await getNotificationSlots(db);
        if (dbSlots.length >= 2) {
          setSlots(dbSlots as NotificationSlot[]);

          // Reconcile: if a slot is enabled but has no scheduled notifications, reschedule
          if (Device.isDevice) {
            await scheduleAllSlots(dbSlots as NotificationSlot[]);
          }
        }
      }
      load();
    }, [db, setThemeName])
  );

  async function handleSlotToggle(slotId: 0 | 1, value: boolean) {
    if (value) {
      const result = await requestNotificationPermission();
      if (result === false) return;
    }

    const updatedSlots = slots.map((s) =>
      s.id === slotId ? { ...s, enabled: value } : s
    );
    setSlots(updatedSlots);

    const updated = updatedSlots.find((s) => s.id === slotId)!;
    await saveNotificationSlot(db, updated);

    if (Device.isDevice) {
      if (value) {
        await scheduleSingleSlot(updated);
      } else {
        await cancelSingleSlot(slotId);
      }
    }
  }

  async function handleTimeChange(
    slotId: 0 | 1,
    _event: DateTimePickerEvent,
    selected?: Date
  ) {
    if (Platform.OS === 'android') setShowTimePicker(null);
    if (!selected) return;

    const time = dateToTimeString(selected);
    const updatedSlots = slots.map((s) =>
      s.id === slotId ? { ...s, time } : s
    );
    setSlots(updatedSlots);

    const updated = updatedSlots.find((s) => s.id === slotId)!;
    await saveNotificationSlot(db, updated);
    if (updated.enabled && Device.isDevice) {
      await scheduleSingleSlot(updated);
    }
  }

  async function handleWeekdayToggle(slotId: 0 | 1, bitIndex: number) {
    const bit = WEEKDAY_BITS[bitIndex];
    const updatedSlots = slots.map((s) => {
      if (s.id !== slotId) return s;
      const newWeekdays = (s.weekdays & bit) ? s.weekdays & ~bit : s.weekdays | bit;
      // Prevent deselecting the last active weekday
      if (newWeekdays === 0) return s;
      return { ...s, weekdays: newWeekdays };
    });
    setSlots(updatedSlots);

    const updated = updatedSlots.find((s) => s.id === slotId)!;
    await saveNotificationSlot(db, updated);
    if (updated.enabled && Device.isDevice) {
      await scheduleSingleSlot(updated);
    }
  }

  async function handleThemeChange(name: ThemeName) {
    setThemeName(name);
    await updateSettings(db, { themeName: name });
  }

  async function handleSendFeedback() {
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(
        'Kein Mail-Client gefunden',
        'Bitte richte eine E-Mail-App ein oder schreib mir direkt: feedback@neuro-checkin.app'
      );
      return;
    }

    const appVersion = Constants.expoConfig?.version ?? '—';
    const os = `${Device.osName ?? ''} ${Device.osVersion ?? ''}`.trim();
    const deviceModel = Device.modelName ?? '—';

    await MailComposer.composeAsync({
      recipients: ['feedback@neuro-checkin.app'],
      subject: `Neuro Check-in Feedback (v${appVersion})`,
      body: `Hallo,\n\nhier ist mein Feedback:\n\n\n\n---\nApp-Version: ${appVersion}\nGerät: ${deviceModel}\nBetriebssystem: ${os}`,
    });
  }

  const anySlotEnabled = slots.some((s) => s.enabled);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
    >
      {/* Theme Selection */}
      <Text
        style={{
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.lg,
          color: theme.colors.text,
          marginBottom: spacing.md,
        }}
      >
        Farbpalette
      </Text>

      <View style={[styles.themeGrid, { gap: spacing.sm, marginBottom: spacing.xl }]}>
        {THEME_OPTIONS.map((option) => {
          const palette = themes[option.key];
          const isSelected = themeName === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => handleThemeChange(option.key)}
              style={[
                styles.themeCard,
                {
                  borderRadius: radii.md,
                  padding: spacing.md,
                  backgroundColor: palette.colors.surface,
                  borderWidth: 2,
                  borderColor: isSelected
                    ? palette.colors.primary
                    : palette.colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Farbpalette ${option.label}`}
              accessibilityState={{ selected: isSelected }}
            >
              <View style={[styles.colorPreview, { gap: spacing.xs, marginBottom: spacing.sm }]}>
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: palette.colors.primary, borderRadius: radii.full },
                  ]}
                />
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: palette.colors.accent, borderRadius: radii.full },
                  ]}
                />
                <View
                  style={[
                    styles.colorDot,
                    {
                      backgroundColor: palette.colors.background,
                      borderRadius: radii.full,
                      borderWidth: 1,
                      borderColor: palette.colors.border,
                    },
                  ]}
                />
              </View>
              <Text
                style={{
                  fontFamily: typography.families.ui.medium,
                  fontSize: typography.sizes.sm,
                  color: palette.colors.text,
                  textAlign: 'center',
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Notifications */}
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

      {/* Intro text (Prio 2) */}
      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.sm,
          color: theme.colors.textSecondary,
          marginBottom: spacing.md,
          lineHeight: typography.sizes.sm * 1.5,
        }}
      >
        Du kannst eine oder zwei Erinnerungen einstellen — oder keine. Es gibt kein Richtig.
      </Text>

      {/* Snooze hint (Optional) */}
      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.xs,
          color: theme.colors.textSecondary,
          marginBottom: spacing.md,
          fontStyle: 'italic',
        }}
      >
        Tipp: In der Erinnerung kannst du „Später" wählen — dann wirst du in 15 Minuten nochmal erinnert.
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

      {slots.map((slot) => (
        <SlotCard
          key={slot.id}
          slot={slot}
          label={SLOT_LABELS[slot.id]}
          showTimePicker={showTimePicker === slot.id}
          onToggle={(value) => handleSlotToggle(slot.id, value)}
          onTimePress={() => setShowTimePicker(slot.id)}
          onTimeChange={(e, d) => handleTimeChange(slot.id, e, d)}
          onWeekdayToggle={(i) => handleWeekdayToggle(slot.id, i)}
          theme={theme}
          spacing={spacing}
          typography={typography}
          radii={radii}
          touchTarget={touchTarget}
        />
      ))}

      {/* Feedback */}
      <Text
        style={{
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.lg,
          color: theme.colors.text,
          marginBottom: spacing.md,
          marginTop: spacing.xl,
        }}
      >
        Feedback
      </Text>

      <Pressable
        onPress={handleSendFeedback}
        style={[
          {
            backgroundColor: theme.colors.surface,
            borderRadius: radii.md,
            padding: spacing.md,
            minHeight: touchTarget.min,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginBottom: spacing.xl,
            justifyContent: 'center',
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Feedback senden"
        accessibilityHint="Öffnet eine E-Mail mit vorausgefülltem Betreff"
      >
        <Text
          style={{
            fontFamily: typography.families.ui.medium,
            fontSize: typography.sizes.md,
            color: theme.colors.textSecondary,
          }}
        >
          Feedback senden
        </Text>
      </Pressable>

      {/* Data & Privacy */}
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
        onPress={() => setShowDeleteStep1Dialog(true)}
        style={[
          {
            backgroundColor: theme.colors.errorSoft,
            borderRadius: radii.md,
            padding: spacing.md,
            minHeight: touchTarget.min,
            borderWidth: 1,
            borderColor: theme.colors.error,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Alle Check-ins löschen"
        accessibilityHint="Löscht alle gespeicherten Check-ins dauerhaft"
      >
        <Text
          style={{
            fontFamily: typography.families.ui.medium,
            fontSize: typography.sizes.md,
            color: theme.colors.error,
          }}
        >
          Alle Check-ins löschen
        </Text>
      </Pressable>

      <ConfirmDialog
        visible={showDeleteStep1Dialog}
        title="Alle Check-ins löschen"
        message="Möchtest du wirklich alle gespeicherten Check-ins löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        destructive
        onConfirm={() => {
          setShowDeleteStep1Dialog(false);
          setShowDeleteStep2Dialog(true);
        }}
        onCancel={() => setShowDeleteStep1Dialog(false)}
      />

      <ConfirmDialog
        visible={showDeleteStep2Dialog}
        title="Sicher?"
        message="Alle Check-ins werden unwiderruflich gelöscht."
        confirmLabel="Ja, alles löschen"
        cancelLabel="Abbrechen"
        destructive
        onConfirm={async () => {
          setShowDeleteStep2Dialog(false);
          await deleteAllCheckIns(db);
          Alert.alert('Erledigt', 'Alle Check-ins wurden gelöscht.');
        }}
        onCancel={() => setShowDeleteStep2Dialog(false)}
      />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// SlotCard — one notification slot with toggle, time picker, weekday chips
// ---------------------------------------------------------------------------

interface SlotCardProps {
  slot: NotificationSlot;
  label: string;
  showTimePicker: boolean;
  onToggle: (value: boolean) => void;
  onTimePress: () => void;
  onTimeChange: (event: DateTimePickerEvent, date?: Date) => void;
  onWeekdayToggle: (bitIndex: number) => void;
  theme: ThemeContextValue['theme'];
  spacing: ThemeContextValue['spacing'];
  typography: ThemeContextValue['typography'];
  radii: ThemeContextValue['radii'];
  touchTarget: ThemeContextValue['touchTarget'];
}

function weekdaySummary(weekdays: number): string {
  if (weekdays === ALL_WEEKDAYS) return 'täglich';
  const WORKDAYS = 1 | 2 | 4 | 8 | 16;
  if (weekdays === WORKDAYS) return 'Mo–Fr';
  return WEEKDAY_LABELS.filter((_, i) => (weekdays & WEEKDAY_BITS[i]) !== 0).join(' ');
}

function SlotCard({
  slot,
  label,
  showTimePicker,
  onToggle,
  onTimePress,
  onTimeChange,
  onWeekdayToggle,
  theme,
  spacing,
  typography,
  radii,
  touchTarget,
}: SlotCardProps) {
  const [weekdayExpanded, setWeekdayExpanded] = useState(false);
  const pickerDate = timeStringToDate(slot.time);

  return (
    <View
      style={[
        slotStyles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: radii.md,
          padding: spacing.md,
          marginBottom: spacing.sm,
          borderWidth: 1,
          borderColor: slot.enabled ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      {/* Header row: label + switch */}
      <View style={slotStyles.row}>
        <Text
          style={{
            fontFamily: typography.families.ui.medium,
            fontSize: typography.sizes.md,
            color: theme.colors.text,
            flex: 1,
          }}
        >
          {label}
        </Text>
        <Switch
          value={slot.enabled}
          onValueChange={onToggle}
          trackColor={{
            false: theme.colors.border,
            true: theme.colors.primarySoft,
          }}
          thumbColor={slot.enabled ? theme.colors.primary : theme.colors.surface}
          accessibilityLabel={label}
          accessibilityRole="switch"
          accessibilityHint={slot.enabled ? 'Erinnerung deaktivieren' : 'Erinnerung aktivieren'}
        />
      </View>

      {slot.enabled && (
        <>
          {/* Summary line (Prio 3) */}
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.sm,
              color: theme.colors.primary,
              marginTop: spacing.xs,
            }}
            accessibilityLiveRegion="polite"
          >
            um {slot.time}, {weekdaySummary(slot.weekdays)}
          </Text>

          {/* Time row */}
          <View style={[slotStyles.row, { marginTop: spacing.sm }]}>
            <Text
              style={{
                fontFamily: typography.families.body.regular,
                fontSize: typography.sizes.sm,
                color: theme.colors.textSecondary,
                flex: 1,
              }}
            >
              Uhrzeit
            </Text>

            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={pickerDate}
                mode="time"
                display="default"
                onChange={onTimeChange}
                accessibilityLabel="Erinnerungszeit auswählen"
              />
            ) : (
              <>
                <Pressable
                  onPress={onTimePress}
                  style={[
                    slotStyles.timeButton,
                    {
                      backgroundColor: theme.colors.primarySoft,
                      borderRadius: radii.sm,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      minHeight: touchTarget.min,
                      justifyContent: 'center',
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Uhrzeit: ${slot.time}. Tippen zum Ändern`}
                >
                  <Text
                    style={{
                      fontFamily: typography.families.ui.medium,
                      fontSize: typography.sizes.md,
                      color: theme.colors.primary,
                    }}
                  >
                    {slot.time}
                  </Text>
                </Pressable>
                {showTimePicker && (
                  <DateTimePicker
                    value={pickerDate}
                    mode="time"
                    display="default"
                    onChange={onTimeChange}
                    accessibilityLabel="Erinnerungszeit auswählen"
                  />
                )}
              </>
            )}
          </View>

          {/* Progressive disclosure: weekday chips (Prio 1) */}
          <Pressable
            onPress={() => setWeekdayExpanded((v) => !v)}
            style={{ marginTop: spacing.sm, alignSelf: 'flex-start', minHeight: touchTarget.min, paddingVertical: spacing.xs, justifyContent: 'center' }}
            accessibilityRole="button"
            accessibilityLabel="Wochentage anpassen"
            accessibilityState={{ expanded: weekdayExpanded }}
          >
            <Text
              style={{
                fontFamily: typography.families.ui.medium,
                fontSize: typography.sizes.sm,
                color: theme.colors.textSecondary,
                textDecorationLine: 'underline',
              }}
            >
              Wochentage anpassen
            </Text>
          </Pressable>

          {weekdayExpanded && (
            <View style={[slotStyles.weekdayRow, { marginTop: spacing.sm, gap: spacing.xs }]}>
              {WEEKDAY_LABELS.map((dayLabel, i) => {
                const isActive = (slot.weekdays & WEEKDAY_BITS[i]) !== 0;
                return (
                  <Pressable
                    key={dayLabel}
                    onPress={() => onWeekdayToggle(i)}
                    style={[
                      slotStyles.dayChip,
                      {
                        borderRadius: radii.full,
                        borderWidth: 1,
                        borderColor: isActive ? theme.colors.primary : theme.colors.border,
                        backgroundColor: isActive
                          ? theme.colors.primarySoft
                          : theme.colors.background,
                        minWidth: touchTarget.min,
                        minHeight: touchTarget.min,
                        paddingHorizontal: spacing.xs,
                        justifyContent: 'center',
                        alignItems: 'center',
                      },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityLabel={`Wochentag ${dayLabel}`}
                    accessibilityState={{ checked: isActive }}
                  >
                    <Text
                      style={{
                        fontFamily: typography.families.ui.medium,
                        fontSize: typography.sizes.xs,
                        color: isActive ? theme.colors.primary : theme.colors.textSecondary,
                      }}
                    >
                      {dayLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeGrid: {
    flexDirection: 'row',
  },
  themeCard: {
    flex: 1,
    alignItems: 'center',
  },
  colorPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  colorDot: {
    width: 16,
    height: 16,
  },
});

const slotStyles = StyleSheet.create({
  card: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeButton: {
    alignItems: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayChip: {},
});
