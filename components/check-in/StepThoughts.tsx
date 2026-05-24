import { useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { useReducedMotion } from '../../lib/hooks/useReducedMotion';
import { NAV_AREA_PADDING } from '../../lib/constants/layout';

type ThoughtsType = 'supportive' | 'burdening' | 'mixed' | null;

interface StepThoughtsProps {
  type: ThoughtsType;
  note: string;
  onTypeChange: (type: ThoughtsType) => void;
  onNoteChange: (note: string) => void;
  hint?: string;
}

interface OptionItem {
  value: ThoughtsType;
  label: string;
}

const OPTIONS: OptionItem[] = [
  { value: 'supportive', label: 'Unterstützend' },
  { value: 'burdening', label: 'Belastend' },
  { value: 'mixed', label: 'Gemischt' },
];

export function StepThoughts({ type, note, onTypeChange, onNoteChange, hint }: StepThoughtsProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
  const reducedMotion = useReducedMotion();
  const scrollRef = useRef<ScrollView>(null);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={{
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.xl,
          color: theme.colors.text,
          textAlign: 'center',
          marginBottom: spacing.sm,
        }}
      >
        Gedanken
      </Text>
      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.md,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginBottom: hint ? spacing.sm : spacing.xl,
        }}
      >
        Wie würdest du deine Gedanken gerade beschreiben?
      </Text>
      {hint && (
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.sm,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            fontStyle: 'italic',
            marginBottom: spacing.xl,
          }}
        >
          {hint}
        </Text>
      )}
      <View style={[styles.optionList, { gap: spacing.sm }]}>
        {OPTIONS.map((option) => {
          const isSelected = type === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onTypeChange(isSelected ? null : option.value)}
              style={({ pressed }) => [
                styles.optionButton,
                {
                  minHeight: touchTarget.min,
                  borderRadius: radii.md,
                  paddingHorizontal: spacing.md,
                  backgroundColor: isSelected ? theme.colors.accentSoft : theme.colors.surface,
                  borderWidth: 1,
                  borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                },
                pressed && { opacity: 0.75 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={{
                  fontFamily: typography.families.ui.medium,
                  fontSize: typography.sizes.md,
                  color: theme.colors.text,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        value={note}
        onChangeText={(text) => onNoteChange(text.slice(0, 200))}
        placeholder="Möchtest du dazu etwas notieren? (optional)"
        placeholderTextColor={theme.colors.textSecondary}
        multiline
        maxLength={200}
        textAlignVertical="top"
        onFocus={() => {
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: !reducedMotion }), 300);
        }}
        style={[
          styles.noteInput,
          {
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.md,
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: radii.md,
            padding: spacing.md,
            marginTop: spacing.lg,
          },
        ]}
        accessibilityLabel="Gedanken-Notiz"
      />
      {note.length >= 180 && (
        <Text
          style={{
            fontFamily: typography.families.ui.medium,
            fontSize: typography.sizes.xs,
            color: note.length >= 200 ? theme.colors.success : theme.colors.textSecondary,
            textAlign: 'right',
            marginTop: spacing.xs,
          }}
        >
          {note.length >= 200 ? '✓' : `${note.length} / 200`}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: NAV_AREA_PADDING,
  },
  optionList: {},
  optionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteInput: {
    minHeight: 80,
    borderWidth: 1,
  },
});
