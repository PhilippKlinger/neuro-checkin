import { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { CheckIn, ENERGY_LABELS, FOCUS_LABELS, getLevelLabel } from '../../lib/types/checkin';
import { formatDate, formatTime } from '../../lib/utils/format';

interface CheckInCardProps {
  checkIn: CheckIn;
  onPress: () => void;
}

export const CheckInCard = memo(function CheckInCard({ checkIn, onPress }: CheckInCardProps) {
  const { theme, spacing, typography, radii } = useTheme();

  const activeSignals = Object.values(checkIn.bodySignals).filter(
    (v) => v === true
  ).length;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          marginBottom: spacing.xs,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Check-in vom ${formatDate(checkIn.createdAt)}`}
      accessibilityHint="Tippen für Details"
    >
      <View style={styles.header}>
        <Text
          style={{
            fontFamily: typography.families.ui.medium,
            fontSize: typography.sizes.sm,
            color: theme.colors.text,
          }}
        >
          {formatDate(checkIn.createdAt)}
        </Text>
        <View style={styles.headerRight}>
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.xs,
              color: theme.colors.textSecondary,
            }}
          >
            {formatTime(checkIn.createdAt)}
          </Text>
          <Text
            style={{
              fontFamily: typography.families.ui.medium,
              fontSize: typography.sizes.md,
              color: theme.colors.border,
              marginLeft: spacing.xs,
            }}
            accessibilityElementsHidden
          >
            ›
          </Text>
        </View>
      </View>

      <View style={[styles.metricsRow, { marginTop: spacing.xs, gap: spacing.md }]}>
        <View style={styles.metric}>
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.xs,
              color: theme.colors.textSecondary,
            }}
          >
            Energie
          </Text>
          <Text
            style={{
              fontFamily: typography.families.ui.semibold,
              fontSize: typography.sizes.sm,
              color: theme.colors.primary,
            }}
          >
            {getLevelLabel(checkIn.energyLevel, ENERGY_LABELS)}
          </Text>
        </View>

        <View style={styles.metric}>
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.xs,
              color: theme.colors.textSecondary,
            }}
          >
            Fokus
          </Text>
          <Text
            style={{
              fontFamily: typography.families.ui.semibold,
              fontSize: typography.sizes.sm,
              color: theme.colors.primary,
            }}
          >
            {getLevelLabel(checkIn.focusLevel, FOCUS_LABELS)}
          </Text>
        </View>

        {activeSignals > 0 && (
          <View style={styles.metric}>
            <Text
              style={{
                fontFamily: typography.families.body.regular,
                fontSize: typography.sizes.xs,
                color: theme.colors.textSecondary,
              }}
            >
              Signale
            </Text>
            <Text
              style={{
                fontFamily: typography.families.ui.semibold,
                fontSize: typography.sizes.sm,
                color: theme.colors.accent,
              }}
            >
              {activeSignals}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metric: {
    alignItems: 'center',
  },
});
