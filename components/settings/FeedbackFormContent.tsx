import { useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

interface FeedbackFormContentProps {
  feedbackText: string;
  onChangeText: (text: string) => void;
  feedbackError: boolean;
  feedbackSubmitting: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

interface FeedbackSuccessContentProps {
  onClose: () => void;
}

export function FeedbackSuccessContent({ onClose }: FeedbackSuccessContentProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
  return (
    <>
      <Text
        style={{
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.lg,
          color: theme.colors.text,
          marginBottom: spacing.sm,
        }}
      >
        Danke für dein Feedback!
      </Text>
      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.md,
          color: theme.colors.textSecondary,
          marginBottom: spacing.xl,
        }}
      >
        Es ist angekommen und wird gelesen.
      </Text>
      <Pressable
        onPress={onClose}
        style={({ pressed }) => [
          {
            backgroundColor: theme.colors.primary,
            borderRadius: radii.md,
            padding: spacing.md,
            alignItems: 'center',
            minHeight: touchTarget.min,
            justifyContent: 'center',
          },
          pressed && { opacity: 0.75 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Schließen"
      >
        <Text
          style={{
            fontFamily: typography.families.ui.semibold,
            fontSize: typography.sizes.md,
            color: theme.colors.textInverse,
          }}
        >
          Schließen
        </Text>
      </Pressable>
    </>
  );
}

export function FeedbackFormContent({
  feedbackText,
  onChangeText,
  feedbackError,
  feedbackSubmitting,
  onSubmit,
  onClose,
}: FeedbackFormContentProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
  const isSubmitDisabled = feedbackSubmitting || !feedbackText.trim();

  const s = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm,
        },
        closeButton: {
          minWidth: touchTarget.min,
          minHeight: touchTarget.min,
          alignItems: 'center',
          justifyContent: 'center',
        },
        closeText: {
          fontFamily: typography.families.ui.medium,
          fontSize: typography.sizes.lg,
          color: theme.colors.textSecondary,
        },
        subtitle: {
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.sm,
          color: theme.colors.textSecondary,
          marginBottom: spacing.md,
        },
        input: {
          borderWidth: 1,
          textAlignVertical: 'top',
          minHeight: 120,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: radii.md,
          padding: spacing.md,
          color: theme.colors.text,
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.md,
        },
        charCount: {
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.xs,
          color: theme.colors.textSecondary,
          textAlign: 'right',
          marginTop: spacing.xs,
        },
        errorText: {
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.sm,
          color: theme.colors.text,
          marginTop: spacing.sm,
        },
        privacyHint: {
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.xs,
          color: theme.colors.textSecondary,
          marginTop: spacing.sm,
          marginBottom: spacing.md,
          fontStyle: 'italic',
        },
        submitButton: {
          borderRadius: radii.md,
          padding: spacing.md,
          alignItems: 'center',
          minHeight: touchTarget.min,
          justifyContent: 'center',
        },
        submitText: {
          fontFamily: typography.families.ui.semibold,
          fontSize: typography.sizes.md,
          color: theme.colors.textInverse,
        },
      }),
    [theme, spacing, typography, radii, touchTarget]
  );

  return (
    <>
      <View style={s.header}>
        <Text
          style={{
            fontFamily: typography.families.heading.semibold,
            fontSize: typography.sizes.lg,
            color: theme.colors.text,
          }}
        >
          Feedback
        </Text>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [s.closeButton, pressed && { opacity: 0.5 }]}
          accessibilityRole="button"
          accessibilityLabel="Dialog schließen"
          hitSlop={8}
        >
          <Text style={s.closeText}>✕</Text>
        </Pressable>
      </View>
      <Text style={s.subtitle}>
        Was hat geholfen, was stört, was fehlt? Bitte nur App-Feedback — nicht zu deinem Befinden,
        Gefühlen oder Check-in-Inhalten.
      </Text>
      <Text style={s.privacyHint}>
        Bitte keine persönlichen Inhalte senden. Mit dem Absenden überträgst du deinen Text über
        Formspree (externer Dienst, EU-Datenschutz).
      </Text>
      <TextInput
        value={feedbackText}
        onChangeText={onChangeText}
        placeholder="Dein Feedback..."
        placeholderTextColor={theme.colors.textSecondary}
        multiline
        maxLength={500}
        style={s.input}
        accessibilityLabel="Feedback eingeben"
      />
      {feedbackText.length >= 450 && (
        <Text
          style={[s.charCount, feedbackText.length >= 500 ? { color: theme.colors.success } : {}]}
        >
          {feedbackText.length >= 500 ? '✓' : `${feedbackText.length} / 500`}
        </Text>
      )}
      {feedbackError && (
        <Text style={s.errorText}>
          Senden hat nicht geklappt. Bitte versuche es später nochmal.
        </Text>
      )}
      <Pressable
        onPress={onSubmit}
        disabled={isSubmitDisabled}
        style={({ pressed }) => [
          s.submitButton,
          { backgroundColor: isSubmitDisabled ? theme.colors.border : theme.colors.primary },
          pressed && !isSubmitDisabled && { opacity: 0.75 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={feedbackSubmitting ? 'Sendet...' : 'Feedback senden'}
        accessibilityState={{ disabled: isSubmitDisabled }}
      >
        <Text style={s.submitText}>{feedbackSubmitting ? 'Sendet...' : 'Feedback senden'}</Text>
      </Pressable>
    </>
  );
}
