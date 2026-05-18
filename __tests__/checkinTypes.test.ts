import {
  getLevelLabel,
  getThoughtsLabel,
  ENERGY_LABELS,
  FOCUS_LABELS,
  DISTRESS_LABELS,
  WEEKDAY_BITS,
  ALL_WEEKDAYS,
  WORKDAYS,
} from '../lib/types/checkin';

describe('getLevelLabel', () => {
  it('returns "—" for value 0 (unselected)', () => {
    expect(getLevelLabel(0, ENERGY_LABELS)).toBe('—');
  });

  it('returns the correct label for each energy level 1–5', () => {
    ENERGY_LABELS.forEach((label, i) => {
      expect(getLevelLabel(i + 1, ENERGY_LABELS)).toBe(label);
    });
  });

  it('returns the correct label for each focus level 1–5', () => {
    FOCUS_LABELS.forEach((label, i) => {
      expect(getLevelLabel(i + 1, FOCUS_LABELS)).toBe(label);
    });
  });

  it('returns the correct label for each distress level 1–5', () => {
    DISTRESS_LABELS.forEach((label, i) => {
      expect(getLevelLabel(i + 1, DISTRESS_LABELS)).toBe(label);
    });
  });

  it('falls back to the raw number string for legacy values outside label range', () => {
    // Old 1-10 scale data — value 7 has no label at index 6
    expect(getLevelLabel(7, ENERGY_LABELS)).toBe('7');
  });
});

describe('getThoughtsLabel', () => {
  it('returns "Unterstützend" for supportive', () => {
    expect(getThoughtsLabel('supportive')).toBe('Unterstützend');
  });

  it('returns "Belastend" for burdening', () => {
    expect(getThoughtsLabel('burdening')).toBe('Belastend');
  });

  it('returns "Gemischt" for mixed', () => {
    expect(getThoughtsLabel('mixed')).toBe('Gemischt');
  });

  it('returns "—" for null', () => {
    expect(getThoughtsLabel(null)).toBe('—');
  });

  it('returns "—" for unknown string', () => {
    expect(getThoughtsLabel('unknown_value')).toBe('—');
  });
});

describe('WEEKDAY_BITS bitmask constants', () => {
  it('ALL_WEEKDAYS is the OR of all 7 bit values', () => {
    const combined = WEEKDAY_BITS.reduce((acc, bit) => acc | bit, 0);
    expect(ALL_WEEKDAYS).toBe(combined);
  });

  it('ALL_WEEKDAYS equals 127', () => {
    expect(ALL_WEEKDAYS).toBe(127);
  });

  it('WORKDAYS covers exactly Monday through Friday', () => {
    // Mon=1, Tue=2, Wed=4, Thu=8, Fri=16 → 31
    expect(WORKDAYS).toBe(31);
  });

  it('each weekday bit is a power of 2', () => {
    WEEKDAY_BITS.forEach((bit) => {
      expect(bit & (bit - 1)).toBe(0); // power of 2 check
    });
  });

  it('no two weekday bits overlap', () => {
    for (let i = 0; i < WEEKDAY_BITS.length; i++) {
      for (let j = i + 1; j < WEEKDAY_BITS.length; j++) {
        expect(WEEKDAY_BITS[i] & WEEKDAY_BITS[j]).toBe(0);
      }
    }
  });
});
