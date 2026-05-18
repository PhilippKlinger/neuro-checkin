import { isChipSelected, toggleChip } from '../lib/utils/chips';

describe('isChipSelected', () => {
  it('returns true when chip is in value', () => {
    expect(isChipSelected('freudig', 'freudig, ruhig')).toBe(true);
  });

  it('returns false when chip is not in value', () => {
    expect(isChipSelected('ängstlich', 'freudig, ruhig')).toBe(false);
  });

  it('returns false on empty value', () => {
    expect(isChipSelected('freudig', '')).toBe(false);
  });

  it('trims whitespace correctly', () => {
    expect(isChipSelected('ruhig', '  ruhig  ,  freudig  ')).toBe(true);
  });

  it('does not match partial chip names', () => {
    // "freudig" must not match if the value contains "freudig-extra"
    expect(isChipSelected('freudig', 'freudig-extra')).toBe(false);
  });

  it('matches single chip without trailing comma', () => {
    expect(isChipSelected('ruhig', 'ruhig')).toBe(true);
  });
});

describe('toggleChip', () => {
  it('adds chip when not present', () => {
    expect(toggleChip('ängstlich', 'freudig, ruhig')).toBe('freudig, ruhig, ängstlich');
  });

  it('removes chip when already present', () => {
    expect(toggleChip('ruhig', 'freudig, ruhig, ängstlich')).toBe('freudig, ängstlich');
  });

  it('adds first chip to empty string', () => {
    expect(toggleChip('freudig', '')).toBe('freudig');
  });

  it('removes last chip, returning empty string', () => {
    expect(toggleChip('freudig', 'freudig')).toBe('');
  });

  it('produces consistent comma-space separator', () => {
    const result = toggleChip('neu', 'a, b');
    expect(result).toBe('a, b, neu');
  });

  it('handles extra whitespace in input without creating empty parts', () => {
    // Messy input from older data shouldn't produce ","-only artifacts
    const result = toggleChip('neu', '  a  ,  b  ');
    expect(result).toBe('a, b, neu');
  });

  it('does not remove chips that share a prefix', () => {
    // "freudig" should not accidentally remove "freudig-extra"
    const result = toggleChip('freudig', 'freudig-extra, ruhig');
    expect(result).toBe('freudig-extra, ruhig, freudig');
  });
});
