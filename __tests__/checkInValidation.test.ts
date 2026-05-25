import { normalizeCheckInInsert } from '../lib/database/checkins';
import type { CheckInInsert } from '../lib/types/checkin';
import { EMPTY_BODY_SIGNALS } from '../lib/types/checkin';

const VALID_INSERT: CheckInInsert = {
  energyLevel: 3,
  focusLevel: 4,
  energySkipped: false,
  focusSkipped: false,
  bodySignals: { ...EMPTY_BODY_SIGNALS, hunger: true },
  feelings: 'ruhig',
  feelingsSkipped: false,
  distressLevel: 2,
  distressNote: 'ein bisschen',
  thoughtsType: 'supportive',
  thoughtsNote: 'alles gut',
  selfCareNote: 'Wasser trinken',
  innerPart: null,
  note: 'Testnotiz',
};

// ---------------------------------------------------------------------------
// Level clamping
// ---------------------------------------------------------------------------

describe('normalizeCheckInInsert — level clamping', () => {
  it('leaves valid energyLevel (1-5) unchanged', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, energyLevel: 5 });
    expect(result.energyLevel).toBe(5);
  });

  it('leaves energyLevel 0 unchanged (skip indicator)', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, energyLevel: 0 });
    expect(result.energyLevel).toBe(0);
  });

  it('clamps energyLevel > 5 to 5', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, energyLevel: 8 });
    expect(result.energyLevel).toBe(5);
  });

  it('clamps negative energyLevel to 0', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, energyLevel: -1 });
    expect(result.energyLevel).toBe(0);
  });

  it('clamps focusLevel > 5 to 5', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, focusLevel: 10 });
    expect(result.focusLevel).toBe(5);
  });

  it('clamps negative focusLevel to 0', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, focusLevel: -3 });
    expect(result.focusLevel).toBe(0);
  });

  it('leaves valid distressLevel (1-5) unchanged', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, distressLevel: 4 });
    expect(result.distressLevel).toBe(4);
  });

  it('leaves distressLevel null unchanged', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, distressLevel: null });
    expect(result.distressLevel).toBeNull();
  });

  it('clamps distressLevel > 5 to 5', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, distressLevel: 7 });
    expect(result.distressLevel).toBe(5);
  });

  it('clamps distressLevel < 1 to 1 (0 is not valid for distress)', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, distressLevel: 0 });
    expect(result.distressLevel).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// String trimming + empty→null normalization
// ---------------------------------------------------------------------------

describe('normalizeCheckInInsert — string normalization', () => {
  it('trims whitespace from feelings', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, feelings: '  ruhig  ' });
    expect(result.feelings).toBe('ruhig');
  });

  it('trims whitespace from distressNote', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, distressNote: ' stress \n' });
    expect(result.distressNote).toBe('stress');
  });

  it('normalizes empty distressNote to null', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, distressNote: '   ' });
    expect(result.distressNote).toBeNull();
  });

  it('trims whitespace from thoughtsNote', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, thoughtsNote: ' notiz ' });
    expect(result.thoughtsNote).toBe('notiz');
  });

  it('normalizes empty thoughtsNote to null', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, thoughtsNote: '' });
    expect(result.thoughtsNote).toBeNull();
  });

  it('trims whitespace from selfCareNote', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, selfCareNote: ' Wasser ' });
    expect(result.selfCareNote).toBe('Wasser');
  });

  it('normalizes empty selfCareNote to null', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, selfCareNote: '  ' });
    expect(result.selfCareNote).toBeNull();
  });

  it('trims whitespace from innerPart', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, innerPart: ' Beschützer ' });
    expect(result.innerPart).toBe('Beschützer');
  });

  it('normalizes empty innerPart to null', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, innerPart: '' });
    expect(result.innerPart).toBeNull();
  });

  it('trims whitespace from note', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, note: '  Testnotiz\n' });
    expect(result.note).toBe('Testnotiz');
  });

  it('normalizes empty note to null', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, note: '   ' });
    expect(result.note).toBeNull();
  });

  it('preserves null distressNote as null', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, distressNote: null });
    expect(result.distressNote).toBeNull();
  });

  it('does not convert empty feelings to null (feelings is non-nullable string)', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, feelings: '  ' });
    expect(result.feelings).toBe('');
  });
});

// ---------------------------------------------------------------------------
// thoughtsType validation
// ---------------------------------------------------------------------------

describe('normalizeCheckInInsert — thoughtsType validation', () => {
  it('preserves valid thoughtsType "supportive"', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, thoughtsType: 'supportive' });
    expect(result.thoughtsType).toBe('supportive');
  });

  it('preserves valid thoughtsType "burdening"', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, thoughtsType: 'burdening' });
    expect(result.thoughtsType).toBe('burdening');
  });

  it('preserves valid thoughtsType "mixed"', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, thoughtsType: 'mixed' });
    expect(result.thoughtsType).toBe('mixed');
  });

  it('preserves null thoughtsType', () => {
    const result = normalizeCheckInInsert({ ...VALID_INSERT, thoughtsType: null });
    expect(result.thoughtsType).toBeNull();
  });

  it('normalizes invalid thoughtsType to null', () => {
    const result = normalizeCheckInInsert({
      ...VALID_INSERT,
      thoughtsType: 'invalid' as any,
    });
    expect(result.thoughtsType).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// bodySignals normalization
// ---------------------------------------------------------------------------

describe('normalizeCheckInInsert — bodySignals', () => {
  it('preserves valid boolean and null values', () => {
    const input = { ...EMPTY_BODY_SIGNALS, hunger: true, thirst: false, pain: null };
    const result = normalizeCheckInInsert({ ...VALID_INSERT, bodySignals: input });
    expect(result.bodySignals.hunger).toBe(true);
    expect(result.bodySignals.thirst).toBe(false);
    expect(result.bodySignals.pain).toBeNull();
  });

  it('coerces non-boolean values to null', () => {
    const input = { ...EMPTY_BODY_SIGNALS, hunger: 'yes' as any, thirst: 1 as any };
    const result = normalizeCheckInInsert({ ...VALID_INSERT, bodySignals: input });
    expect(result.bodySignals.hunger).toBeNull();
    expect(result.bodySignals.thirst).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Pass-through of unchanged fields
// ---------------------------------------------------------------------------

describe('normalizeCheckInInsert — pass-through', () => {
  it('does not mutate the original object', () => {
    const original = { ...VALID_INSERT };
    normalizeCheckInInsert(original);
    expect(original.energyLevel).toBe(3);
  });

  it('preserves boolean skip flags unchanged', () => {
    const result = normalizeCheckInInsert({
      ...VALID_INSERT,
      energySkipped: true,
      focusSkipped: true,
      feelingsSkipped: true,
    });
    expect(result.energySkipped).toBe(true);
    expect(result.focusSkipped).toBe(true);
    expect(result.feelingsSkipped).toBe(true);
  });
});
