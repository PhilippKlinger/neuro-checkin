import { View, Text, StyleSheet } from 'react-native';
import { themes, DEFAULT_THEME, spacing, typography } from '../../lib/constants/themes';

const theme = themes[DEFAULT_THEME];

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Einstellungen</Text>
      <Text style={styles.subtitle}>Passe die App an deine Beduerfnisse an.</Text>
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
    fontSize: typography.sizes.xl,
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.families.body.regular,
    fontSize: typography.sizes.md,
    color: theme.colors.textSecondary,
  },
});
