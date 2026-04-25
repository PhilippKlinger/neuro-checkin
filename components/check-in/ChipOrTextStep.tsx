import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { isChipSelected, toggleChip } from '../../lib/utils/chips';

interface ChipOrTextStepProps {
  title: string;
  subtitle: string;
  chips: readonly string[];
  value: string;
  onValueChange: (value: string) => void;
  textPlaceholder: string;
  textAccessibilityLabel: string;
  maxLength?: number;
}

function hasChipContent(val: string, chips: readonly string[]): boolean {
  return chips.some((chip) => isChipSelected(chip, val));
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
          marginBottom: spacing.lg,
        }}
      >
        {subtitle}
      </Text>

      {mode === 'chips' ? (
        <>
          <View style={[styles.chipWrap, { gap: spacing.sm, marginBottom: spacing.md }]}>
            {chips.map((chip) => {
              const selected = isChipSelected(chip, value);
              return (
                <Pressable
                  key={chip}
                  onPress={() => onValueChange(toggleChip(chip, value))}
                  style={[
                    styles.chip,
                    {
                      borderRadius: radii.full,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                      backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface,
                      borderWidth: 1,
                      borderColor: selected ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={chip}
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={{
                      fontFamily: typography.families.ui.medium,
                      fontSize: typography.sizes.sm,
                      color: selected ? theme.colors.primary : theme.colors.textSecondary,
                    }}
                  >
                    {chip}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={switchToText}
            style={[styles.modeSwitch, { minHeight: touchTarget.min, paddingVertical: spacing.sm }]}
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
        </>
      ) : (
        <>
          <TextInput
            value={value}
            onChangeText={onValueChange}
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
                color: value.length >= maxLength ? theme.colors.success : theme.colors.textSecondary,
                textAlign: 'right',
                marginTop: spacing.xs,
              }}
            >
              {value.length >= maxLength ? '✓' : `${value.length} / ${maxLength}`}
            </Text>
          )}

          <Pressable
            onPress={switchToChips}
            style={[styles.modeSwitch, { minHeight: touchTarget.min, paddingVertical: spacing.sm }]}
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
});
