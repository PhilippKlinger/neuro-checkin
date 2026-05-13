import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

interface GuidedToggleProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  showIntroHint: boolean;
}

export function GuidedToggle({ enabled, onToggle, showIntroHint }: GuidedToggleProps) {
  const { theme, spacing, typography } = useTheme();

  return (
    <View style={[styles.container, { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }]}>
      <View style={[styles.row, { gap: spacing.sm }]}>
        <Text
          style={{
            fontFamily: typography.families.ui.medium,
            fontSize: typography.sizes.sm,
            color: theme.colors.textSecondary,
          }}
        >
          Hinweise
        </Text>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
          thumbColor={theme.colors.background}
          accessibilityRole="switch"
          accessibilityLabel="Hinweise"
          accessibilityState={{ checked: enabled }}
        />
      </View>

      {showIntroHint && (
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.xs,
            color: theme.colors.textSecondary,
            fontStyle: 'italic',
            marginTop: spacing.xs,
            textAlign: 'center',
          }}
        >
          Hinweise an/aus — jederzeit umschaltbar
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
