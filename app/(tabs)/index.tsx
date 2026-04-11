import { View, Text, StyleSheet } from 'react-native';
import { themes, DEFAULT_THEME, spacing, typography } from '../../lib/constants/themes';

const theme = themes[DEFAULT_THEME];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Neuro Check-in</Text>
      <Text style={styles.subtitle}>Wie geht es dir gerade?</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
