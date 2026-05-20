import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { useReducedMotion } from '../../lib/hooks/useReducedMotion';
import { DISTRESS_LABELS, DISTRESS_NOTE_THRESHOLD } from '../../lib/types/checkin';

interface StepDistressProps {
  distressLevel: number | null;
  distressNote: string;
  onLevelChange: (level: number | null) => void;
  onNoteChange: (note: string) => void;
  hint?: string;
}

const LEVEL_OPTIONS = DISTRESS_LABELS.map((label, i) => ({
  level: i + 1,
  label,
}));

export function StepDistress({
  distressLevel,
  distressNote,
  onLevelChange,
  onNoteChange,
  hint,
}: StepDistressProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
  const reducedMotion = useReducedMotion();
  const [cannotSay, setCannotSay] = useState(false);
  const [noteOpen, setNoteOpen] = useState(distressNote !== '');
  const scrollRef = useRef<ScrollView>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  function scheduleScrollToEnd() {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: !reducedMotion }),
      300
    );
  }

  function handleLevelSelect(level: number) {
    setCannotSay(false);
    const newLevel = distressLevel === level ? null : level;
    onLevelChange(newLevel);
    if (newLevel !== null && newLevel < DISTRESS_NOTE_THRESHOLD) {
      setNoteOpen(false);
    }
  }

  function handleCannotSay() {
    setCannotSay(true);
    onLevelChange(null);
    setNoteOpen(false);
  }

  const showNoteToggle = distressLevel !== null && distressLevel >= DISTRESS_NOTE_THRESHOLD;

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
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
        Stress-Level
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
        Wie belastet oder angespannt bist du gerade?
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
      <View
        style={[styles.optionList, { gap: spacing.sm }]}
        accessibilityRole="radiogroup"
        accessibilityLabel="Stress-Level"
      >
        {LEVEL_OPTIONS.map(({ level, label }) => {
          const isSelected = distressLevel === level;
          return (
            <Pressable
              key={level}
              onPress={() => handleLevelSelect(level)}
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
              accessibilityRole="radio"
              accessibilityLabel={label}
              accessibilityState={{ checked: isSelected }}
            >
              <Text
                style={{
                  fontFamily: typography.families.ui.medium,
                  fontSize: typography.sizes.md,
                  color: theme.colors.text,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View
        style={[
          styles.divider,
          { backgroundColor: theme.colors.border, marginVertical: spacing.md },
        ]}
      />

      <Pressable
        onPress={handleCannotSay}
        style={({ pressed }) => [
          styles.cannotSayButton,
          {
            minHeight: touchTarget.min,
            borderRadius: radii.md,
            paddingHorizontal: spacing.md,
            backgroundColor: cannotSay ? theme.colors.accentSoft : theme.colors.surface,
            borderWidth: 1,
            borderColor: cannotSay ? theme.colors.accent : theme.colors.border,
          },
          pressed && { opacity: 0.75 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Kann ich gerade nicht sagen"
        accessibilityState={{ selected: cannotSay }}
      >
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.md,
            color: theme.colors.textSecondary,
            fontStyle: 'italic',
          }}
        >
          Kann ich gerade nicht sagen
        </Text>
      </Pressable>

      {showNoteToggle && !noteOpen && (
        <Pressable
          onPress={() => {
            setNoteOpen(true);
            scheduleScrollToEnd();
          }}
          style={({ pressed }) => [
            { marginTop: spacing.lg, alignItems: 'center', opacity: pressed ? 0.6 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Notiz hinzufügen"
        >
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.sm,
              color: theme.colors.textSecondary,
              fontStyle: 'italic',
            }}
          >
            Wenn du magst, schreib kurz dazu.
          </Text>
        </Pressable>
      )}

      {noteOpen && (
        <TextInput
          value={distressNote}
          onChangeText={(text) => onNoteChange(text.slice(0, 200))}
          placeholder="(optional)"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          maxLength={200}
          textAlignVertical="top"
          onFocus={scheduleScrollToEnd}
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
          accessibilityLabel="Stress-Notiz"
        />
      )}
      {noteOpen && distressNote.length >= 180 && (
        <Text
          style={{
            fontFamily: typography.families.ui.medium,
            fontSize: typography.sizes.xs,
            color: distressNote.length >= 200 ? theme.colors.success : theme.colors.textSecondary,
            textAlign: 'right',
            marginTop: spacing.xs,
          }}
        >
          {distressNote.length >= 200 ? '✓' : `${distressNote.length} / 200`}
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
    justifyContent: 'center',
  },
  optionList: {},
  optionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
  },
  cannotSayButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteInput: {
    minHeight: 80,
    borderWidth: 1,
  },
});
