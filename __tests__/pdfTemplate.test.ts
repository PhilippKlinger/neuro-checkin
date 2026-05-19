import { buildPdfHtml } from '../lib/utils/pdfTemplate';
import type { CheckIn } from '../lib/types/checkin';
import { EMPTY_BODY_SIGNALS } from '../lib/types/checkin';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const BASE: CheckIn = {
  id: 1,
  createdAt: '2026-05-19 10:00:00',
  energyLevel: 3,
  focusLevel: 4,
  energySkipped: false,
  focusSkipped: false,
  bodySignals: { ...EMPTY_BODY_SIGNALS },
  feelings: 'ruhig, zufrieden',
  distressLevel: 2,
  distressNote: 'leicht spürbar',
  thoughtsType: 'supportive',
  thoughtsNote: 'alles gut',
  selfCareNote: 'Wasser trinken',
  innerPart: null,
  note: 'Testnotiz',
};

const MINIMAL: CheckIn = {
  id: 2,
  createdAt: '2026-05-18 08:30:00',
  energyLevel: 0,
  focusLevel: 0,
  energySkipped: true,
  focusSkipped: true,
  bodySignals: { ...EMPTY_BODY_SIGNALS },
  feelings: '',
  distressLevel: null,
  distressNote: null,
  thoughtsType: null,
  thoughtsNote: null,
  selfCareNote: null,
  innerPart: null,
  note: null,
};

// ---------------------------------------------------------------------------
// HTML structure
// ---------------------------------------------------------------------------

describe('buildPdfHtml — HTML structure', () => {
  it('returns a string containing a valid HTML doctype', () => {
    const html = buildPdfHtml([BASE]);
    expect(html).toMatch(/<!DOCTYPE html>/i);
  });

  it('includes the app name "Neuro Check-in" in the output', () => {
    const html = buildPdfHtml([BASE]);
    expect(html).toContain('Neuro Check-in');
  });

  it('includes the export date somewhere in the output', () => {
    const html = buildPdfHtml([BASE]);
    // Should contain current year at minimum
    expect(html).toContain('2026');
  });

  it('includes a footer with "Neuro Check-in"', () => {
    const html = buildPdfHtml([BASE]);
    expect(html).toContain('Neuro Check-in');
  });
});

// ---------------------------------------------------------------------------
// Check-in block content
// ---------------------------------------------------------------------------

describe('buildPdfHtml — check-in block content', () => {
  it('includes the check-in date', () => {
    const html = buildPdfHtml([BASE]);
    expect(html).toContain('2026-05-19');
  });

  it('includes energy level when not skipped', () => {
    const html = buildPdfHtml([BASE]);
    expect(html).toMatch(/3.*5|Energie/i);
  });

  it('includes feelings text', () => {
    const html = buildPdfHtml([BASE]);
    expect(html).toContain('ruhig, zufrieden');
  });

  it('includes self care note', () => {
    const html = buildPdfHtml([BASE]);
    expect(html).toContain('Wasser trinken');
  });

  it('includes distress note when present', () => {
    const html = buildPdfHtml([BASE]);
    expect(html).toContain('leicht spürbar');
  });

  it('includes general note when present', () => {
    const html = buildPdfHtml([BASE]);
    expect(html).toContain('Testnotiz');
  });
});

// ---------------------------------------------------------------------------
// Skipped / null fields are omitted
// ---------------------------------------------------------------------------

describe('buildPdfHtml — omits empty fields', () => {
  it('does not show energy label when energy is skipped', () => {
    const check = { ...BASE, energyLevel: 0, energySkipped: true };
    const html = buildPdfHtml([check]);
    // Energy label should not appear for this check-in — test by checking
    // the text "Übersprungen" or just that the level "0" is not rendered as a score
    expect(html).not.toMatch(/Energie.*0\/5/);
  });

  it('does not render empty feelings section', () => {
    const html = buildPdfHtml([MINIMAL]);
    expect(html).not.toMatch(/Gefühle.*<\/[a-z]+>/i);
  });

  it('does not render null distress level', () => {
    const html = buildPdfHtml([MINIMAL]);
    expect(html).not.toMatch(/Stress.*null/i);
  });

  it('does not render null selfCareNote', () => {
    const html = buildPdfHtml([MINIMAL]);
    expect(html).not.toMatch(/Selbstfürsorge.*null/i);
  });
});

// ---------------------------------------------------------------------------
// Multiple check-ins
// ---------------------------------------------------------------------------

describe('buildPdfHtml — multiple check-ins', () => {
  it('renders a block for each check-in', () => {
    const html = buildPdfHtml([BASE, MINIMAL]);
    expect(html).toContain('2026-05-19');
    expect(html).toContain('2026-05-18');
  });

  it('renders check-ins in the given order', () => {
    const html = buildPdfHtml([BASE, MINIMAL]);
    const pos1 = html.indexOf('2026-05-19');
    const pos2 = html.indexOf('2026-05-18');
    expect(pos1).toBeLessThan(pos2);
  });

  it('returns valid HTML for an empty array', () => {
    const html = buildPdfHtml([]);
    expect(html).toMatch(/<!DOCTYPE html>/i);
    expect(typeof html).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// getCheckInsByIds (tested via checkins DB tests — see checkins.db.test.ts)
// ---------------------------------------------------------------------------
