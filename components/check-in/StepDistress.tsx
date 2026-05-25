import { useState, useRef, useEffect } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { useReducedMotion } from '../../lib/hooks/useReducedMotion';
import { AppText } from '../ui/AppText';
import { AppTextInput } from '../ui/AppTextInput';
import { DISTRESS_LABELS, DISTRESS_NOTE_THRESHOLD } from '../../lib/types/checkin';
import { StepScaffold } from './StepScaffold';

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
  const { theme, spacing, radii, touchTarget } = useTheme();
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
    <StepScaffold
      ref={scrollRef}
      title="Stress-Level"
      subtitle="Wie belastet oder angespannt bist du gerade?"
      hint={hint}
      keyboardPersistTaps
      avoidKeyboard
    >
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
              <AppText variant="label">{label}</AppText>
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
        <AppText variant="hint" color="secondary">Kann ich gerade nicht sagen</AppText>
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
          <AppText variant="hint">Wenn du magst, schreib kurz dazu.</AppText>
        </Pressable>
      )}

      {noteOpen && (
        <AppTextInput
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
        <AppText
          variant="label"
          size="xs"
          color={distressNote.length >= 200 ? 'success' : 'secondary'}
          style={{ textAlign: 'right', marginTop: spacing.xs }}
        >
          {distressNote.length >= 200 ? '✓' : `${distressNote.length} / 200`}
        </AppText>
      )}
    </StepScaffold>
  );
}

const styles = StyleSheet.create({
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
