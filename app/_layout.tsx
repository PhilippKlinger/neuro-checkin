import { useEffect, useState } from 'react';
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
  return (
    <DatabaseProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </DatabaseProvider>
  );
}
