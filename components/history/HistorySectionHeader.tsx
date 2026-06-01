import { View, StyleSheet } from 'react-native';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../lib/hooks/useTheme';

interface HistorySectionHeaderProps {
  title: string;
}

export function HistorySectionHeader({ title }: HistorySectionHeaderProps) {
  const { theme, spacing } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingVertical: spacing.xs },
      ]}
      accessibilityRole="header"
    >
      <AppText variant="label" size="xs" color="secondary" style={styles.title}>
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  title: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
