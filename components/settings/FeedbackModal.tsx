import { useState } from 'react';
import { Modal, View, KeyboardAvoidingView, Platform, StyleSheet, Pressable } from 'react-native';
import { AppText } from '../ui/AppText';
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
  const { theme, spacing, radii } = useTheme();
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
    const trimmed = feedbackText.trim().slice(0, 500);
    if (!trimmed) return;
    setFeedbackSubmitting(true);
    setFeedbackError(false);
    try {
      const appVersion = Constants.expoConfig?.version ?? '—';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          feedback: trimmed,
          _subject: `Neuro Check-in Feedback v${appVersion}`,
          app_version: appVersion,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        setFeedbackSuccess(true);
        setFeedbackText('');
      } else {
        setFeedbackError(true);
      }
    } catch (error) {
      console.error('feedback submit failed:', error);
      setFeedbackError(true);
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      {/* Full-screen background — separate from KeyboardAvoidingView so it
          covers the entire screen including nav bar on edge-to-edge Android */}
      <Pressable
        style={[StyleSheet.absoluteFillObject, styles.backdrop]}
        onPress={handleClose}
        accessible={false}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { padding: spacing.lg }]}
        pointerEvents="box-none"
      >
        <View
          style={{
            width: '100%',
            backgroundColor: theme.colors.background,
            borderRadius: radii.lg,
            padding: spacing.lg,
          }}
        >
          {!feedbackAvailable ? (
            <AppText variant="body" color="secondary">
              Feedback ist derzeit nicht verfügbar.
            </AppText>
          ) : feedbackSuccess ? (
            <FeedbackSuccessContent onClose={handleClose} />
          ) : (
            <FeedbackFormContent
              feedbackText={feedbackText}
              onChangeText={setFeedbackText}
              feedbackError={feedbackError}
              feedbackSubmitting={feedbackSubmitting}
              onSubmit={handleSubmit}
              onClose={handleClose}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: OVERLAY_COLOR,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});
