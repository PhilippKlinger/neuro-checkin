import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../lib/hooks/useTheme';
import { DatabaseProvider, useDatabase, useDatabaseReady } from '../lib/hooks/useDatabase';
import { getSettings } from '../lib/database/settings';
import { ThemeName } from '../lib/constants/themes';

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

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
          router.push('/(tabs)/check-in');
        }
      }
    );
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
