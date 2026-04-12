import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

interface StepSelfCareProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function StepSelfCare({ value, onValueChange }: StepSelfCareProps) {
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
        Selbstfürsorge
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
        Was brauchst du gerade? Was würde dir jetzt gut tun?
      </Text>

      <TextInput
        value={value}
        onChangeText={onValueChange}
        placeholder="z.B. Pause, Wasser trinken, Bewegung, Ruhe..."
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
        accessibilityLabel="Selbstfürsorge-Notiz"
      />

      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.xs,
          color: theme.colors.primarySoft,
          textAlign: 'center',
          marginTop: spacing.lg,
          fontStyle: 'italic',
        }}
      >
        Auch kleine Dinge zählen. Du darfst Bedürfnisse haben.
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
