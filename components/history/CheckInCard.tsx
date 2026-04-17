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
          padding: spacing.md,
          marginBottom: spacing.sm,
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
            fontSize: typography.sizes.md,
            color: theme.colors.text,
          }}
        >
          {formatDate(checkIn.createdAt)}
        </Text>
        <View style={styles.headerRight}>
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.sm,
              color: theme.colors.textSecondary,
            }}
          >
            {formatTime(checkIn.createdAt)}
          </Text>
          <Text
            style={{
              fontFamily: typography.families.ui.medium,
              fontSize: typography.sizes.lg,
              color: theme.colors.border,
              marginLeft: spacing.xs,
            }}
            accessibilityElementsHidden
          >
            ›
          </Text>
        </View>
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
              fontSize: typography.sizes.lg,
              color: theme.colors.primary,
            }}
          >
            {getLevelLabel(checkIn.focusLevel, FOCUS_LABELS)}
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
            Signale
          </Text>
          <Text
            style={{
              fontFamily: typography.families.ui.semibold,
              fontSize: typography.sizes.lg,
              color: activeSignals > 0 ? theme.colors.accent : theme.colors.textSecondary,
            }}
          >
            {activeSignals > 0 ? activeSignals : '—'}
          </Text>
        </View>
      </View>

      <Text
        numberOfLines={1}
        style={{
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.sm,
          color: checkIn.feelings.trim() !== '' ? theme.colors.textSecondary : theme.colors.border,
          marginTop: spacing.sm,
          fontStyle: checkIn.feelings.trim() !== '' ? 'normal' : 'italic',
        }}
      >
        {checkIn.feelings.trim() !== '' ? checkIn.feelings : 'Keine Gefühle angegeben'}
      </Text>
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
