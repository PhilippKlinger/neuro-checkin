import { useState } from 'react';
import { Modal, View, KeyboardAvoidingView, Platform, StyleSheet, Text } from 'react-native';
import Constants from 'expo-constants';
import { useTheme } from '../../lib/hooks/useTheme';
import { FORMSPREE_URL } from '../../lib/constants/config';
import { OVERLAY_COLOR } from '../../lib/constants/themes';
import { FeedbackFormContent, FeedbackSuccessContent } from './FeedbackFormContent';

const feedbackAvailable = Boolean(FORMSPREE_URL && FORMSPREE_URL.startsWith('https://'));

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

export function FeedbackModal({ visible, onClose }: FeedbackModalProps) {
  const { theme, spacing, radii, typography } = useTheme();
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.overlay, { padding: spacing.lg }]}
      >
        <View style={{ width: '100%', backgroundColor: theme.colors.background, borderRadius: radii.lg, padding: spacing.lg }}>
          {!feedbackAvailable ? (
            <Text style={{ fontFamily: typography.families.body.regular, fontSize: typography.sizes.md, color: theme.colors.textSecondary }}>
              Feedback ist derzeit nicht verfügbar.
            </Text>
          ) : feedbackSuccess ? (
            <FeedbackSuccessContent onClose={handleClose} />
          ) : (
            <FeedbackFormContent
              feedbackText={feedbackText}
              onChangeText={setFeedbackText}
              feedbackError={feedbackError}
              feedbackSubmitting={feedbackSubmitting}
              onSubmit={handleSubmit}
              onCancel={handleClose}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
    justifyContent: 'center',
  },
});
