import { useState, useCallback, useRef } from 'react';
import { ScrollView, Switch, StyleSheet, Platform, View, Linking } from 'react-native';
import { AppText } from '../../components/ui/AppText';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { getSettings, updateSettings } from '../../lib/database/settings';
import { countCheckIns } from '../../lib/database/checkins';
import { countUserChipsByCategory } from '../../lib/database/userChips';
import { getNotificationSlots, saveNotificationSlot } from '../../lib/database/notificationQueries';
import { ThemeName, ColorMode } from '../../lib/constants/themes';
import { AppearanceModeSection } from '../../components/settings/AppearanceModeSection';
import {
  requestNotificationPermission,
  scheduleSingleSlot,
  cancelSingleSlot,
  scheduleAllSlots,
} from '../../lib/notifications/notifications';
import {
  type FontFamily,
  type NotificationSlot,
  ALL_WEEKDAYS,
  WEEKDAY_BITS,
} from '../../lib/types/checkin';
import { ThemeSection } from '../../components/settings/ThemeSection';
import { FontSection } from '../../components/settings/FontSection';
import { NotificationsSection } from '../../components/settings/NotificationsSection';
import { DataSection } from '../../components/settings/DataSection';
import { FeedbackModal } from '../../components/settings/FeedbackModal';
import { SettingsGroup } from '../../components/settings/SettingsGroup';
import { SettingsRow } from '../../components/settings/SettingsRow';
import { dateToTimeString } from '../../lib/utils/time';

const DEFAULT_SLOTS: NotificationSlot[] = [
  { id: 0, enabled: false, time: '09:00', weekdays: ALL_WEEKDAYS },
  { id: 1, enabled: false, time: '20:00', weekdays: ALL_WEEKDAYS },
];

export default function SettingsScreen() {
  const {
    theme,
    themeName,
    colorMode,
    fontFamily,
    setThemeName,
    setColorMode,
    setFontFamily,
    spacing,
  } = useTheme();
  const db = useDatabase();
  const router = useRouter();

  const [slots, setSlots] = useState<NotificationSlot[]>(DEFAULT_SLOTS);
  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  const lastScheduledSlotsRef = useRef<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState<0 | 1 | null>(null);
  const [isEmulator, setIsEmulator] = useState(false);
  const [checkInCount, setCheckInCount] = useState(0);
  const [chipCountFeelings, setChipCountFeelings] = useState(0);
  const [chipCountSelfCare, setChipCountSelfCare] = useState(0);
  const [guidedMode, setGuidedMode] = useState(false);
  const [reflectionEnabled, setReflectionEnabled] = useState(true);
  const [, setNotificationPermission] = useState<boolean | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [exportDirectoryUri, setExportDirectoryUri] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        try {
          const settings = await getSettings(db);
          if (cancelled) return;
          setThemeName(settings.themeName as ThemeName);
          setColorMode(settings.colorMode);
          setFontFamily(settings.fontFamily);
          setIsEmulator(!Device.isDevice);

          if (Device.isDevice) {
            const { status } = await Notifications.getPermissionsAsync();
            if (cancelled) return;
            setNotificationPermission(status === 'granted');
          }

          const dbSlots = await getNotificationSlots(db);
          if (cancelled) return;
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

          if (cancelled) return;
          setGuidedMode(settings.guidedModeEnabled);
          setReflectionEnabled(settings.reflectionEnabled);
          setExportDirectoryUri(settings.exportDirectoryUri);

          const count = await countCheckIns(db);
          if (cancelled) return;
          setCheckInCount(count);
          const [feelings, selfCare] = await Promise.all([
            countUserChipsByCategory(db, 'feelings'),
            countUserChipsByCategory(db, 'self_care'),
          ]);
          if (cancelled) return;
          setChipCountFeelings(feelings);
          setChipCountSelfCare(selfCare);
        } catch (e) {
          Sentry.withScope((scope) => {
            scope.setTag('screen', 'settings');
            scope.setTag('action', 'loadSettings');
            Sentry.captureException(e);
          });
        }
      }
      load();
      return () => {
        cancelled = true;
      };
    }, [db, setThemeName, setColorMode, setFontFamily])
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
      const previous = slotsRef.current;
      const updatedSlots = previous.map((s) => (s.id === slotId ? { ...s, enabled: value } : s));
      setSlots(updatedSlots);
      try {
        const updated = updatedSlots.find((s) => s.id === slotId)!;
        await saveNotificationSlot(db, updated);
        if (Device.isDevice) {
          if (value) await scheduleSingleSlot(updated);
          else await cancelSingleSlot(slotId);
        }
      } catch (error) {
        console.error('handleSlotToggle failed:', error);
        setSlots(previous);
        Sentry.withScope((scope) => {
          scope.setTag('action', 'slotToggle');
          Sentry.captureException(error);
        });
      }
    },
    [db]
  );

  const handleTimeChange = useCallback(
    async (slotId: 0 | 1, _event: DateTimePickerEvent, selected?: Date) => {
      if (Platform.OS === 'android') setShowTimePicker(null);
      if (!selected) return;
      const previous = slotsRef.current;
      const time = dateToTimeString(selected);
      const updatedSlots = previous.map((s) => (s.id === slotId ? { ...s, time } : s));
      setSlots(updatedSlots);
      try {
        const updated = updatedSlots.find((s) => s.id === slotId)!;
        await saveNotificationSlot(db, updated);
        if (updated.enabled && Device.isDevice) await scheduleSingleSlot(updated);
      } catch (error) {
        console.error('handleTimeChange failed:', error);
        setSlots(previous);
        Sentry.withScope((scope) => {
          scope.setTag('action', 'timeChange');
          Sentry.captureException(error);
        });
      }
    },
    [db]
  );

  const handleWeekdayToggle = useCallback(
    async (slotId: 0 | 1, bitIndex: number) => {
      const previous = slotsRef.current;
      const bit = WEEKDAY_BITS[bitIndex];
      const updatedSlots = previous.map((s) => {
        if (s.id !== slotId) return s;
        const newWeekdays = s.weekdays & bit ? s.weekdays & ~bit : s.weekdays | bit;
        if (newWeekdays === 0) return s;
        return { ...s, weekdays: newWeekdays };
      });
      setSlots(updatedSlots);
      try {
        const updated = updatedSlots.find((s) => s.id === slotId)!;
        await saveNotificationSlot(db, updated);
        if (updated.enabled && Device.isDevice) await scheduleSingleSlot(updated);
      } catch (error) {
        console.error('handleWeekdayToggle failed:', error);
        setSlots(previous);
        Sentry.withScope((scope) => {
          scope.setTag('action', 'weekdayToggle');
          Sentry.captureException(error);
        });
      }
    },
    [db]
  );

  const handleModeChange = useCallback(
    async (mode: ColorMode) => {
      const previous = colorMode;
      setColorMode(mode);
      try {
        await updateSettings(db, { colorMode: mode });
      } catch (error) {
        console.error('updateSettings colorMode failed:', error);
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
      } catch (error) {
        console.error('updateSettings themeName failed:', error);
        setThemeName(previous);
      }
    },
    [db, themeName, setThemeName]
  );

  const handleFontChange = useCallback(
    async (name: FontFamily) => {
      const previous = fontFamily;
      setFontFamily(name);
      try {
        await updateSettings(db, { fontFamily: name });
      } catch (error) {
        console.error('updateSettings fontFamily failed:', error);
        setFontFamily(previous);
      }
    },
    [db, fontFamily, setFontFamily]
  );

  const handleGuidedModeToggle = useCallback(
    async (value: boolean) => {
      setGuidedMode(value);
      try {
        await updateSettings(db, { guidedModeEnabled: value });
      } catch (e) {
        // Keep the optimistic value rather than rolling back — a transient
        // prepareAsync write error must not make the toggle snap back. The next
        // getSettings reconciles the stored value.
        Sentry.withScope((scope) => {
          scope.setTag('screen', 'settings');
          scope.setTag('action', 'guidedModeToggle');
          Sentry.captureException(e);
        });
      }
    },
    [db]
  );

  const handleReflectionToggle = useCallback(
    async (value: boolean) => {
      const previous = reflectionEnabled;
      setReflectionEnabled(value);
      try {
        await updateSettings(db, { reflectionEnabled: value });
      } catch (e) {
        Sentry.withScope((scope) => {
          scope.setTag('screen', 'settings');
          scope.setTag('action', 'reflectionToggle');
          Sentry.captureException(e);
        });
        setReflectionEnabled(previous);
      }
    },
    [db, reflectionEnabled]
  );

  const handleTimePress = useCallback((id: 0 | 1) => setShowTimePicker(id), []);

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
      >
        {/* --- Aussehen --- */}
        <SettingsGroup title="Aussehen">
          <View style={{ padding: spacing.sm }}>
            <AppText
              variant="label"
              style={{ paddingHorizontal: spacing.xs, marginBottom: spacing.xs }}
            >
              Modus
            </AppText>
            <AppearanceModeSection
              currentMode={colorMode}
              onModeChange={handleModeChange}
              hideTitle
            />
          </View>
          <View style={[styles.divider, { borderBottomColor: theme.colors.border }]} />
          <View style={{ padding: spacing.sm }}>
            <AppText
              variant="label"
              style={{ paddingHorizontal: spacing.xs, marginBottom: spacing.xs }}
            >
              Farbpalette
            </AppText>
            <ThemeSection currentTheme={themeName} onThemeChange={handleThemeChange} hideTitle />
          </View>
          <View style={[styles.divider, { borderBottomColor: theme.colors.border }]} />
          <View style={{ padding: spacing.sm }}>
            <AppText
              variant="label"
              style={{ paddingHorizontal: spacing.xs, marginBottom: spacing.xs }}
            >
              Schriftart
            </AppText>
            <FontSection currentFont={fontFamily} onFontChange={handleFontChange} hideTitle />
          </View>
        </SettingsGroup>

        {/* --- Erinnerungen --- */}
        <View style={{ marginBottom: spacing.lg }}>
          <AppText
            variant="label"
            size="sm"
            color="secondary"
            style={[styles.sectionTitle, { marginBottom: spacing.sm, paddingLeft: spacing.xs }]}
            accessibilityRole="header"
          >
            Erinnerungen
          </AppText>
          <NotificationsSection
            slots={slots}
            showTimePicker={showTimePicker}
            isEmulator={isEmulator}
            hideTitle
            onToggle={handleSlotToggle}
            onTimePress={handleTimePress}
            onTimeChange={handleTimeChange}
            onWeekdayToggle={handleWeekdayToggle}
          />
        </View>

        {/* --- Check-in --- */}
        <SettingsGroup title="Check-in">
          <SettingsRow
            label="Hilfe im Check-in"
            hint="Erklärungen wenn du sie brauchst"
            right={
              <Switch
                value={guidedMode}
                onValueChange={handleGuidedModeToggle}
                trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                thumbColor={theme.colors.background}
                accessibilityRole="switch"
                accessibilityLabel="Hilfe im Check-in"
                accessibilityHint="Zeigt Mini-Erklärungen in einzelnen Schritten"
                accessibilityState={{ checked: guidedMode }}
              />
            }
          />
          <SettingsRow
            label="Deine Muster"
            hint="Zeigt, was sich in deinen letzten Check-ins wiederholt"
            showDivider={false}
            right={
              <Switch
                value={reflectionEnabled}
                onValueChange={handleReflectionToggle}
                trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                thumbColor={theme.colors.background}
                accessibilityRole="switch"
                accessibilityLabel="Deine Muster auf Home anzeigen"
                accessibilityHint="Zeigt, was sich in deinen letzten Check-ins wiederholt"
                accessibilityState={{ checked: reflectionEnabled }}
              />
            }
          />
        </SettingsGroup>

        {/* --- Daten --- */}
        <View style={{ marginBottom: spacing.lg }}>
          <AppText
            variant="label"
            size="sm"
            color="secondary"
            style={[styles.sectionTitle, { marginBottom: spacing.sm, paddingLeft: spacing.xs }]}
            accessibilityRole="header"
          >
            Daten
          </AppText>
          <DataSection
            db={db}
            checkInCount={checkInCount}
            chipCount={chipCountFeelings + chipCountSelfCare}
            chipCountFeelings={chipCountFeelings}
            chipCountSelfCare={chipCountSelfCare}
            exportDirectoryUri={exportDirectoryUri}
            onDeleteComplete={() => setCheckInCount(0)}
            onChipsDeleteComplete={async () => {
              const [f, s] = await Promise.all([
                countUserChipsByCategory(db, 'feelings'),
                countUserChipsByCategory(db, 'self_care'),
              ]);
              setChipCountFeelings(f);
              setChipCountSelfCare(s);
            }}
            onExportDirectoryChanged={setExportDirectoryUri}
          />
        </View>

        {/* --- Info --- */}
        <SettingsGroup title="Info">
          <SettingsRow
            label="Was ist ein Check-in?"
            onPress={() => router.push('/check-in-info')}
          />
          <SettingsRow
            label="Feedback senden"
            onPress={() => setShowFeedbackModal(true)}
            accessibilityHint="Öffnet ein Feedback-Formular"
          />
          <SettingsRow
            label="Datenschutzerklärung"
            onPress={() => Linking.openURL('https://neurocheckin.de/datenschutz')}
            showDivider={false}
            accessibilityHint="Öffnet die Datenschutzerklärung im Browser"
          />
        </SettingsGroup>

        <AppText
          variant="body"
          size="sm"
          color="secondary"
          style={{ textAlign: 'center', marginTop: spacing.sm }}
        >
          Neuro Check-in · v{Constants.expoConfig?.version ?? '?'}
        </AppText>
      </ScrollView>

      <FeedbackModal visible={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
