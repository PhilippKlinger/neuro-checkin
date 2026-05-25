import { useState, useCallback, useRef } from 'react';
import { Pressable, ScrollView, Switch, StyleSheet, Platform, View } from 'react-native';
import { AppText } from '../../components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { getSettings, updateSettings } from '../../lib/database/settings';
import { countCheckIns } from '../../lib/database/checkins';
import { countUserChips } from '../../lib/database/userChips';
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
  const { theme, themeName, colorMode, setThemeName, setColorMode, spacing, radii, touchTarget } =
    useTheme();
  const db = useDatabase();
  const router = useRouter();

  const [slots, setSlots] = useState<NotificationSlot[]>(DEFAULT_SLOTS);
  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  const lastScheduledSlotsRef = useRef<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState<0 | 1 | null>(null);
  const [isEmulator, setIsEmulator] = useState(false);
  const [checkInCount, setCheckInCount] = useState(0);
  const [chipCount, setChipCount] = useState(0);
  const [guidedMode, setGuidedMode] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<boolean | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        try {
          const settings = await getSettings(db);
          setThemeName(settings.themeName as ThemeName);
          setColorMode(settings.colorMode);
          setIsEmulator(!Device.isDevice);

          if (Device.isDevice) {
            const { status } = await Notifications.getPermissionsAsync();
            setNotificationPermission(status === 'granted');
          }

          const dbSlots = await getNotificationSlots(db);
          if (dbSlots.length >= 2) {
            setSlots(dbSlots as NotificationSlot[]);
            if (Device.isDevice) {
              const slotsJson = JSON.stringify(dbSlots);
              if (slotsJson !== lastScheduledSlotsRef.current) {
                await scheduleAllSlots(dbSlots as NotificationSlot[]);
                lastScheduledSlotsRef.current = slotsJson;
              }
            }
          }

          setGuidedMode(settings.guidedModeEnabled);

          const count = await countCheckIns(db);
          setCheckInCount(count);
          const chips = await countUserChips(db);
          setChipCount(chips);
        } catch (e) {
          Sentry.captureException(e);
        }
      }
      load();
    }, [db, setThemeName, setColorMode])
  );

  const handleSlotToggle = useCallback(
    async (slotId: 0 | 1, value: boolean) => {
      if (value) {
        const result = await requestNotificationPermission();
        if (result === false) {
          setNotificationPermission(false);
          return;
        }
        setNotificationPermission(true);
      }
      const updatedSlots = slotsRef.current.map((s) =>
        s.id === slotId ? { ...s, enabled: value } : s
      );
      setSlots(updatedSlots);
      const updated = updatedSlots.find((s) => s.id === slotId)!;
      await saveNotificationSlot(db, updated);
      if (Device.isDevice) {
        if (value) await scheduleSingleSlot(updated);
        else await cancelSingleSlot(slotId);
      }
    },
    [db]
  );

  const handleTimeChange = useCallback(
    async (slotId: 0 | 1, _event: DateTimePickerEvent, selected?: Date) => {
      if (Platform.OS === 'android') setShowTimePicker(null);
      if (!selected) return;
      const time = dateToTimeString(selected);
      const updatedSlots = slotsRef.current.map((s) => (s.id === slotId ? { ...s, time } : s));
      setSlots(updatedSlots);
      const updated = updatedSlots.find((s) => s.id === slotId)!;
      await saveNotificationSlot(db, updated);
      if (updated.enabled && Device.isDevice) await scheduleSingleSlot(updated);
    },
    [db]
  );

  const handleWeekdayToggle = useCallback(
    async (slotId: 0 | 1, bitIndex: number) => {
      const bit = WEEKDAY_BITS[bitIndex];
      const updatedSlots = slotsRef.current.map((s) => {
        if (s.id !== slotId) return s;
        const newWeekdays = s.weekdays & bit ? s.weekdays & ~bit : s.weekdays | bit;
        if (newWeekdays === 0) return s;
        return { ...s, weekdays: newWeekdays };
      });
      setSlots(updatedSlots);
      const updated = updatedSlots.find((s) => s.id === slotId)!;
      await saveNotificationSlot(db, updated);
      if (updated.enabled && Device.isDevice) await scheduleSingleSlot(updated);
    },
    [db]
  );

  const handleModeChange = useCallback(
    async (mode: ColorMode) => {
      const previous = colorMode;
      setColorMode(mode);
      try {
        await updateSettings(db, { colorMode: mode });
      } catch {
        setColorMode(previous);
      }
    },
    [db, colorMode, setColorMode]
  );

  const handleThemeChange = useCallback(
    async (name: ThemeName) => {
      const previous = themeName;
      setThemeName(name);
      try {
        await updateSettings(db, { themeName: name });
      } catch {
        setThemeName(previous);
      }
    },
    [db, themeName, setThemeName]
  );

  const handleGuidedModeToggle = useCallback(
    async (value: boolean) => {
      const previous = guidedMode;
      setGuidedMode(value);
      try {
        await updateSettings(db, { guidedModeEnabled: value });
      } catch (e) {
        Sentry.captureException(e);
        setGuidedMode(previous);
      }
    },
    [db, guidedMode]
  );

  const handleTimePress = useCallback((id: 0 | 1) => setShowTimePicker(id), []);

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
          permissionDenied={notificationPermission === false}
          onToggle={handleSlotToggle}
          onTimePress={handleTimePress}
          onTimeChange={handleTimeChange}
          onWeekdayToggle={handleWeekdayToggle}
        />

        <View style={[styles.guidedRow, { marginTop: spacing.xl }]}>
          <View style={styles.guidedLabel}>
            <Ionicons name="bulb-outline" size={16} color={theme.colors.textSecondary} />
            <View>
              <AppText variant="body">Hinweise im Check-in</AppText>
              <AppText variant="body" size="sm" color="secondary">
                Zeigt kurze Erklärungen in jedem Schritt
              </AppText>
            </View>
          </View>
          <Switch
            value={guidedMode}
            onValueChange={handleGuidedModeToggle}
            trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
            thumbColor={theme.colors.background}
            accessibilityRole="switch"
            accessibilityLabel="Hinweise im Check-in"
            accessibilityHint="Zeigt kurze Erklärungen in jedem Check-in-Schritt"
            accessibilityState={{ checked: guidedMode }}
          />
        </View>

        <Pressable
          onPress={() => setFeedbackOpen((o) => !o)}
          style={({ pressed }) => [
            styles.sectionHeader,
            { marginTop: spacing.xl, minHeight: touchTarget.min },
            pressed && { opacity: 0.75 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Feedback"
          accessibilityHint={feedbackOpen ? 'Zuklappen' : 'Aufklappen'}
          accessibilityState={{ expanded: feedbackOpen }}
        >
          <AppText variant="title">Feedback</AppText>
          <Ionicons
            name={feedbackOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.colors.textSecondary}
            accessibilityElementsHidden
          />
        </Pressable>
        {feedbackOpen && (
          <Pressable
            onPress={() => setShowFeedbackModal(true)}
            style={({ pressed }) => [
              styles.listItem,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: radii.md,
                padding: spacing.md,
                minHeight: touchTarget.min,
                borderWidth: 1,
                borderColor: theme.colors.border,
                marginTop: spacing.sm,
                marginBottom: spacing.xl,
              },
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Feedback senden"
            accessibilityHint="Öffnet ein Feedback-Formular"
          >
            <AppText variant="label" color="secondary">
              Feedback senden
            </AppText>
          </Pressable>
        )}

        <Pressable
          onPress={() => setDataOpen((o) => !o)}
          style={({ pressed }) => [
            styles.sectionHeader,
            { marginTop: feedbackOpen ? 0 : spacing.xl, minHeight: touchTarget.min },
            pressed && { opacity: 0.75 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Daten & Datenschutz"
          accessibilityHint={dataOpen ? 'Zuklappen' : 'Aufklappen'}
          accessibilityState={{ expanded: dataOpen }}
        >
          <AppText variant="title">Daten & Datenschutz</AppText>
          <Ionicons
            name={dataOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.colors.textSecondary}
            accessibilityElementsHidden
          />
        </Pressable>
        {dataOpen && (
          <View style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>
            <DataSection
              db={db}
              checkInCount={checkInCount}
              chipCount={chipCount}
              onDeleteComplete={() => setCheckInCount(0)}
              onChipsDeleteComplete={async () => {
                const count = await countUserChips(db);
                setChipCount(count);
              }}
            />
          </View>
        )}

        <Pressable
          onPress={() => setAboutOpen((o) => !o)}
          style={({ pressed }) => [
            styles.sectionHeader,
            { marginTop: dataOpen ? 0 : spacing.xl, minHeight: touchTarget.min },
            pressed && { opacity: 0.75 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Über die App"
          accessibilityHint={aboutOpen ? 'Zuklappen' : 'Aufklappen'}
          accessibilityState={{ expanded: aboutOpen }}
        >
          <AppText variant="title">Über die App</AppText>
          <Ionicons
            name={aboutOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.colors.textSecondary}
            accessibilityElementsHidden
          />
        </Pressable>
        {aboutOpen && (
          <Pressable
            onPress={() => router.push('/check-in-info')}
            style={({ pressed }) => [
              styles.infoRow,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: radii.md,
                padding: spacing.md,
                minHeight: touchTarget.min,
                marginTop: spacing.sm,
              },
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Was ist ein Check-in? Mehr erfahren"
          >
            <AppText variant="body">Was ist ein Check-in?</AppText>
            <AppText variant="body" color="secondary">
              ›
            </AppText>
          </Pressable>
        )}
      </ScrollView>

      <FeedbackModal visible={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listItem: { justifyContent: 'center' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  guidedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  guidedLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
