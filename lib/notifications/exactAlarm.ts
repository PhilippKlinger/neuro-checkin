import { Platform } from 'react-native';
import type { ExactAlarmNativeModule } from '../../modules/exact-alarm';

// Lazily resolved so a missing native module (before a fresh build, or in the Jest
// environment) never throws at JS import time. `undefined` = not yet resolved,
// `null` = resolution failed.
let nativeModule: ExactAlarmNativeModule | null | undefined;

function getNative(): ExactAlarmNativeModule | null {
  if (nativeModule !== undefined) return nativeModule;
  try {
    nativeModule = require('../../modules/exact-alarm').default as ExactAlarmNativeModule;
  } catch {
    nativeModule = null;
  }
  return nativeModule;
}

/**
 * Whether the OS currently allows this app to schedule exact alarms. Android-only;
 * fails open (true) on other platforms or on a read error so reminders are never
 * blocked by a capability check.
 */
export function isExactAlarmAllowed(): boolean {
  if (Platform.OS !== 'android') return true;
  const native = getNative();
  if (!native) return true;
  try {
    return native.isExactAlarmAllowed();
  } catch (error) {
    console.error('isExactAlarmAllowed failed:', error);
    return true;
  }
}

/** Opens the system "Alarms & reminders" special-access screen for this app. */
export function openExactAlarmSettings(): void {
  if (Platform.OS !== 'android') return;
  const native = getNative();
  if (!native) return;
  try {
    native.openExactAlarmSettings();
  } catch (error) {
    console.error('openExactAlarmSettings failed:', error);
  }
}
