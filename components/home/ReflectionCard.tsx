import { View, StyleSheet } from 'react-native';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../lib/hooks/useTheme';
import type { ReflectionResult } from '../../lib/utils/reflection';
import {
  REFLECTION_EYEBROW,
  REFLECTION_SOURCE,
  REFLECTION_INTRO_EYEBROW,
  REFLECTION_INTRO_LINE,
  REFLECTION_STEADY_LINE,
  REFLECTION_VARIED_LINE,
  REFLECTION_HUMBLE_LINE,
} from '../../lib/constants/reflectionTemplates';

interface Props {
  result: ReflectionResult;
}

// Maps the three single-line form states to their text (REFLECT-02).
const FORM_TEXT: Record<'steady' | 'varied' | 'humble', string> = {
  steady:  REFLECTION_STEADY_LINE,
  varied:  REFLECTION_VARIED_LINE,
  humble:  REFLECTION_HUMBLE_LINE,
};

export function ReflectionCard({ result }: Props) {
  const { theme, spacing, radii, shadows } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderRadius: radii.md,
          borderColor: theme.colors.border,
          padding: spacing.md,
          ...shadows.md,
        },
      ]}
      accessibilityRole="summary"
    >
      {result.state === 'intro' ? (
        // New user — not enough data yet
        <>
          <AppText
            variant="label"
            size="sm"
            color="secondary"
            style={styles.eyebrow}
            accessibilityRole="header"
          >
            {REFLECTION_INTRO_EYEBROW}
          </AppText>
          <AppText variant="body" size="sm" color="secondary">
            {REFLECTION_INTRO_LINE}
          </AppText>
        </>
      ) : result.state === 'active' ? (
        // Dominant dimension(s) found — show pattern lines
        <>
          <AppText
            variant="label"
            size="sm"
            color="secondary"
            style={styles.eyebrow}
            accessibilityRole="header"
          >
            {REFLECTION_EYEBROW}
          </AppText>
          {result.lines.map((line, index) => (
            <View key={line.key} style={styles.lineRow}>
              <View
                style={[styles.dot, { backgroundColor: theme.colors.accent }]}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <AppText
                variant="body"
                size="sm"
                style={[
                  styles.lineText,
                  index < result.lines.length - 1 && { marginBottom: spacing.xs },
                ]}
              >
                {line.text}
              </AppText>
            </View>
          ))}
          <AppText
            variant="body"
            size="xs"
            color="secondary"
            style={[styles.source, { marginTop: spacing.sm }]}
          >
            {REFLECTION_SOURCE}
          </AppText>
        </>
      ) : (
        // Form states: steady | varied | humble — single honest sentence
        <>
          <AppText
            variant="label"
            size="sm"
            color="secondary"
            style={styles.eyebrow}
            accessibilityRole="header"
          >
            {REFLECTION_EYEBROW}
          </AppText>
          <AppText variant="body" size="sm" color="secondary">
            {FORM_TEXT[result.state]}
          </AppText>
          <AppText
            variant="body"
            size="xs"
            color="secondary"
            style={[styles.source, { marginTop: spacing.sm }]}
          >
            {REFLECTION_SOURCE}
          </AppText>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  lineText: {
    flex: 1,
  },
  source: {
    opacity: 0.6,
  },
});
