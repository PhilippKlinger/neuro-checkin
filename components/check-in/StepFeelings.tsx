import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

interface StepFeelingsProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function StepFeelings({ value, onValueChange }: StepFeelingsProps) {
  const { theme, spacing, typography, radii } = useTheme();

  return (
    <View style={styles.container}>
      <Text
        style={{
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.xl,
          color: theme.colors.text,
          textAlign: 'center',
          marginBottom: spacing.sm,
        }}
      >
        Gefühle
      </Text>
      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.md,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginBottom: spacing.xl,
        }}
      >
        Welche Gefühle nimmst du gerade wahr?
      </Text>

      <TextInput
        value={value}
        onChangeText={onValueChange}
        placeholder="z.B. müde, angespannt, ruhig, überfordert..."
        placeholderTextColor={theme.colors.textSecondary}
        multiline
        textAlignVertical="top"
        style={[
          styles.textInput,
          {
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.md,
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: radii.md,
            padding: spacing.md,
            lineHeight: typography.sizes.md * 1.5,
          },
        ]}
        accessibilityLabel="Gefühle beschreiben"
      />

      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.xs,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginTop: spacing.md,
          fontStyle: 'italic',
        }}
      >
        Stichworte reichen. Es muss kein ganzer Satz sein.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textInput: {
    minHeight: 120,
    borderWidth: 1,
  },
});
