import { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AppText } from './AppText';
import { AppTextInput } from './AppTextInput';
import { useTheme } from '../../lib/hooks/useTheme';
import { useReducedMotion } from '../../lib/hooks/useReducedMotion';
import { OVERLAY_COLOR } from '../../lib/constants/themes';

interface NoteFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  /** Header shown above the input inside the modal. */
  title: string;
  placeholder: string;
  maxLength: number;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * A note field that opens a dedicated modal for editing instead of an inline
 * TextInput. The modal floats above the keyboard (KeyboardAvoidingView), so the
 * field is never covered while typing — the recurring problem with inline notes
 * inside the scrolling check-in steps. The collapsed field shows the current
 * value (or placeholder) and the committed text appears there after closing.
 */
export function NoteField({
  value,
  onChangeText,
  title,
  placeholder,
  maxLength,
  accessibilityLabel,
  style,
}: NoteFieldProps) {
  const { theme, spacing, radii, touchTarget } = useTheme();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleOpen = useCallback(() => {
    setDraft(value);
    setOpen(true);
  }, [value]);

  // Closing (Fertig, backdrop tap, or hardware back) commits the current text.
  const handleCommit = useCallback(() => {
    onChangeText(draft);
    setOpen(false);
  }, [draft, onChangeText]);

  return (
    <>
      <Pressable
        onPress={handleOpen}
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: radii.md,
            padding: spacing.md,
          },
          style,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Öffnet ein Textfeld zum Schreiben"
      >
        <AppText variant="body" color={value ? undefined : 'secondary'}>
          {value || placeholder}
        </AppText>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType={reducedMotion ? 'none' : 'fade'}
        onRequestClose={handleCommit}
      >
        <Pressable
          style={[StyleSheet.absoluteFillObject, { backgroundColor: OVERLAY_COLOR }]}
          onPress={handleCommit}
          accessible={false}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.card,
                borderRadius: radii.lg,
                padding: spacing.lg,
                margin: spacing.lg,
              },
            ]}
          >
            <AppText
              variant="title"
              accessibilityRole="header"
              style={{ marginBottom: spacing.md }}
            >
              {title}
            </AppText>

            <AppTextInput
              value={draft}
              onChangeText={(t) => setDraft(t.slice(0, maxLength))}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              autoFocus
              maxLength={maxLength}
              textAlignVertical="top"
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: radii.md,
                  padding: spacing.md,
                },
              ]}
              accessibilityLabel={accessibilityLabel}
            />

            <View style={[styles.footer, { marginTop: spacing.sm }]}>
              <AppText variant="label" size="xs" color="secondary">
                {draft.length} / {maxLength}
              </AppText>
              <Pressable
                onPress={handleCommit}
                style={({ pressed }) => [
                  styles.doneButton,
                  {
                    backgroundColor: theme.colors.accent,
                    borderRadius: radii.md,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.lg,
                    minHeight: touchTarget.min,
                  },
                  pressed && { opacity: 0.75 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Fertig"
              >
                <AppText variant="label" weight="semibold" color="inverse">
                  Fertig
                </AppText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 80,
    borderWidth: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    // shadow intentionally omitted — overlay backdrop provides separation
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  doneButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
