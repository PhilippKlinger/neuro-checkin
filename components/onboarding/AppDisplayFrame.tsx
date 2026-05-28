import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

interface AppDisplayFrameProps {
  children: React.ReactNode;
}

export function AppDisplayFrame({ children }: AppDisplayFrameProps) {
  const { theme, spacing, shadows } = useTheme();

  return (
    <View
      style={[
        styles.frame,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          marginHorizontal: spacing.lg,
          paddingVertical: 18,
          paddingHorizontal: 14,
        },
        shadows.md,
      ]}
    >
      <View style={[styles.notch, { backgroundColor: theme.colors.border }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  notch: {
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
});
