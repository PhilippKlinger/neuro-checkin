import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../lib/hooks/useTheme';
import { DatabaseProvider } from '../lib/hooks/useDatabase';

function AppStack() {
  const { theme, typography } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
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

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <ThemeProvider>
        <StatusBar style="dark" />
        <AppStack />
      </ThemeProvider>
    </DatabaseProvider>
  );
}
