import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/hooks/useTheme';

interface SelectorOption {
  title: string;
  subtitle: string;
  accessibilityLabel: string;
  onPress: () => void;
}

export default function CheckInSelectorScreen() {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const options: SelectorOption[] = [
    {
      title: 'Ich nehme mir Zeit',
      subtitle: 'alle 8 Schritte · etwa 5 Minuten',
      accessibilityLabel: 'Ich nehme mir Zeit, alle 8 Schritte, etwa 5 Minuten',
      onPress: () => router.replace('/(tabs)/check-in'),
    },
    {
      title: 'Ich nehme mir kurz Zeit',
      subtitle: '3 Schritte · etwa 2 Minuten',
      accessibilityLabel: 'Ich nehme mir kurz Zeit, 3 Schritte, etwa 2 Minuten',
      onPress: () => router.replace('/quick-check-in'),
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          padding: spacing.lg,
          paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.md),
        },
      ]}
    >
      <Text
        style={{
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.xl,
          color: theme.colors.text,
          textAlign: 'center',
          marginTop: spacing.xxl,
          marginBottom: spacing.xl,
        }}
        accessibilityRole="header"
      >
        Wie viel Raum hast du gerade?
      </Text>

      <View style={[styles.options, { gap: spacing.md }]}>
        {options.map((option) => (
          <Pressable
            key={option.title}
            onPress={option.onPress}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: radii.md,
                padding: spacing.lg,
                minHeight: touchTarget.min,
              },
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={option.accessibilityLabel}
          >
            <Text
              style={{
                fontFamily: typography.families.heading.semibold,
                fontSize: typography.sizes.lg,
                color: theme.colors.text,
                marginBottom: spacing.xs,
              }}
            >
              {option.title}
            </Text>
            <Text
              style={{
                fontFamily: typography.families.body.regular,
                fontSize: typography.sizes.sm,
                color: theme.colors.textSecondary,
                lineHeight: typography.sizes.sm * 1.5,
              }}
            >
              {option.subtitle}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  options: {
    flexDirection: 'column',
  },
  card: {
    justifyContent: 'center',
  },
});
