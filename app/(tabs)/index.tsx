import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

export default function HomeScreen() {
  const { theme, spacing, typography } = useTheme();
  const styles = makeStyles(theme, spacing, typography);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Neuro Check-in</Text>
      <Text style={styles.subtitle}>Wie geht es dir gerade?</Text>
    </View>
  );
}

function makeStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography']
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    title: {
      fontFamily: typography.families.heading.bold,
      fontSize: typography.sizes.xxl,
      color: theme.colors.text,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontFamily: typography.families.body.regular,
      fontSize: typography.sizes.md,
      color: theme.colors.textSecondary,
    },
  });
}
