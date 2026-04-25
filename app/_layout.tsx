import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../lib/hooks/useTheme';
import { DatabaseProvider, useDatabase, useDatabaseReady } from '../lib/hooks/useDatabase';
import { getSettings } from '../lib/database/settings';
import { ThemeName } from '../lib/constants/themes';
import { SENTRY_DSN } from '../lib/constants/config';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  enabled: !__DEV__,
  tracesSampleRate: 0,
  beforeSend(event) {
    // Strip user identifiers — never collected intentionally
    if (event.user) {
      delete event.user.ip_address;
      delete event.user.email;
    }
    // Strip sensitive check-in health data that may appear in crash contexts
    // (component state, extra fields). The app promises local-only storage.
    const sensitiveKeys = [
      'feelings', 'thoughtsNote', 'selfCareNote', 'innerPart', 'note',
      'draft', 'bodySignals',
    ];
    function scrub(obj: Record<string, unknown>) {
      for (const key of sensitiveKeys) {
        if (key in obj) obj[key] = '[scrubbed]';
      }
    }
    if (event.extra) scrub(event.extra as Record<string, unknown>);
    if (event.contexts) {
      for (const ctx of Object.values(event.contexts)) {
        if (ctx && typeof ctx === 'object') scrub(ctx as Record<string, unknown>);
      }
    }
    return event;
  },
  beforeBreadcrumb(breadcrumb) {
    // Skip console breadcrumbs — they could contain user-entered content
    if (breadcrumb.category === 'console') return null;
    return breadcrumb;
  },
});

function AppStack() {
  const { theme, typography, setThemeName } = useTheme();
  const db = useDatabase();
  const isReady = useDatabaseReady();
  const router = useRouter();
  const segments = useSegments();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (!isReady) return;

    async function checkOnboarding() {
      const settings = await getSettings(db);
      setThemeName(settings.themeName as ThemeName);
      if (!settings.onboardingCompleted && segments[0] !== 'onboarding') {
        router.replace('/onboarding');
      }
      setOnboardingChecked(true);
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
  if (!isReady) return null;

  return (
    <>
      <StatusBar style="dark" />
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
