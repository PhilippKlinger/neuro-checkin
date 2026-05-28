import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';

interface SettingsGroupProps {
  title: string;
  children: ReactNode;
}

export function SettingsGroup({ title, children }: SettingsGroupProps) {
  const { theme, spacing, radii, shadows } = useTheme();

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <AppText
        variant="label"
        size="sm"
        color="secondary"
        style={[styles.title, { marginBottom: spacing.sm, paddingLeft: spacing.xs }]}
        accessibilityRole="header"
      >
        {title}
      </AppText>
      <View
        style={{
          backgroundColor: theme.colors.card,
          borderRadius: radii.md,
          overflow: 'hidden',
          ...shadows.sm,
        }}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
