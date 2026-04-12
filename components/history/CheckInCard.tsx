import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { CheckIn } from '../../lib/types/checkin';
import { formatDate, formatTime } from '../../lib/utils/format';

interface CheckInCardProps {
  checkIn: CheckIn;
  onPress: () => void;
}

export function CheckInCard({ checkIn, onPress }: CheckInCardProps) {
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
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Check-in vom ${formatDate(checkIn.createdAt)}`}
      accessibilityHint="Tippen fuer Details"
    >
      <View style={styles.header}>
        <Text
          style={{
            fontFamily: typography.families.ui.medium,
            fontSize: typography.sizes.md,
            color: theme.colors.text,
          }}
        >
          {formatDate(checkIn.createdAt)}
        </Text>
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.sm,
            color: theme.colors.textSecondary,
          }}
        >
          {formatTime(checkIn.createdAt)}
        </Text>
      </View>

      <View style={[styles.metricsRow, { marginTop: spacing.sm, gap: spacing.lg }]}>
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
              fontSize: typography.sizes.lg,
              color: theme.colors.primary,
            }}
          >
            {checkIn.energyLevel}
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
              fontSize: typography.sizes.lg,
              color: theme.colors.primary,
            }}
          >
            {checkIn.focusLevel}
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
                fontSize: typography.sizes.lg,
                color: theme.colors.accent,
              }}
            >
              {activeSignals}
            </Text>
          </View>
        )}
      </View>

      {checkIn.feelings.trim() !== '' && (
        <Text
          numberOfLines={1}
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.sm,
            color: theme.colors.textSecondary,
            marginTop: spacing.sm,
          }}
        >
          {checkIn.feelings}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
