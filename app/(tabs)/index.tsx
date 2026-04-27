import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/hooks/useTheme';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Guten Morgen';
  if (hour >= 12 && hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}

export default function HomeScreen() {
  const { theme, spacing, typography, radii } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, padding: spacing.lg }]}>
      <View style={styles.hero}>
        <Text
          style={{
            fontFamily: typography.families.heading.semibold,
            fontSize: typography.sizes.xl,
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: spacing.xxl,
          }}
          accessibilityRole="header"
        >
          {getGreeting()}
        </Text>

        <Pressable
          onPress={() => router.push('/check-in-selector')}
          style={({ pressed }) => [
            styles.cta,
            {
              borderRadius: radii.md,
              backgroundColor: theme.colors.primary,
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.lg,
            },
            pressed && { opacity: 0.75 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Beginnen, Tiefe wählen"
        >
          <Text
            style={{
              fontFamily: typography.families.ui.semibold,
              fontSize: typography.sizes.lg,
              color: theme.colors.textInverse,
            }}
          >
            Beginnen
          </Text>
        </Pressable>
      </View>

      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.xs,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginTop: spacing.xl,
        }}
      >
        Lokal gespeichert · kein Therapieersatz
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  cta: {
    alignItems: 'center',
  },
});
