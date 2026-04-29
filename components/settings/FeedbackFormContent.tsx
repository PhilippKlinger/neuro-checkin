import { useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

interface FeedbackFormContentProps {
  feedbackText: string;
  onChangeText: (text: string) => void;
  feedbackError: boolean;
  feedbackSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

interface FeedbackSuccessContentProps {
  onClose: () => void;
}

export function FeedbackSuccessContent({ onClose }: FeedbackSuccessContentProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
  return (
    <>
      <Text style={{ fontFamily: typography.families.heading.semibold, fontSize: typography.sizes.lg, color: theme.colors.text, marginBottom: spacing.sm }}>
        Danke für dein Feedback!
      </Text>
      <Text style={{ fontFamily: typography.families.body.regular, fontSize: typography.sizes.md, color: theme.colors.textSecondary, marginBottom: spacing.xl }}>
        Es ist angekommen und wird gelesen.
      </Text>
      <Pressable
        onPress={onClose}
        style={({ pressed }) => [
          { backgroundColor: theme.colors.primary, borderRadius: radii.md, padding: spacing.md, alignItems: 'center', minHeight: touchTarget.min, justifyContent: 'center' },
          pressed && { opacity: 0.75 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Schließen"
      >
        <Text style={{ fontFamily: typography.families.ui.semibold, fontSize: typography.sizes.md, color: theme.colors.textInverse }}>
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
  onCancel,
}: FeedbackFormContentProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
  const isSubmitDisabled = feedbackSubmitting || !feedbackText.trim();

  const s = useMemo(() => StyleSheet.create({
    subtitle: { fontFamily: typography.families.body.regular, fontSize: typography.sizes.sm, color: theme.colors.textSecondary, marginBottom: spacing.md },
    input: { borderWidth: 1, textAlignVertical: 'top', minHeight: 120, backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: radii.md, padding: spacing.md, color: theme.colors.text, fontFamily: typography.families.body.regular, fontSize: typography.sizes.md },
    charCount: { fontFamily: typography.families.body.regular, fontSize: typography.sizes.xs, color: theme.colors.textSecondary, textAlign: 'right', marginTop: spacing.xs },
    errorText: { fontFamily: typography.families.body.regular, fontSize: typography.sizes.sm, color: theme.colors.text, marginTop: spacing.sm },
    privacyHint: { fontFamily: typography.families.body.regular, fontSize: typography.sizes.xs, color: theme.colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.md, fontStyle: 'italic' },
    buttonRow: { flexDirection: 'row', gap: spacing.sm },
    cancelButton: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: theme.colors.border, padding: spacing.md, alignItems: 'center', minHeight: touchTarget.min, justifyContent: 'center' },
    cancelText: { fontFamily: typography.families.ui.medium, fontSize: typography.sizes.md, color: theme.colors.textSecondary },
    submitButton: { flex: 1, borderRadius: radii.md, padding: spacing.md, alignItems: 'center', minHeight: touchTarget.min, justifyContent: 'center' },
    submitText: { fontFamily: typography.families.ui.semibold, fontSize: typography.sizes.md, color: theme.colors.textInverse },
  }), [theme, spacing, typography, radii, touchTarget]);

  return (
    <>
      <Text style={{ fontFamily: typography.families.heading.semibold, fontSize: typography.sizes.lg, color: theme.colors.text, marginBottom: spacing.sm }}>
        Feedback
      </Text>
      <Text style={s.subtitle}>
        Was hat geholfen, was stört, was fehlt? Bitte nur App-Feedback — nicht wie es dir gerade geht.
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
        <Text style={[s.charCount, feedbackText.length >= 500 ? { color: theme.colors.success } : {}]}>
          {feedbackText.length >= 500 ? '✓' : `${feedbackText.length} / 500`}
        </Text>
      )}
      {feedbackError && (
        <Text style={s.errorText}>Senden hat nicht geklappt. Bitte versuche es später nochmal.</Text>
      )}
      <Text style={s.privacyHint}>Bitte keine persönlichen Inhalte senden. Das Feedback wird ohne Namensangabe über Formspree (externer Dienst) übertragen — IP-Adresse kann dabei anfallen.</Text>
      <View style={s.buttonRow}>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [s.cancelButton, pressed && { opacity: 0.75 }]}
          accessibilityRole="button"
          accessibilityLabel="Abbrechen"
        >
          <Text style={s.cancelText}>Abbrechen</Text>
        </Pressable>
        <Pressable
          onPress={onSubmit}
          disabled={isSubmitDisabled}
          style={({ pressed }) => [
            s.submitButton,
            { backgroundColor: isSubmitDisabled ? theme.colors.border : theme.colors.primary },
            pressed && !isSubmitDisabled && { opacity: 0.75 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={feedbackSubmitting ? 'Sendet...' : 'Feedback absenden'}
          accessibilityState={{ disabled: isSubmitDisabled }}
        >
          <Text style={s.submitText}>{feedbackSubmitting ? 'Sendet...' : 'Senden'}</Text>
        </Pressable>
      </View>
    </>
  );
}
