import { View, Pressable, StyleSheet } from 'react-native';
import { AppText } from '../components/ui/AppText';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/hooks/useTheme';

interface SelectorOption {
  title: string;
  subtitle: string;
  context: string;
  accessibilityLabel: string;
  testID: string;
  onPress: () => void;
}

export default function CheckInSelectorScreen() {
  const { theme, spacing, radii, touchTarget } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const options: SelectorOption[] = [
    {
      title: 'Ich nehme mir kurz Zeit',
      subtitle: '3 Schritte · etwa 2 Minuten — Energie, Fokus, Gefühle',
      context: 'Wenn du gerade wenig Kapazität hast oder es schnell gehen muss.',
      accessibilityLabel:
        'Ich nehme mir kurz Zeit, 3 Schritte, etwa 2 Minuten, Energie, Fokus, Gefühle',
      testID: 'selector-quick-checkin',
      onPress: () => router.replace('/quick-check-in'),
    },
    {
      title: 'Ich nehme mir Zeit',
      subtitle: 'alle 9 Schritte · etwa 5 Minuten — Körper, Gefühle, Stress, Gedanken',
      context: 'Wenn du dir bewusst Zeit nimmst und tiefer hinschauen möchtest.',
      accessibilityLabel:
        'Ich nehme mir Zeit, alle 9 Schritte, etwa 5 Minuten, Körper, Gefühle, Stress, Gedanken',
      testID: 'selector-full-checkin',
      onPress: () => router.replace('/(tabs)/check-in'),
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
      <AppText
        variant="title"
        size="xl"
        accessibilityRole="header"
        style={{ textAlign: 'center', marginTop: spacing.xxl, marginBottom: spacing.xl }}
      >
        Wie viel Raum hast du gerade?
      </AppText>

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
            testID={option.testID}
            accessibilityRole="button"
            accessibilityLabel={option.accessibilityLabel}
            accessibilityHint="Tippen zum Starten"
          >
            <AppText variant="title" style={{ marginBottom: spacing.xs }}>
              {option.title}
            </AppText>
            <AppText variant="body" size="sm" color="secondary">
              {option.subtitle}
            </AppText>
            <AppText variant="hint" style={{ marginTop: spacing.xs }}>
              {option.context}
            </AppText>
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
