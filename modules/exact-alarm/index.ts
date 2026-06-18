import { requireNativeModule } from 'expo';

/**
 * Native bridge for Android's exact-alarm special access (SCHEDULE_EXACT_ALARM).
 * Android-only — registered for the "android" platform in expo-module.config.json.
 */
export interface ExactAlarmNativeModule {
  /** AlarmManager.canScheduleExactAlarms(); true on API < 31 (no restriction). */
  isExactAlarmAllowed(): boolean;
  /** Opens the system "Alarms & reminders" screen for this app (API 31+). */
  openExactAlarmSettings(): void;
}

export default requireNativeModule<ExactAlarmNativeModule>('ExactAlarm');
