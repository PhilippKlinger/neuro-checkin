import { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
import { useTheme } from '../../lib/hooks/useTheme';
import { FORMSPREE_URL } from '../../lib/constants/config';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

const OVERLAY_BG = 'rgba(0, 0, 0, 0.4)';

export function FeedbackModal({ visible, onClose }: FeedbackModalProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  function handleClose() {
    onClose();
    setFeedbackText('');
    setFeedbackError(false);
    setFeedbackSuccess(false);
  }

  async function handleSubmit() {
    if (!feedbackText.trim()) return;
    setFeedbackSubmitting(true);
    setFeedbackError(false);
    try {
      const appVersion = Constants.expoConfig?.version ?? '—';
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          feedback: feedbackText.trim(),
          _subject: `Neuro Check-in Feedback v${appVersion}`,
          app_version: appVersion,
        }),
      });
      if (res.ok) {
        setFeedbackSuccess(true);
        setFeedbackText('');
      } else {
        setFeedbackError(true);
      }
    } catch {
      setFeedbackError(true);
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  const isSubmitDisabled = feedbackSubmitting || !feedbackText.trim();

  const s = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: OVERLAY_BG,
          justifyContent: 'center',
          padding: spacing.lg,
        },
        card: {
          width: '100%',
          backgroundColor: theme.colors.background,
          borderRadius: radii.lg,
          padding: spacing.lg,
        },
        title: {
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.lg,
          color: theme.colors.text,
          marginBottom: spacing.sm,
        },
        successBody: {
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.md,
          color: theme.colors.textSecondary,
          marginBottom: spacing.xl,
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
        buttonRow: {
          flexDirection: 'row',
          gap: spacing.sm,
        },
        cancelButton: {
          flex: 1,
          backgroundColor: theme.colors.surface,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: spacing.md,
          alignItems: 'center',
          minHeight: touchTarget.min,
          justifyContent: 'center',
        },
        cancelText: {
          fontFamily: typography.families.ui.medium,
          fontSize: typography.sizes.md,
          color: theme.colors.textSecondary,
        },
        submitButton: {
          flex: 1,
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
        primaryButton: {
          backgroundColor: theme.colors.primary,
          borderRadius: radii.md,
          padding: spacing.md,
          alignItems: 'center',
          minHeight: touchTarget.min,
          justifyContent: 'center',
        },
        primaryText: {
          fontFamily: typography.families.ui.semibold,
          fontSize: typography.sizes.md,
          color: theme.colors.textInverse,
        },
      }),
    [theme, spacing, typography, radii, touchTarget]
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.overlay}
      >
        <View style={s.card}>
          {feedbackSuccess ? (
            <>
              <Text style={s.title}>Danke für dein Feedback!</Text>
              <Text style={s.successBody}>Es ist angekommen und wird gelesen.</Text>
              <Pressable
                onPress={handleClose}
                style={s.primaryButton}
                accessibilityRole="button"
                accessibilityLabel="Schließen"
              >
                <Text style={s.primaryText}>Schließen</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={s.title}>Feedback</Text>
              <Text style={s.subtitle}>
                Was denkst du? Was hat geholfen, was stört, was fehlt? Alles ist optional.
              </Text>
              <TextInput
                value={feedbackText}
                onChangeText={setFeedbackText}
                placeholder="Dein Feedback..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                style={s.input}
                accessibilityLabel="Feedback eingeben"
              />
              {feedbackError && (
                <Text style={s.errorText}>
                  Senden hat nicht geklappt. Bitte versuche es später nochmal.
                </Text>
              )}
              <Text style={s.privacyHint}>
                Anonym gesendet — nur dein Text und die App-Version kommen an. Bitte keine persönlichen Check-in-Inhalte.
              </Text>
              <View style={s.buttonRow}>
                <Pressable
                  onPress={handleClose}
                  style={s.cancelButton}
                  accessibilityRole="button"
                  accessibilityLabel="Abbrechen"
                >
                  <Text style={s.cancelText}>Abbrechen</Text>
                </Pressable>
                <Pressable
                  onPress={handleSubmit}
                  disabled={isSubmitDisabled}
                  style={[
                    s.submitButton,
                    {
                      backgroundColor: isSubmitDisabled
                        ? theme.colors.border
                        : theme.colors.primary,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={feedbackSubmitting ? 'Sendet...' : 'Feedback absenden'}
                  accessibilityState={{ disabled: isSubmitDisabled }}
                >
                  <Text style={s.submitText}>
                    {feedbackSubmitting ? 'Sendet...' : 'Senden'}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
