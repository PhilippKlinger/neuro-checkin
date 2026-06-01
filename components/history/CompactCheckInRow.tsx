import { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../lib/hooks/useTheme';
import { CheckIn, ENERGY_LABELS, FOCUS_LABELS, getLevelLabel } from '../../lib/types/checkin';
import { formatDate, formatTime } from '../../lib/utils/format';
import { ENERGY_COLORS } from '../../lib/constants/energyColors';

interface CompactCheckInRowProps {
  checkIn: CheckIn;
  onPress: (id: number) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: (id: number) => void;
  showFullDate?: boolean;
}

export const CompactCheckInRow = memo(function CompactCheckInRow({
  checkIn,
  onPress,
  selectable = false,
  selected = false,
  onToggle,
  showFullDate = true,
}: CompactCheckInRowProps) {
  const { theme, spacing, radii, shadows } = useTheme();

  const energyColor = ENERGY_COLORS[checkIn.energyLevel - 1] ?? ENERGY_COLORS[2];
  const activeSignals = Object.values(checkIn.bodySignals).filter((v) => v === true).length;

  const dateLabel = showFullDate
    ? `${formatDate(checkIn.createdAt)} — ${formatTime(checkIn.createdAt)}`
    : formatTime(checkIn.createdAt);

  const parts: string[] = [];
  if (!checkIn.energySkipped) parts.push(getLevelLabel(checkIn.energyLevel, ENERGY_LABELS));
  if (!checkIn.focusSkipped) parts.push(getLevelLabel(checkIn.focusLevel, FOCUS_LABELS));
  if (activeSignals > 0)
    parts.push(`${activeSignals} ${activeSignals === 1 ? 'Signal' : 'Signale'}`);
  const subtitle = parts.join(' / ');

  return (
    <Pressable
      onPress={() => (selectable ? onToggle?.(checkIn.id) : onPress(checkIn.id))}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: selected ? theme.colors.accentSoft : theme.colors.card,
          borderRadius: radii.sm,
          paddingHorizontal: spacing.sm + spacing.xs,
          paddingVertical: spacing.sm,
          marginBottom: spacing.xs,
          borderWidth: 1,
          borderColor: selected ? theme.colors.accent : theme.colors.border,
          ...(selected ? {} : shadows.sm),
        },
        pressed && { opacity: 0.75 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Check-in ${formatDate(checkIn.createdAt)}, ${subtitle}`}
      accessibilityHint={
        selectable
          ? selected
            ? 'Ausgewählt. Tippen zum Abwählen.'
            : 'Tippen zum Auswählen.'
          : 'Tippen für Details'
      }
      accessibilityState={selectable ? { selected } : undefined}
    >
      <View style={[styles.dot, { backgroundColor: energyColor }]} />
      <View style={styles.content}>
        <AppText variant="label" size="sm" numberOfLines={1}>
          {dateLabel}
        </AppText>
        <AppText variant="body" size="xs" color="secondary" numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <AppText variant="label" style={{ color: theme.colors.border }} accessibilityElementsHidden>
        ›
      </AppText>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
});
