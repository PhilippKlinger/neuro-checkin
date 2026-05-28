import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';

interface OnboardingBulletProps {
  icon: string;
  text: string;
}

export function OnboardingBullet({ icon, text }: OnboardingBulletProps) {
  const { theme, spacing, radii } = useTheme();

  const segments = parseBoldSegments(text);

  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: theme.colors.accentSoft,
            borderRadius: radii.sm,
          },
        ]}
      >
        <AppText variant="label" size="sm">
          {icon}
        </AppText>
      </View>
      <AppText variant="body" size="sm" style={styles.text}>
        {segments.map((seg, i) =>
          seg.bold ? (
            <AppText key={i} variant="body" size="sm" weight="semibold">
              {seg.content}
            </AppText>
          ) : (
            seg.content
          )
        )}
      </AppText>
    </View>
  );
}

interface TextSegment {
  content: string;
  bold: boolean;
}

function parseBoldSegments(text: string): TextSegment[] {
  const parts = text.split(/\*([^*]+)\*/);
  return parts.map((part, i) => ({
    content: part,
    bold: i % 2 === 1,
  })).filter((seg) => seg.content.length > 0);
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    paddingTop: 4,
  },
});
