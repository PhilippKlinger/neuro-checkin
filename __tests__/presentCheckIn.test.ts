import { presentCheckIn } from '../lib/utils/presentCheckIn';
import type { CheckIn, CheckInDraft } from '../lib/types/checkin';
import { EMPTY_BODY_SIGNALS, EMPTY_DRAFT, DISTRESS_NOTE_THRESHOLD } from '../lib/types/checkin';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FULL_CHECKIN: CheckIn = {
  id: 1,
  createdAt: '2026-05-25 10:00:00',
  energyLevel: 3,
  focusLevel: 4,
  energySkipped: false,
  focusSkipped: false,
  bodySignals: { ...EMPTY_BODY_SIGNALS, hunger: true, pain: true },
  feelings: 'ruhig, zufrieden',
  feelingsSkipped: false,
  distressLevel: 2,
  distressNote: 'leicht spürbar',
  thoughtsType: 'supportive',
  thoughtsNote: 'alles gut',
  selfCareNote: 'Wasser trinken',
  innerPart: 'Beschützer',
  note: 'Testnotiz',
};

const SKIPPED_CHECKIN: CheckIn = {
  id: 2,
  createdAt: '2026-05-25 08:00:00',
  energyLevel: 0,
  focusLevel: 0,
  energySkipped: true,
  focusSkipped: true,
  bodySignals: { ...EMPTY_BODY_SIGNALS },
  feelings: '',
  feelingsSkipped: true,
  distressLevel: null,
  distressNote: null,
  thoughtsType: null,
  thoughtsNote: null,
  selfCareNote: null,
  innerPart: null,
  note: null,
};

const DRAFT: CheckInDraft = {
  ...EMPTY_DRAFT,
  bodySignals: { ...EMPTY_BODY_SIGNALS },
  energyLevel: 4,
  focusLevel: 2,
  feelings: 'müde',
};

// ---------------------------------------------------------------------------
// Energy + Focus formatting
// ---------------------------------------------------------------------------

describe('presentCheckIn — energy & focus', () => {
  it('formats energy as "level/5 — label"', () => {
    const p = presentCheckIn(FULL_CHECKIN);
    expect(p.energy).toBe('3/5 — Mittel');
  });

  it('formats focus as "level/5 — label"', () => {
    const p = presentCheckIn(FULL_CHECKIN);
    expect(p.focus).toBe('4/5 — Gut');
  });

  it('returns null for energy when skipped', () => {
    const p = presentCheckIn(SKIPPED_CHECKIN);
    expect(p.energy).toBeNull();
  });

  it('returns null for focus when skipped', () => {
    const p = presentCheckIn(SKIPPED_CHECKIN);
    expect(p.focus).toBeNull();
  });

  it('returns null for energy when level is 0 (unset)', () => {
    const checkin = { ...FULL_CHECKIN, energyLevel: 0, energySkipped: false };
    const p = presentCheckIn(checkin);
    expect(p.energy).toBeNull();
  });

  it('handles all 5 energy levels', () => {
    for (let i = 1; i <= 5; i++) {
      const checkin = { ...FULL_CHECKIN, energyLevel: i };
      const p = presentCheckIn(checkin);
      expect(p.energy).toMatch(new RegExp(`^${i}/5 — .+`));
    }
  });
});

// ---------------------------------------------------------------------------
// Body signals
// ---------------------------------------------------------------------------

describe('presentCheckIn — bodySignals', () => {
  it('returns labeled signals array with active flags', () => {
    const p = presentCheckIn(FULL_CHECKIN);
    expect(p.bodySignals.length).toBe(7);
    const hunger = p.bodySignals.find((s) => s.label === 'Hunger');
    expect(hunger?.active).toBe(true);
    const thirst = p.bodySignals.find((s) => s.label === 'Durst');
    expect(thirst?.active).toBe(false);
  });

  it('activeSignals contains only active signal labels', () => {
    const p = presentCheckIn(FULL_CHECKIN);
    expect(p.activeSignals).toContain('Hunger');
    expect(p.activeSignals).toContain('Schmerzen');
    expect(p.activeSignals).not.toContain('Durst');
  });

  it('returns empty activeSignals when none are true', () => {
    const p = presentCheckIn(SKIPPED_CHECKIN);
    expect(p.activeSignals).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Feelings
// ---------------------------------------------------------------------------

describe('presentCheckIn — feelings', () => {
  it('returns feelings text when present', () => {
    const p = presentCheckIn(FULL_CHECKIN);
    expect(p.feelings).toBe('ruhig, zufrieden');
  });

  it('returns null for empty feelings', () => {
    const p = presentCheckIn(SKIPPED_CHECKIN);
    expect(p.feelings).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Distress
// ---------------------------------------------------------------------------

describe('presentCheckIn — distress', () => {
  it('formats distress as "level/5 — label"', () => {
    const p = presentCheckIn(FULL_CHECKIN);
    expect(p.distress).toBe('2/5 — Wenig');
  });

  it('includes note in distressWithNote', () => {
    const p = presentCheckIn(FULL_CHECKIN);
    expect(p.distressWithNote).toBe('2/5 — Wenig — leicht spürbar');
  });

  it('distressWithNote omits note part when note is empty', () => {
    const checkin = { ...FULL_CHECKIN, distressNote: '' };
    const p = presentCheckIn(checkin);
    expect(p.distressWithNote).toBe('2/5 — Wenig');
  });

  it('returns null for distress when level is null', () => {
    const p = presentCheckIn(SKIPPED_CHECKIN);
    expect(p.distress).toBeNull();
    expect(p.distressWithNote).toBeNull();
  });

  it('handles all 5 distress levels', () => {
    for (let i = 1; i <= 5; i++) {
      const checkin = { ...FULL_CHECKIN, distressLevel: i };
      const p = presentCheckIn(checkin);
      expect(p.distress).toMatch(new RegExp(`^${i}/5 — .+`));
    }
  });
});

// ---------------------------------------------------------------------------
// Thoughts
// ---------------------------------------------------------------------------

describe('presentCheckIn — thoughts', () => {
  it('translates supportive to "Unterstützend"', () => {
    const p = presentCheckIn({ ...FULL_CHECKIN, thoughtsType: 'supportive' });
    expect(p.thoughtsType).toBe('Unterstützend');
  });

  it('translates burdening to "Belastend"', () => {
    const p = presentCheckIn({ ...FULL_CHECKIN, thoughtsType: 'burdening' });
    expect(p.thoughtsType).toBe('Belastend');
  });

  it('translates mixed to "Gemischt"', () => {
    const p = presentCheckIn({ ...FULL_CHECKIN, thoughtsType: 'mixed' });
    expect(p.thoughtsType).toBe('Gemischt');
  });

  it('returns null thoughtsType when null', () => {
    const p = presentCheckIn(SKIPPED_CHECKIN);
    expect(p.thoughtsType).toBeNull();
  });

  it('returns thoughtsNote when present', () => {
    const p = presentCheckIn(FULL_CHECKIN);
    expect(p.thoughtsNote).toBe('alles gut');
  });

  it('returns null thoughtsNote when empty', () => {
    const checkin = { ...FULL_CHECKIN, thoughtsNote: '' };
    const p = presentCheckIn(checkin);
    expect(p.thoughtsNote).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Self-care, innerPart, note
// ---------------------------------------------------------------------------

describe('presentCheckIn — selfCare, innerPart, note', () => {
  it('returns selfCare note', () => {
    const p = presentCheckIn(FULL_CHECKIN);
    expect(p.selfCare).toBe('Wasser trinken');
  });

  it('returns null selfCare when empty', () => {
    const p = presentCheckIn(SKIPPED_CHECKIN);
    expect(p.selfCare).toBeNull();
  });

  it('returns innerPart', () => {
    const p = presentCheckIn(FULL_CHECKIN);
    expect(p.innerPart).toBe('Beschützer');
  });

  it('returns null innerPart when null', () => {
    const p = presentCheckIn(SKIPPED_CHECKIN);
    expect(p.innerPart).toBeNull();
  });

  it('returns note', () => {
    const p = presentCheckIn(FULL_CHECKIN);
    expect(p.note).toBe('Testnotiz');
  });

  it('returns null note when null', () => {
    const p = presentCheckIn(SKIPPED_CHECKIN);
    expect(p.note).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Distress threshold constant
// ---------------------------------------------------------------------------

describe('DISTRESS_NOTE_THRESHOLD', () => {
  it('is 4 (note field appears at level 4+)', () => {
    expect(DISTRESS_NOTE_THRESHOLD).toBe(4);
  });

  it('distressWithNote includes note only when distressNote is non-empty', () => {
    const atThreshold = {
      ...FULL_CHECKIN,
      distressLevel: DISTRESS_NOTE_THRESHOLD,
      distressNote: 'viel los',
    };
    const p = presentCheckIn(atThreshold);
    expect(p.distressWithNote).toContain('viel los');
  });

  it('below threshold: distress still formats but note field would be hidden', () => {
    const belowThreshold = {
      ...FULL_CHECKIN,
      distressLevel: DISTRESS_NOTE_THRESHOLD - 1,
      distressNote: '',
    };
    const p = presentCheckIn(belowThreshold);
    expect(p.distress).toMatch(new RegExp(`^${DISTRESS_NOTE_THRESHOLD - 1}/5`));
    expect(p.distressWithNote).not.toContain('—  —');
  });
});

// ---------------------------------------------------------------------------
// CheckInDraft support
// ---------------------------------------------------------------------------

describe('presentCheckIn — CheckInDraft', () => {
  it('works with a draft (no id, no createdAt)', () => {
    const p = presentCheckIn(DRAFT);
    expect(p.energy).toBe('4/5 — Viel');
    expect(p.focus).toBe('2/5 — Wenig');
    expect(p.feelings).toBe('müde');
  });

  it('returns null for distress when draft has no distressLevel', () => {
    const p = presentCheckIn({ ...DRAFT, distressLevel: null });
    expect(p.distress).toBeNull();
  });
});
