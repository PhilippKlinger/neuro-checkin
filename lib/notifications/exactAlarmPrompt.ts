/**
 * Decides whether to surface the exact-alarm opt-in dialog when a user enables a
 * reminder slot. Pure logic so the "when does it bother the user" rule is testable.
 *
 * The dialog is just-in-time (at slot-enable), never a permanent settings hint — it
 * appears only while the SCHEDULE_EXACT_ALARM special access is still missing on a
 * real Android device, and disappears for good once granted.
 */
export interface ExactAlarmPromptState {
  platform: string; // Platform.OS
  isDevice: boolean; // Device.isDevice — notifications never fire on an emulator
  exactAllowed: boolean; // AlarmManager.canScheduleExactAlarms()
}

export function shouldPromptExactAlarm({
  platform,
  isDevice,
  exactAllowed,
}: ExactAlarmPromptState): boolean {
  if (platform !== 'android') return false;
  if (!isDevice) return false;
  return !exactAllowed;
}
