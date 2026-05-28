import Svg, { Path } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

interface EnsoIllustrationProps {
  size?: number;
}

export function EnsoIllustration({ size = 130 }: EnsoIllustrationProps) {
  const { theme, shadows } = useTheme();
  return (
    <View style={[styles.container, shadows.md]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Path
          d="M 60 18 Q 90 22 96 60 Q 98 92 60 100 Q 22 96 18 60 Q 19 28 50 18"
          fill="none"
          stroke={theme.colors.accent}
          strokeWidth={9}
          strokeLinecap="round"
          opacity={0.85}
        />
        <Path
          d="M 60 18 Q 70 17 78 20"
          fill="none"
          stroke={theme.colors.accent}
          strokeWidth={9}
          strokeLinecap="round"
          opacity={0.45}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
