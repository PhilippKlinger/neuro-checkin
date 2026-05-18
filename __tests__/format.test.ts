import { formatDate, formatTime, formatDateTime } from '../lib/utils/format';

// parseSqliteDate appends 'Z' to bare "YYYY-MM-DD HH:MM:SS" strings so they
// are treated as UTC consistently. toLocaleTimeString then converts to the
// local timezone of the runtime — tests must therefore be timezone-agnostic.

// Helper: compute the expected local output for a given UTC timestamp
// so tests stay correct regardless of the machine's timezone offset.
function expectedTime(utcIso: string): string {
  return new Date(utcIso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}
function expectedDate(utcIso: string): string {
  return new Date(utcIso).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe('formatDate', () => {
  it('formats a SQLite datetime string as a short German date', () => {
    const result = formatDate('2026-05-18 00:00:00');
    expect(result).toBe(expectedDate('2026-05-18T00:00:00Z'));
  });

  it('also accepts an ISO 8601 string with T and Z', () => {
    const isoResult = formatDate('2026-05-18T10:00:00Z');
    const sqliteResult = formatDate('2026-05-18 10:00:00');
    // Both forms should produce the same string
    expect(isoResult).toBe(sqliteResult);
  });

  it('output contains the year 2026', () => {
    expect(formatDate('2026-01-01 00:00:00')).toMatch(/2026/);
  });

  it('output contains the day number', () => {
    // "18" appears in date strings for May 18
    expect(formatDate('2026-05-18 00:00:00')).toMatch(/18/);
  });

  it('output contains the month number', () => {
    expect(formatDate('2026-05-18 00:00:00')).toMatch(/05/);
  });

  it('output has the correct short weekday for a known Monday', () => {
    // 2026-01-05 is a Monday → "Mo" in de-DE locale
    expect(formatDate('2026-01-05 00:00:00')).toMatch(/Mo/);
  });
});

// ---------------------------------------------------------------------------
// formatTime
// ---------------------------------------------------------------------------

describe('formatTime', () => {
  it('produces the same output as toLocaleTimeString for the same UTC input', () => {
    const result = formatTime('2026-05-18 14:35:00');
    const expected = expectedTime('2026-05-18T14:35:00Z');
    expect(result).toBe(expected);
  });

  it('output matches HH:MM format', () => {
    const result = formatTime('2026-05-18 14:35:00');
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('handles midnight input without throwing', () => {
    expect(() => formatTime('2026-05-18 00:00:00')).not.toThrow();
    expect(formatTime('2026-05-18 00:00:00')).toMatch(/^\d{2}:\d{2}$/);
  });
});

// ---------------------------------------------------------------------------
// formatDateTime
// ---------------------------------------------------------------------------

describe('formatDateTime', () => {
  it('includes the full weekday name in German for a known Monday', () => {
    // 2026-05-18 00:00 UTC — in UTC+0 or UTC+ timezones, weekday is still Monday
    const result = formatDateTime('2026-05-18 00:00:00');
    expect(result).toMatch(/Montag/);
  });

  it('includes the full month name in German', () => {
    const result = formatDateTime('2026-05-18 00:00:00');
    expect(result).toMatch(/Mai/);
  });

  it('includes the year', () => {
    expect(formatDateTime('2026-05-18 00:00:00')).toMatch(/2026/);
  });

  it('includes a time component matching HH:MM', () => {
    const result = formatDateTime('2026-05-18 14:35:00');
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it('contains a comma separating date and time parts', () => {
    const result = formatDateTime('2026-05-18 08:00:00');
    expect(result).toMatch(/,/);
  });
});
