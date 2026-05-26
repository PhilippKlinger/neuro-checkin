import { getNotificationSlots, saveNotificationSlot } from '../lib/database/notificationQueries';
import { ALL_WEEKDAYS } from '../lib/types/checkin';
import type { NotificationSlot } from '../lib/types/checkin';

function makeDb(overrides: Record<string, jest.Mock> = {}) {
  return {
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 0, changes: 1 }),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

const SLOT_ROWS = [
  { id: 0, enabled: 1, time: '09:00', weekdays: 127 },
  { id: 1, enabled: 0, time: '20:00', weekdays: 31 },
];

// ---------------------------------------------------------------------------
// getNotificationSlots
// ---------------------------------------------------------------------------

describe('getNotificationSlots', () => {
  it('returns an empty array when no rows exist', async () => {
    const db = makeDb();
    const result = await getNotificationSlots(db as any);
    expect(result).toEqual([]);
  });

  it('maps enabled=1 to boolean true', async () => {
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue(SLOT_ROWS) });
    const slots = await getNotificationSlots(db as any);
    expect(slots[0].enabled).toBe(true);
  });

  it('maps enabled=0 to boolean false', async () => {
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue(SLOT_ROWS) });
    const slots = await getNotificationSlots(db as any);
    expect(slots[1].enabled).toBe(false);
  });

  it('preserves the weekdays bitmask', async () => {
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue(SLOT_ROWS) });
    const slots = await getNotificationSlots(db as any);
    expect(slots[0].weekdays).toBe(127);
    expect(slots[1].weekdays).toBe(31);
  });

  it('casts id to 0|1', async () => {
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue(SLOT_ROWS) });
    const slots = await getNotificationSlots(db as any);
    expect(slots[0].id).toBe(0);
    expect(slots[1].id).toBe(1);
  });

  it('preserves time string', async () => {
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue(SLOT_ROWS) });
    const slots = await getNotificationSlots(db as any);
    expect(slots[0].time).toBe('09:00');
    expect(slots[1].time).toBe('20:00');
  });

  it('uses SELECT ordered by id', async () => {
    const db = makeDb();
    await getNotificationSlots(db as any);
    const sql: string = db.getAllAsync.mock.calls[0][0];
    expect(sql).toMatch(/ORDER BY id/i);
  });

  it('filters by valid slot IDs (0, 1) with LIMIT 2', async () => {
    const db = makeDb();
    await getNotificationSlots(db as any);
    const sql: string = db.getAllAsync.mock.calls[0][0];
    expect(sql).toMatch(/WHERE\s+id\s+IN\s*\(\s*0\s*,\s*1\s*\)/i);
    expect(sql).toMatch(/LIMIT\s+2/i);
  });

  it('ignores rows with unexpected id values', async () => {
    const rowsWithExtra = [
      ...SLOT_ROWS,
      { id: 99, enabled: 1, time: '12:00', weekdays: 127 },
    ];
    const db = makeDb({ getAllAsync: jest.fn().mockResolvedValue(rowsWithExtra) });
    const slots = await getNotificationSlots(db as any);
    const ids = slots.map((s) => s.id);
    expect(ids).not.toContain(99);
  });
});

// ---------------------------------------------------------------------------
// saveNotificationSlot
// ---------------------------------------------------------------------------

describe('saveNotificationSlot', () => {
  const slot: NotificationSlot = { id: 0, enabled: true, time: '08:30', weekdays: ALL_WEEKDAYS };

  it('calls runAsync with INSERT OR IGNORE / ON CONFLICT SQL', async () => {
    const db = makeDb();
    await saveNotificationSlot(db as any, slot);
    const sql: string = db.runAsync.mock.calls[0][0];
    expect(sql).toMatch(/INSERT INTO notification_slots/i);
    expect(sql).toMatch(/ON CONFLICT/i);
  });

  it('converts enabled=true to 1', async () => {
    const db = makeDb();
    await saveNotificationSlot(db as any, { ...slot, enabled: true });
    const args = db.runAsync.mock.calls[0];
    expect(args).toContain(1);
  });

  it('converts enabled=false to 0', async () => {
    const db = makeDb();
    await saveNotificationSlot(db as any, { ...slot, enabled: false });
    const args = db.runAsync.mock.calls[0];
    expect(args).toContain(0);
  });

  it('passes the time string unchanged', async () => {
    const db = makeDb();
    await saveNotificationSlot(db as any, slot);
    expect(db.runAsync.mock.calls[0]).toContain('08:30');
  });

  it('passes the weekdays bitmask', async () => {
    const db = makeDb();
    await saveNotificationSlot(db as any, slot);
    expect(db.runAsync.mock.calls[0]).toContain(ALL_WEEKDAYS);
  });

  it('falls back to ALL_WEEKDAYS when weekdays is missing', async () => {
    const db = makeDb();
    // @ts-expect-error — intentionally omitting weekdays to test fallback
    await saveNotificationSlot(db as any, { id: 0, enabled: true, time: '08:00' });
    expect(db.runAsync.mock.calls[0]).toContain(ALL_WEEKDAYS);
  });

  it('passes the slot id', async () => {
    const db = makeDb();
    await saveNotificationSlot(db as any, { ...slot, id: 1 });
    expect(db.runAsync.mock.calls[0]).toContain(1);
  });
});
