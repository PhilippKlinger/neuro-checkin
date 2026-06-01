import { groupCheckInsByDate } from '../lib/utils/groupByDate';
import type { CheckIn } from '../lib/types/checkin';
import { EMPTY_BODY_SIGNALS } from '../lib/types/checkin';

function makeCheckIn(id: number, createdAt: string): CheckIn {
  return {
    id,
    createdAt,
    energyLevel: 3,
    focusLevel: 3,
    energySkipped: false,
    focusSkipped: false,
    bodySignals: { ...EMPTY_BODY_SIGNALS },
    feelings: '',
    feelingsSkipped: false,
    distressLevel: null,
    distressNote: null,
    thoughtsType: null,
    thoughtsNote: null,
    selfCareNote: null,
    innerPart: null,
    note: null,
  };
}

function today(hours = 10, minutes = 0): string {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

function daysAgo(n: number, hours = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hours, 0, 0, 0);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

describe('groupCheckInsByDate', () => {
  it('returns empty array for empty input', () => {
    expect(groupCheckInsByDate([])).toEqual([]);
  });

  it('groups a single entry under "Heute"', () => {
    const items = [makeCheckIn(1, today())];
    const sections = groupCheckInsByDate(items);
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe('Heute');
    expect(sections[0].data).toHaveLength(1);
  });

  it('groups yesterday entries under "Gestern"', () => {
    const items = [makeCheckIn(1, daysAgo(1))];
    const sections = groupCheckInsByDate(items);
    expect(sections[0].title).toBe('Gestern');
  });

  it('separates today and yesterday', () => {
    const items = [makeCheckIn(1, today()), makeCheckIn(2, daysAgo(1))];
    const sections = groupCheckInsByDate(items);
    expect(sections).toHaveLength(2);
    expect(sections[0].title).toBe('Heute');
    expect(sections[1].title).toBe('Gestern');
  });

  it('groups entries from same week under "Diese Woche"', () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    // Monday = 1, Sunday = 0 (JS). German week starts Monday.
    // Find a day in current week that's not today or yesterday.
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Only testable if we're far enough into the week (Wed+)
    if (daysFromMonday >= 3) {
      const items = [makeCheckIn(1, daysAgo(3))];
      const sections = groupCheckInsByDate(items);
      expect(sections[0].title).toBe('Diese Woche');
    }
  });

  it('groups entries from last week under "Letzte Woche"', () => {
    // Compute a date that's guaranteed to be last week's Wednesday
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Mon
    // days back to last Wednesday: go to this Monday, then back 4 more (last Wed)
    const daysBack = dayOfWeek + 4;
    const items = [makeCheckIn(1, daysAgo(daysBack))];
    const sections = groupCheckInsByDate(items);
    expect(sections[0].title).toBe('Letzte Woche');
  });

  it('uses month-year headers for older entries', () => {
    const items = [makeCheckIn(1, '2026-04-15 10:00:00')];
    const sections = groupCheckInsByDate(items);
    expect(sections[0].title).toMatch(/April 2026/);
  });

  it('multiple entries on same day go into same section', () => {
    const items = [
      makeCheckIn(1, today(9)),
      makeCheckIn(2, today(14)),
      makeCheckIn(3, today(20)),
    ];
    const sections = groupCheckInsByDate(items);
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe('Heute');
    expect(sections[0].data).toHaveLength(3);
  });

  it('preserves input order within sections', () => {
    const items = [
      makeCheckIn(1, today(20)),
      makeCheckIn(2, today(14)),
      makeCheckIn(3, today(9)),
    ];
    const sections = groupCheckInsByDate(items);
    expect(sections[0].data.map((c) => c.id)).toEqual([1, 2, 3]);
  });

  it('creates correct section order across multiple groups', () => {
    const items = [
      makeCheckIn(1, today()),
      makeCheckIn(2, daysAgo(1)),
      makeCheckIn(3, daysAgo(10)),
      makeCheckIn(4, '2026-03-10 10:00:00'),
    ];
    const sections = groupCheckInsByDate(items);
    expect(sections[0].title).toBe('Heute');
    expect(sections[1].title).toBe('Gestern');
    // Section 2 is either "Diese Woche" or "Letzte Woche" depending on day
    expect(sections[sections.length - 1].title).toMatch(/März 2026/);
  });

  it('handles month boundary correctly', () => {
    const items = [
      makeCheckIn(1, '2026-05-31 10:00:00'),
      makeCheckIn(2, '2026-05-01 10:00:00'),
      makeCheckIn(3, '2026-04-30 10:00:00'),
    ];
    const sections = groupCheckInsByDate(items);
    const titles = sections.map((s) => s.title);
    const maiSections = titles.filter((t) => t.includes('Mai'));
    const aprilSections = titles.filter((t) => t.includes('April'));
    expect(maiSections.length).toBeGreaterThanOrEqual(1);
    expect(aprilSections.length).toBe(1);
  });
});
