import { Pressable } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/hooks/useTheme';

function CheckInInfoButton({ color }: { color: string }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/check-in-info')}
      style={{ marginRight: 16, padding: 4 }}
      accessibilityRole="button"
      accessibilityLabel="Hilfe: Was ist ein Check-in?"
    >
      <Ionicons name="help-circle-outline" size={26} color={color} />
    </Pressable>
  );
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  'check-in': { active: 'add-circle', inactive: 'add-circle-outline' },
  history: { active: 'time', inactive: 'time-outline' },
  settings: { active: 'settings', inactive: 'settings-outline' },
};

export default function TabLayout() {
  const { theme, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.lg,
        },
        headerTitleContainerStyle: {
          paddingLeft: spacing.sm,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          paddingBottom: insets.bottom + 4,
          height: 56 + insets.bottom,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: typography.families.ui.medium,
          fontSize: typography.sizes.xs,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = icons ? (focused ? icons.active : icons.inactive) : 'ellipse-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Heute',
          tabBarLabel: 'Heute',
          tabBarAccessibilityLabel: 'Heute',
          headerRight: () => <CheckInInfoButton color={theme.colors.textSecondary} />,
        }}
      />
      <Tabs.Screen
        name="check-in"
        options={{
          title: 'Check-in',
          tabBarLabel: 'Check-in',
          tabBarAccessibilityLabel: 'Check-in starten',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Verlauf',
          tabBarLabel: 'Verlauf',
          tabBarAccessibilityLabel: 'Check-in Verlauf',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Einstellungen',
          tabBarLabel: 'Einstellungen',
          tabBarAccessibilityLabel: 'Einstellungen',
        }}
      />
    </Tabs>
  );
}
