import { timeStringToDate, dateToTimeString } from '../lib/utils/time';

describe('timeStringToDate', () => {
  it('parses HH:mm into a Date with the correct hours and minutes', () => {
    const date = timeStringToDate('09:30');
    expect(date.getHours()).toBe(9);
    expect(date.getMinutes()).toBe(30);
  });

  it('sets seconds and milliseconds to zero', () => {
    const date = timeStringToDate('14:00');
    expect(date.getSeconds()).toBe(0);
    expect(date.getMilliseconds()).toBe(0);
  });

  it('handles midnight correctly', () => {
    const date = timeStringToDate('00:00');
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
  });

  it('handles end of day correctly', () => {
    const date = timeStringToDate('23:59');
    expect(date.getHours()).toBe(23);
    expect(date.getMinutes()).toBe(59);
  });
});

describe('dateToTimeString', () => {
  it('formats hours and minutes as HH:mm with zero padding', () => {
    const date = new Date();
    date.setHours(9, 5, 0, 0);
    expect(dateToTimeString(date)).toBe('09:05');
  });

  it('formats two-digit hours and minutes without extra padding', () => {
    const date = new Date();
    date.setHours(14, 30, 0, 0);
    expect(dateToTimeString(date)).toBe('14:30');
  });

  it('formats midnight as 00:00', () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    expect(dateToTimeString(date)).toBe('00:00');
  });
});

describe('timeStringToDate ↔ dateToTimeString round-trip', () => {
  const cases = ['00:00', '08:05', '12:30', '23:59'];

  test.each(cases)('%s survives a round-trip', (timeStr) => {
    expect(dateToTimeString(timeStringToDate(timeStr))).toBe(timeStr);
  });
});
