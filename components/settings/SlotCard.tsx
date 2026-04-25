import { useState } from 'react';
import { View, Text, Switch, Pressable, Platform, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../lib/hooks/useTheme';
import { type NotificationSlot, WEEKDAY_LABELS, WEEKDAY_BITS, ALL_WEEKDAYS, WORKDAYS } from '../../lib/types/checkin';
import { timeStringToDate } from '../../lib/utils/time';

export interface SlotCardProps {
  slot: NotificationSlot;
  label: string;
  showTimePicker: boolean;
  onToggle: (value: boolean) => void;
  onTimePress: () => void;
  onTimeChange: (event: DateTimePickerEvent, date?: Date) => void;
  onWeekdayToggle: (bitIndex: number) => void;
}

function weekdaySummary(weekdays: number): string {
  if (weekdays === ALL_WEEKDAYS) return 'täglich';
  if (weekdays === WORKDAYS) return 'Mo–Fr';
  return WEEKDAY_LABELS.filter((_, i) => (weekdays & WEEKDAY_BITS[i]) !== 0).join(' ');
}

export function SlotCard({
  slot,
  label,
  showTimePicker,
  onToggle,
  onTimePress,
  onTimeChange,
  onWeekdayToggle,
}: SlotCardProps) {
  const { theme, spacing, typography, radii, touchTarget } = useTheme();
  const [weekdayExpanded, setWeekdayExpanded] = useState(false);
  const pickerDate = timeStringToDate(slot.time);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: radii.md,
          padding: spacing.md,
          marginBottom: spacing.sm,
          borderWidth: 1,
          borderColor: slot.enabled ? theme.colors.accent : theme.colors.border,
        },
      ]}
    >
      {/* Header row: label + switch */}
      <View style={styles.row}>
        <Text
          style={{
            fontFamily: typography.families.ui.medium,
            fontSize: typography.sizes.md,
            color: theme.colors.text,
            flex: 1,
          }}
        >
          {label}
        </Text>
        <Switch
          value={slot.enabled}
          onValueChange={onToggle}
          trackColor={{
            false: theme.colors.border,
            true: theme.colors.accentSoft,
          }}
          thumbColor={slot.enabled ? theme.colors.accent : theme.colors.surface}
          accessibilityLabel={label}
          accessibilityRole="switch"
          accessibilityHint={slot.enabled ? 'Erinnerung deaktivieren' : 'Erinnerung aktivieren'}
        />
      </View>

      {slot.enabled && (
        <>
          {/* Summary line */}
          <Text
            style={{
              fontFamily: typography.families.body.regular,
              fontSize: typography.sizes.sm,
              color: theme.colors.accent,
              marginTop: spacing.xs,
            }}
            accessibilityLiveRegion="polite"
          >
            um {slot.time}, {weekdaySummary(slot.weekdays)}
          </Text>

          {/* Time row */}
          <View style={[styles.row, { marginTop: spacing.sm }]}>
            <Text
              style={{
                fontFamily: typography.families.body.regular,
                fontSize: typography.sizes.sm,
                color: theme.colors.textSecondary,
                flex: 1,
              }}
            >
              Uhrzeit
            </Text>

            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={pickerDate}
                mode="time"
                display="default"
                accentColor={theme.colors.accent}
                onChange={onTimeChange}
                accessibilityLabel="Erinnerungszeit auswählen"
              />
            ) : (
              <>
                <Pressable
                  onPress={onTimePress}
                  style={[
                    styles.timeButton,
                    {
                      backgroundColor: theme.colors.accentSoft,
                      borderRadius: radii.sm,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      minHeight: touchTarget.min,
                      justifyContent: 'center',
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Uhrzeit: ${slot.time}. Tippen zum Ändern`}
                >
                  <Text
                    style={{
                      fontFamily: typography.families.ui.medium,
                      fontSize: typography.sizes.md,
                      color: theme.colors.accent,
                    }}
                  >
                    {slot.time}
                  </Text>
                </Pressable>
                {showTimePicker && (
                  <DateTimePicker
                    value={pickerDate}
                    mode="time"
                    display="default"
                    accentColor={theme.colors.accent}
                    onChange={onTimeChange}
                    accessibilityLabel="Erinnerungszeit auswählen"
                  />
                )}
              </>
            )}
          </View>

          {/* Progressive disclosure: weekday chips */}
          <Pressable
            onPress={() => setWeekdayExpanded((v) => !v)}
            style={{
              marginTop: spacing.sm,
              alignSelf: 'flex-start',
              minHeight: touchTarget.min,
              paddingVertical: spacing.xs,
              justifyContent: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="Wochentage anpassen"
            accessibilityState={{ expanded: weekdayExpanded }}
          >
            <Text
              style={{
                fontFamily: typography.families.ui.medium,
                fontSize: typography.sizes.sm,
                color: theme.colors.textSecondary,
                textDecorationLine: 'underline',
              }}
            >
              Wochentage anpassen
            </Text>
          </Pressable>

          {weekdayExpanded && (
            <View style={[styles.weekdayRow, { marginTop: spacing.sm, gap: spacing.xs }]}>
              {WEEKDAY_LABELS.map((dayLabel, i) => {
                const isActive = (slot.weekdays & WEEKDAY_BITS[i]) !== 0;
                return (
                  <Pressable
                    key={dayLabel}
                    onPress={() => onWeekdayToggle(i)}
                    style={[
                      styles.dayChip,
                      {
                        borderRadius: radii.full,
                        borderWidth: 1,
                        borderColor: isActive ? theme.colors.accent : theme.colors.border,
                        backgroundColor: isActive
                          ? theme.colors.accentSoft
                          : theme.colors.background,
                        minWidth: touchTarget.min,
                        minHeight: touchTarget.min,
                        paddingHorizontal: spacing.xs,
                        justifyContent: 'center',
                        alignItems: 'center',
                      },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityLabel={`Wochentag ${dayLabel}`}
                    accessibilityState={{ checked: isActive }}
                  >
                    <Text
                      style={{
                        fontFamily: typography.families.ui.medium,
                        fontSize: typography.sizes.xs,
                        color: isActive ? theme.colors.text : theme.colors.textSecondary,
                      }}
                    >
                      {dayLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeButton: {
    alignItems: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayChip: {},
});
