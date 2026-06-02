import { View, StyleSheet } from 'react-native';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../lib/hooks/useTheme';
import type { ReflectionResult } from '../../lib/utils/reflection';
import {
  REFLECTION_EYEBROW,
  REFLECTION_INTRO_LINE,
  REFLECTION_STEADY_LINE,
  REFLECTION_VARIED_LINE,
  REFLECTION_HUMBLE_LINE,
} from '../../lib/constants/reflectionTemplates';

interface Props {
  result: ReflectionResult;
  embedded?: boolean;
  hideEyebrow?: boolean;
}

const FORM_TEXT: Record<'steady' | 'varied' | 'humble', string> = {
  steady: REFLECTION_STEADY_LINE,
  varied: REFLECTION_VARIED_LINE,
  humble: REFLECTION_HUMBLE_LINE,
};

export function ReflectionCard({ result, embedded, hideEyebrow }: Props) {
  const { theme, spacing, radii, shadows } = useTheme();

  const content = (
    <>
      {!hideEyebrow && (
        <AppText
          variant="label"
          size="sm"
          color="secondary"
          style={{ marginBottom: spacing.xs }}
          accessibilityRole="header"
        >
          {REFLECTION_EYEBROW}
        </AppText>
      )}

      {result.state === 'intro' ? (
        <AppText variant="body">{REFLECTION_INTRO_LINE}</AppText>
      ) : result.state === 'active' ? (
        result.lines.map((line, index) => (
          <AppText
            key={line.key}
            variant="body"
            style={index < result.lines.length - 1 ? { marginBottom: spacing.xs } : undefined}
          >
            {line.text}
          </AppText>
        ))
      ) : (
        <AppText variant="body">{FORM_TEXT[result.state]}</AppText>
      )}
    </>
  );

  if (embedded) {
    return (
      <View accessibilityRole="summary" style={{ padding: spacing.md }}>
        {content}
      </View>
    );
  }

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
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});
