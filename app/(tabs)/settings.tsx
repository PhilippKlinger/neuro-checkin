import { useState, useCallback } from 'react';
import { View, Text, Switch, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { getSettings, updateSettings } from '../../lib/database/settings';
import { themes, ThemeName } from '../../lib/constants/themes';
import {
  requestNotificationPermission,
  scheduleReminderNotification,
  cancelReminderNotification,
} from '../../lib/notifications/notifications';

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

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const settings = await getSettings(db);
        setReminderEnabled(settings.reminderEnabled);
        setReminderTime(settings.reminderTime);
        setThemeName(settings.themeName as ThemeName);
      }
      load();
    }, [db, setThemeName])
  );

  async function handleReminderToggle(value: boolean) {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
      const time = reminderTime ?? '09:00';
      await scheduleReminderNotification(time);
      setReminderTime(time);
      await updateSettings(db, { reminderEnabled: true, reminderTime: time });
    } else {
      await cancelReminderNotification();
      await updateSettings(db, { reminderEnabled: false });
    }
    setReminderEnabled(value);
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
