import type { SQLiteDatabase } from 'expo-sqlite';
import type { UserSettings } from '../types/checkin';

export async function getSettings(db: SQLiteDatabase): Promise<UserSettings> {
  const row = await db.getFirstAsync<{
    id: number;
    theme_name: string;
    reminder_enabled: number;
    reminder_time: string | null;
    language: string;
    onboarding_completed: number;
  }>('SELECT * FROM user_settings WHERE id = 1');

  if (!row) {
    return {
      id: 1,
      themeName: 'warmEarth',
      reminderEnabled: false,
      reminderTime: null,
      language: 'de',
      onboardingCompleted: false,
    };
  }

  return {
    id: row.id,
    themeName: row.theme_name,
    reminderEnabled: row.reminder_enabled === 1,
    reminderTime: row.reminder_time,
    language: row.language as 'de' | 'en',
    onboardingCompleted: row.onboarding_completed === 1,
  };
}

export async function updateSettings(
  db: SQLiteDatabase,
  settings: Partial<Omit<UserSettings, 'id'>>
): Promise<void> {
  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (settings.themeName !== undefined) {
    updates.push('theme_name = ?');
    values.push(settings.themeName);
  }
  if (settings.reminderEnabled !== undefined) {
    updates.push('reminder_enabled = ?');
    values.push(settings.reminderEnabled ? 1 : 0);
  }
  if (settings.reminderTime !== undefined) {
    updates.push('reminder_time = ?');
    values.push(settings.reminderTime ?? '');
  }
  if (settings.language !== undefined) {
    updates.push('language = ?');
    values.push(settings.language);
  }
  if (settings.onboardingCompleted !== undefined) {
    updates.push('onboarding_completed = ?');
    values.push(settings.onboardingCompleted ? 1 : 0);
  }

  if (updates.length > 0) {
    await db.runAsync(
      `UPDATE user_settings SET ${updates.join(', ')} WHERE id = 1`,
      ...values
    );
  }
}
