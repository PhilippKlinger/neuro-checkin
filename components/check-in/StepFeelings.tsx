import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { isChipSelected, toggleChip } from '../../lib/utils/chips';

interface StepFeelingsProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const FEELING_CHIPS = [
  'neutral', 'leer', 'erschöpft', 'angespannt', 'überwältigt',
  'gereizt', 'abgestumpft', 'traurig', 'ängstlich', 'leicht',
  'frustriert', 'zufrieden', 'verwirrt', 'aufgedreht',
  'Nicht definierbar',
];

function hasChipContent(val: string): boolean {
  return FEELING_CHIPS.some((chip) => isChipSelected(chip, val));
}

export function StepFeelings({ value, onValueChange }: StepFeelingsProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();

  // Derive initial mode from existing value so back-navigation preserves state
  const [mode, setMode] = useState<'chips' | 'text'>(() =>
    value.trim() !== '' && !hasChipContent(value) ? 'text' : 'chips'
  );

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
        Gefühle
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
        Welche Gefühle nimmst du gerade wahr?
      </Text>

      {mode === 'chips' ? (
        <>
          <View style={[styles.chipWrap, { gap: spacing.sm, marginBottom: spacing.md }]}>
            {FEELING_CHIPS.map((chip) => {
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
            placeholder="Was nimmst du gerade wahr?"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            maxLength={150}
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
                lineHeight: typography.sizes.md * 1.5,
              },
            ]}
            accessibilityLabel="Gefühle beschreiben"
          />
          {value.length >= 150 && (
            <Text
              style={{
                fontFamily: typography.families.body.regular,
                fontSize: typography.sizes.sm,
                color: theme.colors.textSecondary,
                textAlign: 'center',
                marginTop: spacing.xs,
              }}
            >
              Schön, dass du so viel wahrnimmst. Vielleicht reicht auch ein oder zwei Worte.
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
