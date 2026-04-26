import { useState, useCallback } from 'react';
import { Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import * as Device from 'expo-device';
import { useFocusEffect, useRouter } from 'expo-router';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { getSettings, updateSettings } from '../../lib/database/settings';
import { countCheckIns } from '../../lib/database/checkins';
import { getNotificationSlots, saveNotificationSlot } from '../../lib/database/notificationQueries';
import { ThemeName, ColorMode } from '../../lib/constants/themes';
import { AppearanceModeSection } from '../../components/settings/AppearanceModeSection';
import {
  requestNotificationPermission,
  scheduleSingleSlot,
  cancelSingleSlot,
  scheduleAllSlots,
} from '../../lib/notifications/notifications';
import { type NotificationSlot, ALL_WEEKDAYS, WEEKDAY_BITS } from '../../lib/types/checkin';
import { ThemeSection } from '../../components/settings/ThemeSection';
import { NotificationsSection } from '../../components/settings/NotificationsSection';
import { DataSection } from '../../components/settings/DataSection';
import { FeedbackModal } from '../../components/settings/FeedbackModal';
import { dateToTimeString } from '../../lib/utils/time';

const DEFAULT_SLOTS: NotificationSlot[] = [
  { id: 0, enabled: false, time: '09:00', weekdays: ALL_WEEKDAYS },
  { id: 1, enabled: false, time: '20:00', weekdays: ALL_WEEKDAYS },
];

export default function SettingsScreen() {
  const { theme, themeName, colorMode, setThemeName, setColorMode, spacing, typography, radii, touchTarget } = useTheme();
  const db = useDatabase();
  const router = useRouter();

  const [slots, setSlots] = useState<NotificationSlot[]>(DEFAULT_SLOTS);
  const [showTimePicker, setShowTimePicker] = useState<0 | 1 | null>(null);
  const [isEmulator, setIsEmulator] = useState(false);
  const [checkInCount, setCheckInCount] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const settings = await getSettings(db);
        setThemeName(settings.themeName as ThemeName);
        setIsEmulator(!Device.isDevice);

        const dbSlots = await getNotificationSlots(db);
        if (dbSlots.length >= 2) {
          setSlots(dbSlots as NotificationSlot[]);
          if (Device.isDevice) {
            await scheduleAllSlots(dbSlots as NotificationSlot[]);
          }
        }

        const count = await countCheckIns(db);
        setCheckInCount(count);
      }
      load();
    }, [db, setThemeName])
  );

  async function handleSlotToggle(slotId: 0 | 1, value: boolean) {
    if (value) {
      const result = await requestNotificationPermission();
      if (result === false) return;
    }
    const updatedSlots = slots.map((s) => s.id === slotId ? { ...s, enabled: value } : s);
    setSlots(updatedSlots);
    const updated = updatedSlots.find((s) => s.id === slotId)!;
    await saveNotificationSlot(db, updated);
    if (Device.isDevice) {
      if (value) await scheduleSingleSlot(updated);
      else await cancelSingleSlot(slotId);
    }
  }

  async function handleTimeChange(slotId: 0 | 1, _event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShowTimePicker(null);
    if (!selected) return;
    const time = dateToTimeString(selected);
    const updatedSlots = slots.map((s) => s.id === slotId ? { ...s, time } : s);
    setSlots(updatedSlots);
    const updated = updatedSlots.find((s) => s.id === slotId)!;
    await saveNotificationSlot(db, updated);
    if (updated.enabled && Device.isDevice) await scheduleSingleSlot(updated);
  }

  async function handleWeekdayToggle(slotId: 0 | 1, bitIndex: number) {
    const bit = WEEKDAY_BITS[bitIndex];
    const updatedSlots = slots.map((s) => {
      if (s.id !== slotId) return s;
      const newWeekdays = (s.weekdays & bit) ? s.weekdays & ~bit : s.weekdays | bit;
      if (newWeekdays === 0) return s;
      return { ...s, weekdays: newWeekdays };
    });
    setSlots(updatedSlots);
    const updated = updatedSlots.find((s) => s.id === slotId)!;
    await saveNotificationSlot(db, updated);
    if (updated.enabled && Device.isDevice) await scheduleSingleSlot(updated);
  }

  async function handleModeChange(mode: ColorMode) {
    setColorMode(mode);
    await updateSettings(db, { colorMode: mode });
  }

  async function handleThemeChange(name: ThemeName) {
    setThemeName(name);
    await updateSettings(db, { themeName: name });
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
      >
        <AppearanceModeSection currentMode={colorMode} onModeChange={handleModeChange} />

        <ThemeSection currentTheme={themeName} onThemeChange={handleThemeChange} />

        <NotificationsSection
          slots={slots}
          showTimePicker={showTimePicker}
          isEmulator={isEmulator}
          onToggle={handleSlotToggle}
          onTimePress={(id) => setShowTimePicker(id)}
          onTimeChange={handleTimeChange}
          onWeekdayToggle={handleWeekdayToggle}
        />

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
          onPress={() => setShowFeedbackModal(true)}
          style={[
            styles.listItem,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: radii.md,
              padding: spacing.md,
              minHeight: touchTarget.min,
              borderWidth: 1,
              borderColor: theme.colors.border,
              marginBottom: spacing.xl,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Feedback senden"
          accessibilityHint="Öffnet ein Feedback-Formular"
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

        <DataSection
          db={db}
          checkInCount={checkInCount}
          onDeleteComplete={() => setCheckInCount(0)}
        />

        <Text
          style={{
            fontFamily: typography.families.heading.semibold,
            fontSize: typography.sizes.lg,
            color: theme.colors.text,
            marginTop: spacing.xl,
            marginBottom: spacing.md,
          }}
        >
          Über die App
        </Text>
        <Pressable
          onPress={() => router.push('/check-in-info')}
          style={[
            styles.infoRow,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: radii.md,
              padding: spacing.md,
              minHeight: touchTarget.min,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Was ist ein Check-in? Mehr erfahren"
        >
          <Text style={{ fontFamily: typography.families.body.regular, fontSize: typography.sizes.md, color: theme.colors.text }}>
            Was ist ein Check-in?
          </Text>
          <Text style={{ fontFamily: typography.families.body.regular, fontSize: typography.sizes.md, color: theme.colors.textSecondary }}>
            ›
          </Text>
        </Pressable>
      </ScrollView>

      <FeedbackModal visible={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listItem: { justifyContent: 'center' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
