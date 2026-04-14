import { useState, useCallback } from 'react';
import { View, Text, Switch, Pressable, ScrollView, StyleSheet, Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import { useFocusEffect } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { getSettings, updateSettings } from '../../lib/database/settings';
import { deleteAllCheckIns } from '../../lib/database/checkins';
import { themes, ThemeName } from '../../lib/constants/themes';
import {
  requestNotificationPermission,
  scheduleReminderNotification,
  cancelReminderNotification,
  getScheduledReminderTime,
} from '../../lib/notifications/notifications';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import * as MailComposer from 'expo-mail-composer';
import Constants from 'expo-constants';

const THEME_OPTIONS: { key: ThemeName; label: string }[] = [
  { key: 'warmEarth', label: 'Warm Earth' },
  { key: 'coolMist', label: 'Cool Mist' },
  { key: 'softSage', label: 'Soft Sage' },
];

function timeStringToDate(time: string | null): Date {
  const date = new Date();
  if (time) {
    const [h, m] = time.split(':').map(Number);
    date.setHours(h, m, 0, 0);
  } else {
    date.setHours(9, 0, 0, 0);
  }
  return date;
}

function dateToTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function SettingsScreen() {
  const { theme, themeName, setThemeName, spacing, typography, radii, touchTarget } =
    useTheme();
  const db = useDatabase();

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isEmulator, setIsEmulator] = useState(false);
  const [showResetTutorialDialog, setShowResetTutorialDialog] = useState(false);
  const [showDeleteStep1Dialog, setShowDeleteStep1Dialog] = useState(false);
  const [showDeleteStep2Dialog, setShowDeleteStep2Dialog] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const settings = await getSettings(db);
        setReminderEnabled(settings.reminderEnabled);
        setReminderTime(settings.reminderTime);
        setThemeName(settings.themeName as ThemeName);
        setIsEmulator(!Device.isDevice);

        // Reconcile: if DB says enabled but no notification is scheduled, reschedule
        if (settings.reminderEnabled && Device.isDevice) {
          const scheduledTime = await getScheduledReminderTime();
          if (!scheduledTime) {
            const time = settings.reminderTime ?? '09:00';
            await scheduleReminderNotification(time);
          }
        }
      }
      load();
    }, [db, setThemeName])
  );

  async function handleReminderToggle(value: boolean) {
    if (value) {
      const result = await requestNotificationPermission();
      if (result === 'emulator') {
        setReminderEnabled(true);
        const time = reminderTime ?? '09:00';
        setReminderTime(time);
        await updateSettings(db, { reminderEnabled: true, reminderTime: time });
        return;
      }
      if (!result) return;
      // Permission granted — update UI immediately before async work
      setReminderEnabled(true);
      const time = reminderTime ?? '09:00';
      setReminderTime(time);
      await scheduleReminderNotification(time);
      await updateSettings(db, { reminderEnabled: true, reminderTime: time });
    } else {
      setReminderEnabled(false);
      await cancelReminderNotification();
      await updateSettings(db, { reminderEnabled: false });
    }
  }

  async function handleTimeChange(_event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (!selected) return;
    const time = dateToTimeString(selected);
    setReminderTime(time);
    await updateSettings(db, { reminderTime: time });
    if (reminderEnabled) await scheduleReminderNotification(time);
  }

  async function handleThemeChange(name: ThemeName) {
    setThemeName(name);
    await updateSettings(db, { themeName: name });
  }

  function handleResetTutorial() {
    setShowResetTutorialDialog(true);
  }

  async function confirmResetTutorial() {
    setShowResetTutorialDialog(false);
    await updateSettings(db, { firstCheckInCompleted: false });
    Alert.alert('Erledigt', 'Tutorial wird beim nächsten Check-in erneut angezeigt.');
  }

  function handleDeleteAllCheckIns() {
    setShowDeleteStep1Dialog(true);
  }

  function confirmDeleteStep1() {
    setShowDeleteStep1Dialog(false);
    setShowDeleteStep2Dialog(true);
  }

  async function confirmDeleteStep2() {
    setShowDeleteStep2Dialog(false);
    await deleteAllCheckIns(db);
    Alert.alert('Erledigt', 'Alle Check-ins wurden gelöscht.');
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

  const pickerDate = timeStringToDate(reminderTime);

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
                    { backgroundColor: palette.colors.background, borderRadius: radii.full, borderWidth: 1, borderColor: palette.colors.border },
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

      {/* Reminder */}
      <Text
        style={{
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.lg,
          color: theme.colors.text,
          marginBottom: spacing.md,
        }}
      >
        Erinnerung
      </Text>

      <View
        style={[
          styles.settingRow,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: radii.md,
            padding: spacing.md,
            minHeight: touchTarget.min,
          },
        ]}
      >
        <View style={styles.settingTextWrapper}>
          <Text
            style={{
              fontFamily: typography.families.ui.medium,
              fontSize: typography.sizes.md,
              color: theme.colors.text,
            }}
          >
            Tägliche Erinnerung
          </Text>
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.sm,
              color: theme.colors.textSecondary,
            }}
          >
            {reminderEnabled
              ? 'Du wirst einmal täglich erinnert'
              : 'Keine Erinnerung aktiv'}
          </Text>
        </View>
        <Switch
          value={reminderEnabled}
          onValueChange={handleReminderToggle}
          trackColor={{
            false: theme.colors.border,
            true: theme.colors.primarySoft,
          }}
          thumbColor={
            reminderEnabled ? theme.colors.primary : theme.colors.surface
          }
          accessibilityLabel="Tägliche Erinnerung"
          accessibilityRole="switch"
          accessibilityHint={reminderEnabled ? 'Erinnerung deaktivieren' : 'Erinnerung aktivieren'}
        />
      </View>

      {isEmulator && reminderEnabled && (
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.xs,
            color: theme.colors.textSecondary,
            marginTop: spacing.sm,
            fontStyle: 'italic',
          }}
        >
          Hinweis: Benachrichtigungen funktionieren nur auf einem echten Gerät, nicht im Emulator.
        </Text>
      )}

      {reminderEnabled && (
        <View
          style={[
            styles.settingRow,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: radii.md,
              padding: spacing.md,
              marginTop: spacing.sm,
              minHeight: touchTarget.min,
            },
          ]}
        >
          <Text
            style={{
              fontFamily: typography.families.ui.medium,
              fontSize: typography.sizes.md,
              color: theme.colors.text,
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
              onChange={handleTimeChange}
              accessibilityLabel="Erinnerungszeit auswählen"
            />
          ) : (
            <>
              <Pressable
                onPress={() => setShowTimePicker(true)}
                style={[
                  styles.timeButton,
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
                accessibilityLabel={`Uhrzeit: ${reminderTime ?? '09:00'}. Tippen zum Ändern`}
              >
                <Text
                  style={{
                    fontFamily: typography.families.ui.medium,
                    fontSize: typography.sizes.md,
                    color: theme.colors.primary,
                  }}
                >
                  {reminderTime ?? '09:00'}
                </Text>
              </Pressable>
              {showTimePicker && (
                <DateTimePicker
                  value={pickerDate}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                  accessibilityLabel="Erinnerungszeit auswählen"
                />
              )}
            </>
          )}
        </View>
      )}

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

      <View style={[styles.dataSection, { gap: spacing.sm }]}>
        <Pressable
          onPress={handleResetTutorial}
          style={[
            styles.dataButton,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: radii.md,
              padding: spacing.md,
              minHeight: touchTarget.min,
              borderWidth: 1,
              borderColor: theme.colors.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Tutorial zurücksetzen"
          accessibilityHint="Zeigt den geführten ersten Check-in beim nächsten Start erneut an"
        >
          <Text
            style={{
              fontFamily: typography.families.ui.medium,
              fontSize: typography.sizes.md,
              color: theme.colors.textSecondary,
            }}
          >
            Tutorial zurücksetzen
          </Text>
        </Pressable>

        <Pressable
          onPress={handleDeleteAllCheckIns}
          style={[
            styles.dataButton,
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
      </View>

      <ConfirmDialog
        visible={showResetTutorialDialog}
        title="Tutorial zurücksetzen?"
        message="Der geführte erste Check-in wird beim nächsten Start erneut angezeigt."
        confirmLabel="Zurücksetzen"
        cancelLabel="Abbrechen"
        onConfirm={confirmResetTutorial}
        onCancel={() => setShowResetTutorialDialog(false)}
      />

      <ConfirmDialog
        visible={showDeleteStep1Dialog}
        title="Alle Check-ins löschen"
        message="Möchtest du wirklich alle gespeicherten Check-ins löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        destructive
        onConfirm={confirmDeleteStep1}
        onCancel={() => setShowDeleteStep1Dialog(false)}
      />

      <ConfirmDialog
        visible={showDeleteStep2Dialog}
        title="Sicher?"
        message="Alle Check-ins werden unwiderruflich gelöscht."
        confirmLabel="Ja, alles löschen"
        cancelLabel="Abbrechen"
        destructive
        onConfirm={confirmDeleteStep2}
        onCancel={() => setShowDeleteStep2Dialog(false)}
      />
    </ScrollView>
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
  dataSection: {},
  dataButton: {},
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTextWrapper: {
    flex: 1,
  },
  timeButton: {
    alignItems: 'center',
  },
});
