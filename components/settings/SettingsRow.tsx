import type { ReactNode } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';

interface SettingsRowProps {
  label: string;
  hint?: string;
  onPress?: () => void;
  right?: ReactNode;
  showDivider?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function SettingsRow({
  label,
  hint,
  onPress,
  right,
  showDivider = true,
  disabled = false,
  accessibilityLabel: a11yLabel,
  accessibilityHint: a11yHint,
}: SettingsRowProps) {
  const { theme, spacing, touchTarget } = useTheme();

  const showChevron = onPress && !right;

  return (
    <>
      <Pressable
        onPress={onPress}
        disabled={disabled || !onPress}
        style={({ pressed }) => [
          styles.row,
          {
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            minHeight: touchTarget.min,
            opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel ?? label}
        accessibilityHint={a11yHint}
        accessibilityState={{ disabled }}
      >
        <View style={styles.left}>
          <AppText variant="label">{label}</AppText>
          {hint ? (
            <AppText variant="body" size="sm" color="secondary">
              {hint}
            </AppText>
          ) : null}
        </View>
        <View style={styles.right}>
          {right}
          {showChevron && (
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          )}
        </View>
      </Pressable>
      {showDivider && <View style={[styles.divider, { borderBottomColor: theme.colors.border }]} />}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
    gap: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
});
