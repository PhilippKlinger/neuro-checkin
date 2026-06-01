import { getSettings, updateSettings } from '../lib/database/settings';

function makeDb(overrides: Record<string, jest.Mock> = {}) {
  return {
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 0, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

// A fully populated settings row as expo-sqlite would return it
const FULL_ROW = {
  id: 1,
  theme_name: 'coolMist',
  color_mode: 'dark',
  reminder_enabled: 1,
  reminder_time: '08:00',
  language: 'de',
  onboarding_completed: 1,
  guided_mode_enabled: 1,
  last_active_date: '2026-05-18',
  detail_view_introduced: 1,
};

// ---------------------------------------------------------------------------
// getSettings — no row (fresh install)
// ---------------------------------------------------------------------------

describe('getSettings — no row exists', () => {
  it('returns default settings when no DB row is found', async () => {
    const db = makeDb();
    const settings = await getSettings(db as any);
    expect(settings.id).toBe(1);
    expect(settings.themeName).toBe('warmEarth');
    expect(settings.colorMode).toBe('light');
    expect(settings.reminderEnabled).toBe(false);
    expect(settings.reminderTime).toBeNull();
    expect(settings.language).toBe('de');
    expect(settings.onboardingCompleted).toBe(false);
    expect(settings.guidedModeEnabled).toBe(true);
    expect(settings.lastActiveDate).toBeNull();
    expect(settings.detailViewIntroduced).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getSettings — row present
// ---------------------------------------------------------------------------

describe('getSettings — row exists', () => {
  it('maps all DB columns to camelCase fields', async () => {
    const db = makeDb({ getFirstAsync: jest.fn().mockResolvedValue(FULL_ROW) });
    const settings = await getSettings(db as any);
    expect(settings.themeName).toBe('coolMist');
    expect(settings.colorMode).toBe('dark');
    expect(settings.reminderEnabled).toBe(true);
    expect(settings.reminderTime).toBe('08:00');
    expect(settings.language).toBe('de');
    expect(settings.onboardingCompleted).toBe(true);
    expect(settings.guidedModeEnabled).toBe(true);
    expect(settings.lastActiveDate).toBe('2026-05-18');
    expect(settings.detailViewIntroduced).toBe(true);
  });

  it('converts SQLite integer 1/0 to boolean true/false', async () => {
    const row = {
      ...FULL_ROW,
      reminder_enabled: 0,
      onboarding_completed: 0,
      guided_mode_enabled: 0,
    };
    const db = makeDb({ getFirstAsync: jest.fn().mockResolvedValue(row) });
    const settings = await getSettings(db as any);
    expect(settings.reminderEnabled).toBe(false);
    expect(settings.onboardingCompleted).toBe(false);
    expect(settings.guidedModeEnabled).toBe(false);
  });

  it('falls back to "light" when color_mode is null', async () => {
    const row = { ...FULL_ROW, color_mode: null };
    const db = makeDb({ getFirstAsync: jest.fn().mockResolvedValue(row) });
    const settings = await getSettings(db as any);
    expect(settings.colorMode).toBe('light');
  });

  it('falls back to guidedModeEnabled=true when column is null (pre-v9 row)', async () => {
    const row = { ...FULL_ROW, guided_mode_enabled: null };
    const db = makeDb({ getFirstAsync: jest.fn().mockResolvedValue(row) });
    const settings = await getSettings(db as any);
    expect(settings.guidedModeEnabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateSettings — SQL building
// ---------------------------------------------------------------------------

describe('updateSettings', () => {
  it('does nothing when called with an empty object', async () => {
    const db = makeDb();
    await updateSettings(db as any, {});
    expect(db.runAsync).not.toHaveBeenCalled();
  });

  it('builds a SET clause only for the provided fields', async () => {
    const db = makeDb();
    await updateSettings(db as any, { themeName: 'softSage' });
    const sql: string = db.runAsync.mock.calls[0][0];
    expect(sql).toMatch(/theme_name = \?/);
    expect(sql).not.toMatch(/color_mode/);
  });

  it('passes the correct value for themeName', async () => {
    const db = makeDb();
    await updateSettings(db as any, { themeName: 'softSage' });
    const args = db.runAsync.mock.calls[0];
    expect(args).toContain('softSage');
  });

  it('converts boolean true to 1', async () => {
    const db = makeDb();
    await updateSettings(db as any, { reminderEnabled: true });
    const args = db.runAsync.mock.calls[0];
    expect(args).toContain(1);
  });

  it('converts boolean false to 0', async () => {
    const db = makeDb();
    await updateSettings(db as any, { reminderEnabled: false });
    const args = db.runAsync.mock.calls[0];
    expect(args).toContain(0);
  });

  it('passes null for lastActiveDate = null', async () => {
    const db = makeDb();
    await updateSettings(db as any, { lastActiveDate: null });
    const args = db.runAsync.mock.calls[0];
    expect(args).toContain(null);
  });

  it('includes WHERE id = 1 in the SQL', async () => {
    const db = makeDb();
    await updateSettings(db as any, { onboardingCompleted: true });
    const sql: string = db.runAsync.mock.calls[0][0];
    expect(sql).toMatch(/WHERE id = 1/);
  });

  it('updates multiple fields in a single query', async () => {
    const db = makeDb();
    await updateSettings(db as any, {
      themeName: 'warmEarth',
      colorMode: 'dark',
      guidedModeEnabled: false,
    });
    expect(db.runAsync).toHaveBeenCalledTimes(1);
    const sql: string = db.runAsync.mock.calls[0][0];
    expect(sql).toMatch(/theme_name = \?/);
    expect(sql).toMatch(/color_mode = \?/);
    expect(sql).toMatch(/guided_mode_enabled = \?/);
  });
});
