import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { isChipSelected, toggleChip } from '../../lib/utils/chips';
import type { ChipGroup } from '../../lib/constants/chips';
export type { ChipGroup } from '../../lib/constants/chips';

interface ChipOrTextStepProps {
  title: string;
  subtitle: string;
  chips: readonly string[];
  value: string;
  onValueChange: (value: string) => void;
  textPlaceholder: string;
  textAccessibilityLabel: string;
  maxLength?: number;
  hint?: string;
  userChips?: string[];
  chipGroups?: ChipGroup[];
  skipped?: boolean;
  onSkip?: () => void;
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
  const { theme, spacing, typography, radii } = useTheme();
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
            <Text
              style={{
                fontFamily: typography.families.ui.medium,
                fontSize: typography.sizes.sm,
                color: selected ? theme.colors.text : theme.colors.textSecondary,
              }}
            >
              {chip}
            </Text>
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
  textPlaceholder,
  textAccessibilityLabel,
  maxLength = 150,
  hint,
  userChips,
  chipGroups,
  skipped,
  onSkip,
}: ChipOrTextStepProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();

  const [mode, setMode] = useState<'chips' | 'text'>(() =>
    value.trim() !== '' && !hasChipContent(value, chips) ? 'text' : 'chips'
  );

  const counterThreshold = Math.floor(maxLength * 0.9);

  function switchToText() {
    onValueChange('');
    setMode('text');
  }

  function switchToChips() {
    onValueChange('');
    setMode('chips');
  }

  return (
    <View style={styles.container}>
      <Text
        style={{
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.xl,
          color: theme.colors.text,
          textAlign: 'center',
          marginBottom: spacing.sm,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.md,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginBottom: hint ? spacing.sm : spacing.lg,
        }}
      >
        {subtitle}
      </Text>
      {hint && (
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.sm,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            fontStyle: 'italic',
            marginBottom: spacing.lg,
          }}
        >
          {hint}
        </Text>
      )}

      {mode === 'chips' ? (
        <>
          {chipGroups ? (
            chipGroups.map((group) => (
              <View key={group.label}>
                <Text
                  style={{
                    fontFamily: typography.families.body.regular,
                    fontSize: typography.sizes.xs,
                    color: theme.colors.textSecondary,
                    fontStyle: 'italic',
                    marginBottom: spacing.sm,
                  }}
                >
                  {group.label}
                </Text>
                <ChipWrap chips={group.chips} value={value} onValueChange={onValueChange} />
              </View>
            ))
          ) : (
            <ChipWrap chips={chips} value={value} onValueChange={onValueChange} />
          )}

          {userChips && userChips.length > 0 && (
            <>
              <Text
                style={{
                  fontFamily: typography.families.body.regular,
                  fontSize: typography.sizes.xs,
                  color: theme.colors.textSecondary,
                  marginBottom: spacing.sm,
                }}
              >
                Deine Begriffe
              </Text>
              <ChipWrap
                chips={userChips}
                value={value}
                onValueChange={onValueChange}
                variant="user"
              />
            </>
          )}

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
            <Text
              style={{
                fontFamily: typography.families.body.regular,
                fontSize: typography.sizes.sm,
                color: theme.colors.textSecondary,
                textDecorationLine: 'underline',
              }}
            >
              Lieber frei beschreiben
            </Text>
          </Pressable>

          {onSkip && (
            <>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.border, marginVertical: spacing.md },
                ]}
              />
              <Pressable
                onPress={onSkip}
                style={({ pressed }) => [
                  styles.skipButton,
                  {
                    minHeight: touchTarget.min,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    backgroundColor: skipped ? theme.colors.accentSoft : theme.colors.surface,
                    borderWidth: 1,
                    borderColor: skipped ? theme.colors.accent : theme.colors.border,
                  },
                  pressed && { opacity: 0.75 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Kann ich nicht benennen"
                accessibilityState={{ selected: skipped }}
              >
                <Text
                  style={{
                    fontFamily: typography.families.body.regular,
                    fontSize: typography.sizes.md,
                    color: theme.colors.textSecondary,
                    fontStyle: 'italic',
                  }}
                >
                  Kann ich nicht benennen
                </Text>
              </Pressable>
            </>
          )}
        </>
      ) : (
        <>
          <TextInput
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
                fontFamily: typography.families.body.regular,
                fontSize: typography.sizes.md,
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: radii.md,
                padding: spacing.md,
                lineHeight: typography.sizes.md * typography.lineHeights.normal,
              },
            ]}
            accessibilityLabel={textAccessibilityLabel}
          />
          {value.length >= counterThreshold && (
            <Text
              style={{
                fontFamily: typography.families.ui.medium,
                fontSize: typography.sizes.xs,
                color:
                  value.length >= maxLength ? theme.colors.success : theme.colors.textSecondary,
                textAlign: 'right',
                marginTop: spacing.xs,
              }}
            >
              {value.length >= maxLength ? '✓' : `${value.length} / ${maxLength}`}
            </Text>
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
            <Text
              style={{
                fontFamily: typography.families.body.regular,
                fontSize: typography.sizes.sm,
                color: theme.colors.textSecondary,
                textDecorationLine: 'underline',
              }}
            >
              Zurück zu den Vorschlägen
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  divider: {
    height: 1,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
