import { parseUserChipTerms } from '../lib/utils/parseUserChipTerms';

// Standard chips used across all tests — mirrors FEELING_CHIPS subset
const STANDARD = ['neutral', 'leer', 'erschöpft', 'ruhig', 'angespannt'];

// ---------------------------------------------------------------------------
// Accepted terms
// ---------------------------------------------------------------------------

describe('parseUserChipTerms — accepted terms', () => {
  it('accepts a valid single term', () => {
    const { accepted } = parseUserChipTerms('neblig', STANDARD);
    expect(accepted).toEqual(['neblig']);
  });

  it('accepts exactly MIN_LABEL_LENGTH (2 chars)', () => {
    const { accepted } = parseUserChipTerms('ab', STANDARD);
    expect(accepted).toEqual(['ab']);
  });

  it('accepts exactly MAX_LABEL_LENGTH (30 chars)', () => {
    const term = 'a'.repeat(30);
    const { accepted } = parseUserChipTerms(term, STANDARD);
    expect(accepted).toEqual([term]);
  });

  it('accepts comma-separated terms', () => {
    const { accepted } = parseUserChipTerms('neblig, wattig', STANDARD);
    expect(accepted).toEqual(['neblig', 'wattig']);
  });

  it('preserves original casing in accepted terms', () => {
    const { accepted } = parseUserChipTerms('Neblig', STANDARD);
    expect(accepted).toEqual(['Neblig']);
  });

  it('collapses internal whitespace to single space', () => {
    const { accepted } = parseUserChipTerms('ne  big', STANDARD);
    expect(accepted).toEqual(['ne big']);
  });

  it('trims leading and trailing whitespace from each term', () => {
    const { accepted } = parseUserChipTerms('  neblig  ', STANDARD);
    expect(accepted).toEqual(['neblig']);
  });
});

// ---------------------------------------------------------------------------
// Silently skipped (no entry in rejectedTooLong)
// ---------------------------------------------------------------------------

describe('parseUserChipTerms — silently skipped', () => {
  it('returns empty results for empty input', () => {
    const result = parseUserChipTerms('', STANDARD);
    expect(result.accepted).toEqual([]);
    expect(result.rejectedTooLong).toEqual([]);
  });

  it('returns empty results for whitespace-only input', () => {
    const result = parseUserChipTerms('   ', STANDARD);
    expect(result.accepted).toEqual([]);
    expect(result.rejectedTooLong).toEqual([]);
  });

  it('skips terms with 1 character (below MIN_LABEL_LENGTH)', () => {
    const result = parseUserChipTerms('a', STANDARD);
    expect(result.accepted).toEqual([]);
    expect(result.rejectedTooLong).toEqual([]);
  });

  it('skips standard chips (exact match)', () => {
    const result = parseUserChipTerms('ruhig', STANDARD);
    expect(result.accepted).toEqual([]);
    expect(result.rejectedTooLong).toEqual([]);
  });

  it('skips standard chips case-insensitively', () => {
    const result = parseUserChipTerms('RUHIG', STANDARD);
    expect(result.accepted).toEqual([]);
  });

  it('skips duplicates within input (second occurrence silent)', () => {
    const { accepted } = parseUserChipTerms('Neblig, neblig', STANDARD);
    expect(accepted).toEqual(['Neblig']); // first occurrence kept
    expect(accepted).toHaveLength(1);
  });

  it('skips duplicate that differs only in casing', () => {
    const { accepted } = parseUserChipTerms('wattig, Wattig, WATTIG', STANDARD);
    expect(accepted).toHaveLength(1);
    expect(accepted[0]).toBe('wattig'); // first occurrence
  });
});

// ---------------------------------------------------------------------------
// Rejected too long (appear in rejectedTooLong)
// ---------------------------------------------------------------------------

describe('parseUserChipTerms — rejected too long', () => {
  it('rejects a term exceeding MAX_LABEL_LENGTH (31 chars)', () => {
    const longTerm = 'a'.repeat(31);
    const { accepted, rejectedTooLong } = parseUserChipTerms(longTerm, STANDARD);
    expect(accepted).toEqual([]);
    expect(rejectedTooLong).toEqual([longTerm]);
  });

  it('does NOT add too-long terms to accepted', () => {
    const longTerm = 'x'.repeat(50);
    const { accepted } = parseUserChipTerms(longTerm, STANDARD);
    expect(accepted).not.toContain(longTerm);
  });

  it('collects multiple too-long terms in rejectedTooLong', () => {
    const long1 = 'a'.repeat(31);
    const long2 = 'b'.repeat(32);
    const { rejectedTooLong } = parseUserChipTerms(`${long1}, ${long2}`, STANDARD);
    expect(rejectedTooLong).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Mixed input
// ---------------------------------------------------------------------------

describe('parseUserChipTerms — mixed input', () => {
  it('correctly separates accepted, too-short, too-long, and standard terms', () => {
    const longTerm = 'a'.repeat(31);
    const { accepted, rejectedTooLong } = parseUserChipTerms(
      // valid | standard | too-long | too-short
      `neblig, ruhig, ${longTerm}, a`,
      STANDARD
    );
    expect(accepted).toEqual(['neblig']);
    expect(rejectedTooLong).toEqual([longTerm]);
  });

  it('handles a standard chip mixed with valid terms', () => {
    const { accepted } = parseUserChipTerms('ruhig, neblig, wattig', STANDARD);
    expect(accepted).toEqual(['neblig', 'wattig']);
    expect(accepted).not.toContain('ruhig');
  });

  it('returns consistent results regardless of term order', () => {
    const { accepted: a1 } = parseUserChipTerms('wattig, neblig', STANDARD);
    const { accepted: a2 } = parseUserChipTerms('neblig, wattig', STANDARD);
    expect(a1).toEqual(['wattig', 'neblig']);
    expect(a2).toEqual(['neblig', 'wattig']);
  });
});
