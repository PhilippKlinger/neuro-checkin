import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../lib/hooks/useTheme';
import { DatabaseProvider } from '../lib/hooks/useDatabase';

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <ThemeProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </DatabaseProvider>
  );
}
