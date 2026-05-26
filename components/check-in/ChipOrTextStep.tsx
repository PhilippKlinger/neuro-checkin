import { useRef, useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';
import { AppTextInput } from '../ui/AppTextInput';
import { isChipSelected, toggleChip } from '../../lib/utils/chips';
import { StepScaffold } from './StepScaffold';
interface ChipOrTextStepProps {
  title: string;
  subtitle: string;
  chips: readonly string[];
  value: string;
  onValueChange: (value: string) => void;
  textPlaceholder?: string;
  textAccessibilityLabel?: string;
  maxLength?: number;
  hint?: string;
  userChips?: string[];
  skipped?: boolean;
  onSkip?: () => void;
  chipsOnly?: boolean;
}

function hasChipContent(val: string, chips: readonly string[]): boolean {
  return chips.some((chip) => isChipSelected(chip, val));
}

interface ChipWrapProps {
  chips: readonly string[];
  value: string;
  onValueChange: (value: string) => void;
  variant?: 'default' | 'user';
}

function ChipWrap({ chips, value, onValueChange, variant = 'default' }: ChipWrapProps) {
  const { theme, spacing, radii, touchTarget } = useTheme();
  return (
    <View
      style={[styles.chipWrap, { gap: spacing.sm, marginBottom: spacing.md }]}
      accessibilityLabel="Mehrfachauswahl, optional — du kannst mehrere wählen."
    >
      {chips.map((chip) => {
        const selected = isChipSelected(chip, value);
        return (
          <Pressable
            key={chip}
            onPress={() => onValueChange(toggleChip(chip, value))}
            style={({ pressed }) => [
              styles.chip,
              {
                borderRadius: radii.full,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                minHeight: touchTarget.min,
                backgroundColor: selected ? theme.colors.accentSoft : theme.colors.surface,
                borderWidth: 1,
                borderStyle: variant === 'user' ? 'dashed' : 'solid',
                borderColor: selected ? theme.colors.accent : theme.colors.border,
              },
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={chip}
            accessibilityState={{ selected }}
          >
            <AppText variant="label" size="sm" color={selected ? 'primary' : 'secondary'}>
              {chip}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ChipOrTextStep({
  title,
  subtitle,
  chips,
  value,
  onValueChange,
  textPlaceholder = '',
  textAccessibilityLabel = '',
  maxLength = 150,
  hint,
  userChips,
  skipped,
  onSkip,
  chipsOnly = false,
}: ChipOrTextStepProps) {
  const { theme, spacing, radii, touchTarget } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  const [mode, setMode] = useState<'chips' | 'text'>(() =>
    !chipsOnly && value.trim() !== '' && !hasChipContent(value, chips) ? 'text' : 'chips'
  );

  const effectiveMode = chipsOnly ? 'chips' : mode;
  const counterThreshold = Math.floor(maxLength * 0.9);

  function switchToText() {
    onValueChange('');
    setMode('text');
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function switchToChips() {
    onValueChange('');
    setMode('chips');
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  return (
    <StepScaffold
      ref={scrollRef}
      title={title}
      subtitle={subtitle}
      hint={hint}
      keyboardPersistTaps
      avoidKeyboard
      skipConfig={onSkip ? { onSkip, skipped } : undefined}
    >
      {effectiveMode === 'chips' ? (
        <>
          <ChipWrap chips={chips} value={value} onValueChange={onValueChange} />

          {userChips && userChips.length > 0 && (
            <ChipWrap
              chips={userChips}
              value={value}
              onValueChange={onValueChange}
              variant="user"
            />
          )}

          {!chipsOnly && (
            <Pressable
              onPress={switchToText}
              style={({ pressed }) => [
                styles.modeSwitch,
                { minHeight: touchTarget.min, paddingVertical: spacing.sm },
                pressed && { opacity: 0.75 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Stattdessen frei beschreiben"
            >
              <AppText
                variant="body"
                size="sm"
                color="secondary"
                style={{ textDecorationLine: 'underline' }}
              >
                Lieber frei beschreiben
              </AppText>
            </Pressable>
          )}
        </>
      ) : (
        <>
          <AppTextInput
            value={value}
            onChangeText={(text) => onValueChange(text.slice(0, maxLength))}
            placeholder={textPlaceholder}
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            maxLength={maxLength}
            textAlignVertical="top"
            style={[
              styles.textInput,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: radii.md,
                padding: spacing.md,
              },
            ]}
            accessibilityLabel={textAccessibilityLabel}
          />
          <AppText variant="hint" size="xs" style={{ marginTop: spacing.xs }}>
            Mehrere Begriffe mit Komma trennen — sie werden als eigene Chips gespeichert.
          </AppText>
          {value.length >= counterThreshold && (
            <AppText
              variant="label"
              size="xs"
              color={value.length >= maxLength ? 'success' : 'secondary'}
              style={{ textAlign: 'right', marginTop: spacing.xs }}
            >
              {value.length >= maxLength ? '✓' : `${value.length} / ${maxLength}`}
            </AppText>
          )}

          <Pressable
            onPress={switchToChips}
            style={({ pressed }) => [
              styles.modeSwitch,
              { minHeight: touchTarget.min, paddingVertical: spacing.sm },
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Stattdessen aus Vorschlägen wählen"
          >
            <AppText
              variant="body"
              size="sm"
              color="secondary"
              style={{ textDecorationLine: 'underline' }}
            >
              Zurück zu den Vorschlägen
            </AppText>
          </Pressable>
        </>
      )}
    </StepScaffold>
  );
}

const styles = StyleSheet.create({
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    minHeight: 120,
    borderWidth: 1,
  },
  modeSwitch: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
