import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

interface TutorialHintProps {
  text: string;
}

export function TutorialHint({ text }: TutorialHintProps) {
  const { theme, spacing, typography, radii } = useTheme();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: radii.md,
          borderLeftWidth: 3,
          borderLeftColor: theme.colors.primarySoft,
          padding: spacing.md,
          marginBottom: spacing.md,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={`Hinweis: ${text}`}
    >
      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.sm,
          color: theme.colors.textSecondary,
          lineHeight: typography.sizes.sm * 1.5,
          flex: 1,
        }}
      >
        {text}
      </Text>
      <Pressable
        onPress={() => setDismissed(true)}
        style={[
          styles.dismissButton,
          {
            marginTop: spacing.sm,
            paddingVertical: spacing.xs,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Hinweis schließen"
      >
        <Text
          style={{
            fontFamily: typography.families.ui.medium,
            fontSize: typography.sizes.xs,
            color: theme.colors.primary,
          }}
        >
          Verstanden
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  dismissButton: {
    alignSelf: 'flex-end',
  },
});
