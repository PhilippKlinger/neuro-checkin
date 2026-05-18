// Covers updateSettings fields not reached in settings.db.test.ts:
// reminderTime, language, tutorialOffered/Seen, guidedToggleIntroduced, detailViewIntroduced.

import { updateSettings } from '../lib/database/settings';

function makeDb() {
  return {
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 0, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
  };
}

describe('updateSettings — remaining fields', () => {
  it('sets reminder_time to a time string', async () => {
    const db = makeDb();
    await updateSettings(db as any, { reminderTime: '07:30' });
    const sql: string = db.runAsync.mock.calls[0][0];
    expect(sql).toMatch(/reminder_time = \?/);
    expect(db.runAsync.mock.calls[0]).toContain('07:30');
  });

  it('sets reminder_time to null', async () => {
    const db = makeDb();
    await updateSettings(db as any, { reminderTime: null });
    expect(db.runAsync.mock.calls[0]).toContain(null);
  });

  it('sets language', async () => {
    const db = makeDb();
    await updateSettings(db as any, { language: 'en' });
    const sql: string = db.runAsync.mock.calls[0][0];
    expect(sql).toMatch(/language = \?/);
    expect(db.runAsync.mock.calls[0]).toContain('en');
  });

  it('sets tutorialOffered', async () => {
    const db = makeDb();
    await updateSettings(db as any, { tutorialOffered: true });
    const sql: string = db.runAsync.mock.calls[0][0];
    expect(sql).toMatch(/tutorial_offered = \?/);
    expect(db.runAsync.mock.calls[0]).toContain(1);
  });

  it('sets tutorialSeen', async () => {
    const db = makeDb();
    await updateSettings(db as any, { tutorialSeen: false });
    const sql: string = db.runAsync.mock.calls[0][0];
    expect(sql).toMatch(/tutorial_seen = \?/);
    expect(db.runAsync.mock.calls[0]).toContain(0);
  });

  it('sets guidedToggleIntroduced', async () => {
    const db = makeDb();
    await updateSettings(db as any, { guidedToggleIntroduced: true });
    const sql: string = db.runAsync.mock.calls[0][0];
    expect(sql).toMatch(/guided_toggle_introduced = \?/);
  });

  it('sets detailViewIntroduced', async () => {
    const db = makeDb();
    await updateSettings(db as any, { detailViewIntroduced: true });
    const sql: string = db.runAsync.mock.calls[0][0];
    expect(sql).toMatch(/detail_view_introduced = \?/);
  });
});
