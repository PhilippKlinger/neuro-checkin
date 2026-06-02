import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';
import { AppTextInput } from '../ui/AppTextInput';

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
  const { theme, spacing, radii, touchTarget } = useTheme();
  return (
    <>
      <AppText variant="title" size="lg" style={{ marginBottom: spacing.sm }}>
        Danke für dein Feedback!
      </AppText>
      <AppText variant="body" color="secondary" style={{ marginBottom: spacing.xl }}>
        Es ist angekommen und wird gelesen.
      </AppText>
      <Pressable
        onPress={onClose}
        style={({ pressed }) => [
          {
            backgroundColor: theme.colors.accent,
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
        <AppText variant="label" weight="semibold" color="inverse">
          Schließen
        </AppText>
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
  const { theme, spacing, radii, touchTarget } = useTheme();
  const isSubmitDisabled = feedbackSubmitting || !feedbackText.trim();

  return (
    <>
      <View style={styles.header}>
        <AppText variant="title" size="lg">
          Feedback
        </AppText>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeButton,
            {
              minWidth: touchTarget.min,
              minHeight: touchTarget.min,
            },
            pressed && { opacity: 0.5 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Dialog schließen"
          hitSlop={8}
        >
          <AppText variant="label" size="lg" color="secondary">
            ✕
          </AppText>
        </Pressable>
      </View>
      <AppText variant="body" size="sm" color="secondary" style={{ marginBottom: spacing.md }}>
        Was fällt dir auf? Nur App-Feedback — nicht zu deinem Befinden, Gefühlen oder
        Check-in-Inhalten.
      </AppText>
      <AppText variant="hint" size="xs" style={{ marginTop: spacing.sm, marginBottom: spacing.md }}>
        Versand über Formspree (externer Dienst). Keine persönlichen Inhalte senden.
      </AppText>
      <AppTextInput
        value={feedbackText}
        onChangeText={onChangeText}
        placeholder="Dein Feedback..."
        placeholderTextColor={theme.colors.textSecondary}
        multiline
        maxLength={500}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: radii.md,
            padding: spacing.md,
          },
        ]}
        accessibilityLabel="Feedback eingeben"
      />
      {feedbackText.length >= 450 && (
        <AppText
          variant="body"
          size="xs"
          color={feedbackText.length >= 500 ? 'success' : 'secondary'}
          style={{ textAlign: 'right', marginTop: spacing.xs }}
        >
          {feedbackText.length >= 500 ? '✓' : `${feedbackText.length} / 500`}
        </AppText>
      )}
      {feedbackError && (
        <AppText variant="body" size="sm" style={{ marginTop: spacing.sm }}>
          Senden hat nicht geklappt. Bitte versuche es später nochmal.
        </AppText>
      )}
      <Pressable
        onPress={onSubmit}
        disabled={isSubmitDisabled}
        style={({ pressed }) => [
          styles.submitButton,
          {
            borderRadius: radii.md,
            padding: spacing.md,
            marginTop: spacing.md,
            backgroundColor: isSubmitDisabled ? theme.colors.border : theme.colors.accent,
          },
          pressed && !isSubmitDisabled && { opacity: 0.75 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={feedbackSubmitting ? 'Sendet...' : 'Feedback senden'}
        accessibilityState={{ disabled: isSubmitDisabled }}
      >
        <AppText variant="label" weight="semibold" color="inverse">
          {feedbackSubmitting ? 'Sendet...' : 'Feedback senden'}
        </AppText>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  submitButton: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
});
