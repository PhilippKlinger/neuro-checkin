import type { SQLiteDatabase } from 'expo-sqlite';
import type { UserSettings } from '../types/checkin';

const VALID_THEMES = ['warmEarth', 'coolMist', 'softSage'] as const;
const VALID_COLOR_MODES = ['light', 'dark', 'system'] as const;
const VALID_FONTS = ['lexend', 'atkinson', 'nunito'] as const;
const VALID_VIEW_MODES = ['compact', 'cards'] as const;

function validateEnum<T extends string>(value: string | null | undefined, valid: readonly T[], fallback: T): T {
  if (value && (valid as readonly string[]).includes(value)) return value as T;
  return fallback;
}

export async function getSettings(db: SQLiteDatabase): Promise<UserSettings> {
  const row = await db.getFirstAsync<{
    id: number;
    theme_name: string;
    color_mode: string | null;
    reminder_enabled: number;
    reminder_time: string | null;
    language: string;
    onboarding_completed: number;
    guided_mode_enabled: number;
    last_active_date: string | null;
    detail_view_introduced: number;
    export_directory_uri: string | null;
    font_family: string | null;
    reflection_enabled: number;
    history_view_mode: string | null;
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
      guidedModeEnabled: true,
      lastActiveDate: null,
      detailViewIntroduced: false,
      exportDirectoryUri: null,
      fontFamily: 'lexend',
      reflectionEnabled: true,
      historyViewMode: 'compact',
    };
  }

  return {
    id: row.id,
    themeName: validateEnum(row.theme_name, VALID_THEMES, 'warmEarth'),
    colorMode: validateEnum(row.color_mode, VALID_COLOR_MODES, 'light'),
    reminderEnabled: row.reminder_enabled === 1,
    reminderTime: row.reminder_time,
    language: row.language as 'de' | 'en',
    onboardingCompleted: row.onboarding_completed === 1,
    guidedModeEnabled: (row.guided_mode_enabled ?? 1) === 1,
    lastActiveDate: row.last_active_date ?? null,
    detailViewIntroduced: row.detail_view_introduced === 1,
    exportDirectoryUri: row.export_directory_uri ?? null,
    fontFamily: validateEnum(row.font_family, VALID_FONTS, 'lexend'),
    reflectionEnabled: (row.reflection_enabled ?? 1) === 1,
    historyViewMode: validateEnum(row.history_view_mode, VALID_VIEW_MODES, 'compact'),
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
  if (settings.guidedModeEnabled !== undefined) {
    updates.push('guided_mode_enabled = ?');
    values.push(settings.guidedModeEnabled ? 1 : 0);
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
  if (settings.reflectionEnabled !== undefined) {
    updates.push('reflection_enabled = ?');
    values.push(settings.reflectionEnabled ? 1 : 0);
  }
  if (settings.historyViewMode !== undefined) {
    updates.push('history_view_mode = ?');
    values.push(settings.historyViewMode);
  }

  if (updates.length > 0) {
    await db.runAsync(`UPDATE user_settings SET ${updates.join(', ')} WHERE id = 1`, ...values);
  }
}
