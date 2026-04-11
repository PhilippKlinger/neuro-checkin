import { Tabs } from 'expo-router';
import { useTheme } from '../../lib/hooks/useTheme';

export default function TabLayout() {
  const { theme, typography } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.lg,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: typography.families.ui.medium,
          fontSize: typography.sizes.xs,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="check-in"
        options={{
          title: 'Check-in',
          tabBarLabel: 'Check-in',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Verlauf',
          tabBarLabel: 'Verlauf',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Einstellungen',
          tabBarLabel: 'Settings',
        }}
      />
    </Tabs>
  );
}
