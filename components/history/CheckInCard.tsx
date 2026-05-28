import { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../lib/hooks/useTheme';
import { CheckIn, ENERGY_LABELS, FOCUS_LABELS, getLevelLabel } from '../../lib/types/checkin';
import { formatDate, formatTime } from '../../lib/utils/format';

interface CheckInCardProps {
  checkIn: CheckIn;
  onPress: (id: number) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: (id: number) => void;
}

export const CheckInCard = memo(function CheckInCard({
  checkIn,
  onPress,
  selectable = false,
  selected = false,
  onToggle,
}: CheckInCardProps) {
  const { theme, spacing, radii, shadows } = useTheme();

  const activeSignals = Object.values(checkIn.bodySignals).filter((v) => v === true).length;

  return (
    <Pressable
      onPress={() => (selectable ? onToggle?.(checkIn.id) : onPress(checkIn.id))}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected ? theme.colors.accentSoft : theme.colors.card,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          marginBottom: spacing.xs,
          borderWidth: 1,
          borderColor: selected ? theme.colors.accent : theme.colors.border,
          ...(selected ? {} : shadows.md),
        },
        pressed && { opacity: 0.75 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Check-in vom ${formatDate(checkIn.createdAt)}`}
      accessibilityHint={
        selectable
          ? selected
            ? 'Ausgewählt. Tippen zum Abwählen.'
            : 'Tippen zum Auswählen.'
          : 'Tippen für Details'
      }
      accessibilityState={selectable ? { selected } : undefined}
    >
      <View style={styles.header}>
        <AppText variant="label" size="sm">
          {formatDate(checkIn.createdAt)}
        </AppText>
        <View style={styles.headerRight}>
          <AppText variant="body" size="xs" color="secondary">
            {formatTime(checkIn.createdAt)}
          </AppText>
          <AppText
            variant="label"
            style={{ color: theme.colors.border, marginLeft: spacing.xs }}
            accessibilityElementsHidden
          >
            ›
          </AppText>
        </View>
      </View>

      <View style={[styles.metricsRow, { marginTop: spacing.xs, gap: spacing.md }]}>
        <View style={styles.metric}>
          <AppText variant="body" size="xs" color="secondary">
            Energie
          </AppText>
          <AppText variant="label" weight="semibold" size="sm" color="accent">
            {getLevelLabel(checkIn.energyLevel, ENERGY_LABELS)}
          </AppText>
        </View>

        <View style={styles.metric}>
          <AppText variant="body" size="xs" color="secondary">
            Fokus
          </AppText>
          <AppText variant="label" weight="semibold" size="sm" color="accent">
            {getLevelLabel(checkIn.focusLevel, FOCUS_LABELS)}
          </AppText>
        </View>

        {activeSignals > 0 && (
          <View style={styles.metric}>
            <AppText variant="body" size="xs" color="secondary">
              Signale
            </AppText>
            <AppText variant="label" weight="semibold" size="sm" color="accent">
              {activeSignals}
            </AppText>
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
