import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

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
  const { theme, spacing, typography, radii, touchTarget } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityViewIsModal
    >
      <Pressable
        style={styles.backdrop}
        onPress={onCancel}
        accessibilityLabel="Dialog schließen"
      >
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              margin: spacing.xl,
            },
          ]}
          onStartShouldSetResponder={() => true}
          accessibilityRole="none"
        >
          <Text
            style={{
              fontFamily: typography.families.heading.semibold,
              fontSize: typography.sizes.lg,
              color: theme.colors.text,
              marginBottom: spacing.sm,
            }}
            accessibilityRole="header"
          >
            {title}
          </Text>
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.md,
              color: theme.colors.textSecondary,
              lineHeight: typography.sizes.md * typography.lineHeights.normal,
              marginBottom: spacing.lg,
            }}
          >
            {message}
          </Text>

          <View style={[styles.buttons, { gap: spacing.sm }]}>
            {!hideCancel && (
              <Pressable
                onPress={onCancel}
                style={[
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
                ]}
                accessibilityRole="button"
                accessibilityLabel={cancelLabel}
              >
                <Text
                  style={{
                    fontFamily: typography.families.ui.medium,
                    fontSize: typography.sizes.md,
                    color: theme.colors.text,
                    textAlign: 'center',
                  }}
                >
                  {cancelLabel}
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={onConfirm}
              style={[
                styles.button,
                {
                  borderRadius: radii.md,
                  backgroundColor: destructive ? theme.colors.error : theme.colors.primary,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  minHeight: touchTarget.min,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <Text
                style={{
                  fontFamily: typography.families.ui.semibold,
                  fontSize: typography.sizes.md,
                  color: theme.colors.textInverse,
                  textAlign: 'center',
                }}
              >
                {confirmLabel}
              </Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
