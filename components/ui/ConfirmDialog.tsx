import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../../lib/hooks/useTheme';
import { OVERLAY_COLOR } from '../../lib/constants/themes';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  hideCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Abbrechen',
  destructive = false,
  hideCancel = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { theme, spacing, radii, touchTarget, shadows } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityViewIsModal
    >
      <Pressable style={styles.backdrop} onPress={onCancel} accessible={false}>
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: theme.colors.card,
              borderRadius: radii.lg,
              padding: spacing.lg,
              margin: spacing.xl,
              ...shadows.md,
            },
          ]}
          onStartShouldSetResponder={() => true}
          accessibilityRole="none"
        >
          <AppText variant="title" accessibilityRole="header" style={{ marginBottom: spacing.sm }}>
            {title}
          </AppText>
          <AppText variant="body" color="secondary" style={{ marginBottom: spacing.lg }}>
            {message}
          </AppText>

          <View style={[styles.buttons, { gap: spacing.sm }]}>
            {!hideCancel && (
              <Pressable
                onPress={onCancel}
                style={({ pressed }) => [
                  styles.button,
                  {
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.background,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    minHeight: touchTarget.min,
                  },
                  pressed && { opacity: 0.75 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={cancelLabel}
              >
                <AppText variant="label" style={{ textAlign: 'center' }}>
                  {cancelLabel}
                </AppText>
              </Pressable>
            )}

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                {
                  borderRadius: radii.md,
                  backgroundColor: destructive ? theme.colors.error : theme.colors.accent,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  minHeight: touchTarget.min,
                },
                pressed && { opacity: 0.75 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <AppText
                variant="label"
                weight="semibold"
                color="inverse"
                style={{ textAlign: 'center' }}
              >
                {confirmLabel}
              </AppText>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
    justifyContent: 'center',
  },
  dialog: {
    // shadow handled inline via theme
  },
  buttons: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
