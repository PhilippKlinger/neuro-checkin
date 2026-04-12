import { useState, useCallback } from 'react';
import { View, Text, Switch, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { getSettings, updateSettings } from '../../lib/database/settings';
import { themes, ThemeName } from '../../lib/constants/themes';

const THEME_OPTIONS: { key: ThemeName; label: string }[] = [
  { key: 'warmEarth', label: 'Warm Earth' },
  { key: 'coolMist', label: 'Cool Mist' },
  { key: 'softSage', label: 'Soft Sage' },
];

export default function SettingsScreen() {
  const { theme, themeName, setThemeName, spacing, typography, radii, touchTarget } =
    useTheme();
  const db = useDatabase();
  const [reminderEnabled, setReminderEnabled] = useState(false);
  useFocusEffect(
    useCallback(() => {
      async function load() {
        const settings = await getSettings(db);
        setReminderEnabled(settings.reminderEnabled);
        if (settings.themeName !== themeName) {
          setThemeName(settings.themeName as ThemeName);
        }
      }
      load();
    }, [db])
  );

  async function handleReminderToggle(value: boolean) {
    setReminderEnabled(value);
    await updateSettings(db, { reminderEnabled: value });
  }

  async function handleThemeChange(name: ThemeName) {
    setThemeName(name);
    await updateSettings(db, { themeName: name });
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
    >
      {/* Theme Selection */}
      <Text
        style={{
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.lg,
          color: theme.colors.text,
          marginBottom: spacing.md,
        }}
      >
        Farbpalette
      </Text>

      <View style={[styles.themeGrid, { gap: spacing.sm, marginBottom: spacing.xl }]}>
        {THEME_OPTIONS.map((option) => {
          const palette = themes[option.key];
          const isSelected = themeName === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => handleThemeChange(option.key)}
              style={[
                styles.themeCard,
                {
                  borderRadius: radii.md,
                  padding: spacing.md,
                  backgroundColor: palette.colors.surface,
                  borderWidth: 2,
                  borderColor: isSelected
                    ? palette.colors.primary
                    : palette.colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Farbpalette ${option.label}`}
              accessibilityState={{ selected: isSelected }}
            >
              <View style={[styles.colorPreview, { gap: spacing.xs, marginBottom: spacing.sm }]}>
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: palette.colors.primary, borderRadius: radii.full },
                  ]}
                />
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: palette.colors.accent, borderRadius: radii.full },
                  ]}
                />
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: palette.colors.background, borderRadius: radii.full, borderWidth: 1, borderColor: palette.colors.border },
                  ]}
                />
              </View>
              <Text
                style={{
                  fontFamily: typography.families.ui.medium,
                  fontSize: typography.sizes.sm,
                  color: palette.colors.text,
                  textAlign: 'center',
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Reminder */}
      <Text
        style={{
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.lg,
          color: theme.colors.text,
          marginBottom: spacing.md,
        }}
      >
        Erinnerung
      </Text>

      <View
        style={[
          styles.settingRow,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: radii.md,
            padding: spacing.md,
            minHeight: touchTarget.min,
          },
        ]}
      >
        <View style={styles.settingTextWrapper}>
          <Text
            style={{
              fontFamily: typography.families.ui.medium,
              fontSize: typography.sizes.md,
              color: theme.colors.text,
            }}
          >
            Tägliche Erinnerung
          </Text>
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.sm,
              color: theme.colors.textSecondary,
            }}
          >
            {reminderEnabled
              ? 'Du wirst einmal täglich erinnert'
              : 'Keine Erinnerung aktiv'}
          </Text>
        </View>
        <Switch
          value={reminderEnabled}
          onValueChange={handleReminderToggle}
          trackColor={{
            false: theme.colors.border,
            true: theme.colors.primarySoft,
          }}
          thumbColor={
            reminderEnabled ? theme.colors.primary : theme.colors.surface
          }
          accessibilityLabel="Tägliche Erinnerung"
          accessibilityRole="switch"
        />
      </View>

      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.xs,
          color: theme.colors.textSecondary,
          marginTop: spacing.sm,
          fontStyle: 'italic',
        }}
      >
        Push-Notifications werden in einer späteren Version hinzugefügt.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeGrid: {
    flexDirection: 'row',
  },
  themeCard: {
    flex: 1,
    alignItems: 'center',
  },
  colorPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  colorDot: {
    width: 16,
    height: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTextWrapper: {
    flex: 1,
  },
});
