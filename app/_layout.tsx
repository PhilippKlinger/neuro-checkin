import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../lib/hooks/useTheme';
import { DatabaseProvider, useDatabase, useDatabaseReady } from '../lib/hooks/useDatabase';
import { getSettings, updateSettings } from '../lib/database/settings';
import { ThemeName } from '../lib/constants/themes';
import { REENTRY_THRESHOLD_DAYS } from '../lib/constants/timing';
import { initSentry } from '../lib/observability/sentry';

initSentry();

function AppStack() {
  const { theme, typography, setThemeName, setColorMode } = useTheme();
  const db = useDatabase();
  const isReady = useDatabaseReady();
  const router = useRouter();
  const segments = useSegments();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (!isReady) return;

    async function checkOnboarding() {
      try {
        const settings = await getSettings(db);
        setThemeName(settings.themeName as ThemeName);
        setColorMode(settings.colorMode);

        const today = new Date().toISOString().slice(0, 10);
        const updates: Parameters<typeof updateSettings>[1] = { lastActiveDate: today };

        if (settings.lastActiveDate) {
          const last = new Date(settings.lastActiveDate);
          const daysSince = Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24));
          if (isNaN(daysSince) || daysSince >= REENTRY_THRESHOLD_DAYS) {
            updates.guidedModeEnabled = true;
            updates.guidedToggleIntroduced = false;
          }
        }

        await updateSettings(db, updates);

        if (!settings.onboardingCompleted && segments[0] !== 'onboarding') {
          router.replace('/onboarding');
        }
      } catch (e) {
        Sentry.captureException(e);
      } finally {
        setOnboardingChecked(true);
      }
    }
    checkOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]); // db and router are stable refs; segments intentionally omitted (one-time check on ready)

  if (!onboardingChecked) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen
        name="history/[id]"
        options={{
          headerShown: true,
          title: 'Detail',
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontFamily: typography.families.heading.semibold,
            fontSize: typography.sizes.lg,
          },
        }}
      />
      <Stack.Screen
        name="quick-check-in"
        options={{
          headerShown: true,
          title: 'Schnell-Check-in',
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontFamily: typography.families.heading.semibold,
            fontSize: typography.sizes.lg,
          },
        }}
      />
      <Stack.Screen
        name="check-in-selector"
        options={{
          headerShown: true,
          title: 'Check-in',
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontFamily: typography.families.heading.semibold,
            fontSize: typography.sizes.lg,
          },
        }}
      />
      <Stack.Screen
        name="check-in-info"
        options={{
          headerShown: true,
          title: 'Was ist ein Check-in?',
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontFamily: typography.families.heading.semibold,
            fontSize: typography.sizes.lg,
          },
        }}
      />
    </Stack>
  );
}

function AppContent() {
  const isReady = useDatabaseReady();
  const { resolvedMode } = useTheme();
  if (!isReady) return null;

  return (
    <>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
      <AppStack />
    </>
  );
}

function RootLayout() {
  const router = useRouter();
  const handledNotificationId = useRef<string | null>(null);

  useEffect(() => {
    function handleResponse(response: Notifications.NotificationResponse) {
      if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
      const id = response.notification.request.identifier;
      if (handledNotificationId.current === id) return;
      handledNotificationId.current = id;
      router.navigate('/(tabs)/check-in');
    }

    Notifications.getLastNotificationResponseAsync().then((r) => {
      if (r) handleResponse(r);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // router is a stable ref from expo-router; registering once at mount is intentional

  return (
    <DatabaseProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </DatabaseProvider>
  );
}

export default Sentry.wrap(RootLayout);
