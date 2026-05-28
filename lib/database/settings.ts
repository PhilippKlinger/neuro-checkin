import type { SQLiteDatabase } from 'expo-sqlite';
import type { UserSettings, FontFamily } from '../types/checkin';

export async function getSettings(db: SQLiteDatabase): Promise<UserSettings> {
  const row = await db.getFirstAsync<{
    id: number;
    theme_name: string;
    color_mode: string | null;
    reminder_enabled: number;
    reminder_time: string | null;
    language: string;
    onboarding_completed: number;
    tutorial_offered: number;
    tutorial_seen: number;
    guided_mode_enabled: number;
    guided_toggle_introduced: number;
    last_active_date: string | null;
    detail_view_introduced: number;
    export_directory_uri: string | null;
    font_family: string | null;
  }>('SELECT * FROM user_settings WHERE id = 1');

  if (!row) {
    return {
      id: 1,
      themeName: 'warmEarth',
      colorMode: 'light',
      reminderEnabled: false,
      reminderTime: null,
      language: 'de',
      onboardingCompleted: false,
      tutorialOffered: false,
      tutorialSeen: false,
      guidedModeEnabled: true,
      guidedToggleIntroduced: false,
      lastActiveDate: null,
      detailViewIntroduced: false,
      exportDirectoryUri: null,
      fontFamily: 'lexend',
    };
  }

  return {
    id: row.id,
    themeName: row.theme_name,
    colorMode: (row.color_mode as UserSettings['colorMode']) ?? 'light',
    reminderEnabled: row.reminder_enabled === 1,
    reminderTime: row.reminder_time,
    language: row.language as 'de' | 'en',
    onboardingCompleted: row.onboarding_completed === 1,
    tutorialOffered: row.tutorial_offered === 1,
    tutorialSeen: row.tutorial_seen === 1,
    guidedModeEnabled: (row.guided_mode_enabled ?? 1) === 1,
    guidedToggleIntroduced: row.guided_toggle_introduced === 1,
    lastActiveDate: row.last_active_date ?? null,
    detailViewIntroduced: row.detail_view_introduced === 1,
    exportDirectoryUri: row.export_directory_uri ?? null,
    fontFamily: (row.font_family as FontFamily) ?? 'lexend',
  };
}

export async function updateSettings(
  db: SQLiteDatabase,
  settings: Partial<Omit<UserSettings, 'id'>>
): Promise<void> {
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (settings.themeName !== undefined) {
    updates.push('theme_name = ?');
    values.push(settings.themeName);
  }
  if (settings.colorMode !== undefined) {
    updates.push('color_mode = ?');
    values.push(settings.colorMode);
  }
  if (settings.reminderEnabled !== undefined) {
    updates.push('reminder_enabled = ?');
    values.push(settings.reminderEnabled ? 1 : 0);
  }
  if (settings.reminderTime !== undefined) {
    updates.push('reminder_time = ?');
    values.push(settings.reminderTime ?? null);
  }
  if (settings.language !== undefined) {
    updates.push('language = ?');
    values.push(settings.language);
  }
  if (settings.onboardingCompleted !== undefined) {
    updates.push('onboarding_completed = ?');
    values.push(settings.onboardingCompleted ? 1 : 0);
  }
  if (settings.tutorialOffered !== undefined) {
    updates.push('tutorial_offered = ?');
    values.push(settings.tutorialOffered ? 1 : 0);
  }
  if (settings.tutorialSeen !== undefined) {
    updates.push('tutorial_seen = ?');
    values.push(settings.tutorialSeen ? 1 : 0);
  }
  if (settings.guidedModeEnabled !== undefined) {
    updates.push('guided_mode_enabled = ?');
    values.push(settings.guidedModeEnabled ? 1 : 0);
  }
  if (settings.guidedToggleIntroduced !== undefined) {
    updates.push('guided_toggle_introduced = ?');
    values.push(settings.guidedToggleIntroduced ? 1 : 0);
  }
  if (settings.lastActiveDate !== undefined) {
    updates.push('last_active_date = ?');
    values.push(settings.lastActiveDate ?? null);
  }
  if (settings.detailViewIntroduced !== undefined) {
    updates.push('detail_view_introduced = ?');
    values.push(settings.detailViewIntroduced ? 1 : 0);
  }
  if (settings.exportDirectoryUri !== undefined) {
    updates.push('export_directory_uri = ?');
    values.push(settings.exportDirectoryUri ?? null);
  }
  if (settings.fontFamily !== undefined) {
    updates.push('font_family = ?');
    values.push(settings.fontFamily);
  }

  if (updates.length > 0) {
    await db.runAsync(`UPDATE user_settings SET ${updates.join(', ')} WHERE id = 1`, ...values);
  }
}
