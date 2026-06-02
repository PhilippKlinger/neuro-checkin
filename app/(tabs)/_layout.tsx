import { Pressable, StyleSheet, Text } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/hooks/useTheme';

function CheckInInfoButton({ color }: { color: string }) {
  const router = useRouter();
  const { touchTarget } = useTheme();
  return (
    <Pressable
      onPress={() => router.push('/check-in-info')}
      style={[styles.helpButton, { minWidth: touchTarget.min, minHeight: touchTarget.min }]}
      accessibilityRole="button"
      accessibilityLabel="Hilfe: Was ist ein Check-in?"
    >
      <Ionicons name="help-circle-outline" size={26} color={color} />
    </Pressable>
  );
}

function TabLabel({
  label,
  color,
  fontFamily,
}: {
  label: string;
  color: string;
  fontFamily: string;
}) {
  return (
    <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={{ fontFamily, fontSize: 12, color }}>
      {label}
    </Text>
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
  const router = useRouter();

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
          title: 'Übersicht',
          tabBarLabel: ({ color }) => (
            <TabLabel label="Übersicht" color={color} fontFamily={typography.families.ui.medium} />
          ),
          tabBarAccessibilityLabel: 'Übersicht',
          headerRight: () => <CheckInInfoButton color={theme.colors.textSecondary} />,
        }}
      />
      <Tabs.Screen
        name="check-in"
        options={{
          title: 'Check-in',
          tabBarLabel: ({ color }) => (
            <TabLabel label="Check-in" color={color} fontFamily={typography.families.ui.medium} />
          ),
          tabBarAccessibilityLabel: 'Check-in starten',
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/check-in-selector');
          },
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Verlauf',
          tabBarLabel: ({ color }) => (
            <TabLabel label="Verlauf" color={color} fontFamily={typography.families.ui.medium} />
          ),
          tabBarAccessibilityLabel: 'Check-in Verlauf',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Einstellungen',
          tabBarLabel: ({ color }) => (
            <TabLabel
              label="Einstellungen"
              color={color}
              fontFamily={typography.families.ui.medium}
            />
          ),
          tabBarAccessibilityLabel: 'Einstellungen',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  helpButton: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
