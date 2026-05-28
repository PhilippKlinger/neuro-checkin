import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from '../ui/AppText';

export function NotificationMock() {
  const { theme, spacing, radii, shadows } = useTheme();

  return (
    <View
      style={[
        styles.bubble,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          borderRadius: radii.md,
          padding: spacing.md,
          marginHorizontal: spacing.lg,
        },
        shadows.md,
      ]}
    >
      <View style={[styles.row, { gap: spacing.sm }]}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: theme.colors.accentSoft, borderRadius: radii.sm },
          ]}
        >
          <Svg width={20} height={20} viewBox="0 0 120 120">
            <Path
              d="M 60 18 Q 90 22 96 60 Q 98 92 60 100 Q 22 96 18 60 Q 19 28 50 18"
              fill="none"
              stroke={theme.colors.accent}
              strokeWidth={12}
              strokeLinecap="round"
              opacity={0.85}
            />
          </Svg>
        </View>
        <View style={styles.textColumn}>
          <View style={[styles.headerRow, { marginBottom: 2 }]}>
            <AppText variant="label" size="sm" weight="semibold">
              Neuro Check-in
            </AppText>
            <AppText variant="body" size="sm" color="secondary">
              9:00
            </AppText>
          </View>
          <AppText variant="body" size="sm" color="secondary">
            Ein kurzer Moment für dich — wenn du magst.
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
