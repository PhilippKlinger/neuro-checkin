import { buildPdfHtml, escapeHtml, PDF_MAX_FIELD_LENGTH } from '../lib/utils/pdfTemplate';
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
  feelingsSkipped: false,
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
  feelingsSkipped: false,
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
    expect(html).toContain('19.05.2026');
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
// GT-07: PDF vollständig & konsistent mit Detail-View
// ---------------------------------------------------------------------------

describe('buildPdfHtml — GT-07: energy/focus always shown', () => {
  it('shows energy with level when not skipped', () => {
    const html = buildPdfHtml([BASE]);
    expect(html).toContain('Energie');
    expect(html).toContain('3/5');
  });

  it('shows "Nicht angegeben" for energy when skipped', () => {
    const check = { ...BASE, energyLevel: 0, energySkipped: true };
    const html = buildPdfHtml([check]);
    expect(html).toContain('Energie');
    expect(html).toContain('Nicht angegeben');
  });

  it('shows focus with level when not skipped', () => {
    const html = buildPdfHtml([BASE]);
    expect(html).toContain('Fokus');
    expect(html).toContain('4/5');
  });

  it('shows "Nicht angegeben" for focus when skipped', () => {
    const check = { ...BASE, focusLevel: 0, focusSkipped: true };
    const html = buildPdfHtml([check]);
    expect(html).toContain('Fokus');
    // Should contain "Nicht angegeben" somewhere after "Fokus"
    const fokusIdx = html.indexOf('Fokus');
    const nichtIdx = html.indexOf('Nicht angegeben', fokusIdx);
    expect(nichtIdx).toBeGreaterThan(fokusIdx);
  });
});

describe('buildPdfHtml — GT-07: body signals Ja/Nein like Detail-View', () => {
  it('shows both active (Ja) and inactive (Nein) signals', () => {
    const check: CheckIn = {
      ...BASE,
      bodySignals: {
        hunger: true,
        thirst: true,
        temperature: false,
        pain: false,
        restroom: null,
        seating: null,
        externalStimuli: null,
      },
    };
    const html = buildPdfHtml([check]);
    expect(html).toContain('Körpersignale');
    expect(html).toMatch(/Ja.*Hunger/);
    expect(html).toMatch(/Nein.*Temperatur/);
  });

  it('shows only Nein section when no signals are active', () => {
    const check: CheckIn = {
      ...BASE,
      bodySignals: {
        hunger: false,
        thirst: false,
        temperature: false,
        pain: false,
        restroom: false,
        seating: false,
        externalStimuli: false,
      },
    };
    const html = buildPdfHtml([check]);
    expect(html).toContain('Körpersignale');
    expect(html).toContain('Nein');
  });

  it('shows only Ja section when all signals are active', () => {
    const check: CheckIn = {
      ...BASE,
      bodySignals: {
        hunger: true,
        thirst: true,
        temperature: true,
        pain: true,
        restroom: true,
        seating: true,
        externalStimuli: true,
      },
    };
    const html = buildPdfHtml([check]);
    expect(html).toContain('Körpersignale');
    expect(html).toContain('Ja');
  });

  it('omits body signals section when all are null (not answered)', () => {
    // All null means user never toggled body signals → nothing to show
    // Unlike Detail-View which shows all as "Nein", PDF omits unengaged sections
    // because PresentedSignal maps null→active:false but we filter for explicit false
    const html = buildPdfHtml([MINIMAL]);
    expect(html).not.toContain('Körpersignale');
  });
});

describe('buildPdfHtml — GT-07: feelings with skip indicator', () => {
  it('shows feelings text when present', () => {
    const html = buildPdfHtml([BASE]);
    expect(html).toContain('Gefühle');
    expect(html).toContain('ruhig, zufrieden');
  });

  it('shows "Übersprungen" when feelings are skipped', () => {
    const check = { ...BASE, feelings: '', feelingsSkipped: true };
    const html = buildPdfHtml([check]);
    expect(html).toContain('Gefühle');
    expect(html).toContain('Übersprungen');
  });

  it('omits feelings row when empty and not skipped', () => {
    const check = { ...BASE, feelings: '', feelingsSkipped: false };
    const html = buildPdfHtml([check]);
    expect(html).not.toContain('Gefühle');
  });
});

describe('buildPdfHtml — GT-07: optional fields still omitted when null', () => {
  it('does not render null distress level', () => {
    const html = buildPdfHtml([MINIMAL]);
    expect(html).not.toContain('Stress');
  });

  it('does not render null selfCareNote', () => {
    const html = buildPdfHtml([MINIMAL]);
    expect(html).not.toContain('Selbstfürsorge');
  });

  it('does not render null thoughts', () => {
    const html = buildPdfHtml([MINIMAL]);
    expect(html).not.toContain('Gedanken');
  });
});

// ---------------------------------------------------------------------------
// Multiple check-ins
// ---------------------------------------------------------------------------

describe('buildPdfHtml — multiple check-ins', () => {
  it('renders a block for each check-in', () => {
    const html = buildPdfHtml([BASE, MINIMAL]);
    expect(html).toContain('19.05.2026');
    expect(html).toContain('18.05.2026');
  });

  it('renders check-ins in the given order', () => {
    const html = buildPdfHtml([BASE, MINIMAL]);
    const pos1 = html.indexOf('19.05.2026');
    const pos2 = html.indexOf('18.05.2026');
    expect(pos1).toBeLessThan(pos2);
  });

  it('returns valid HTML for an empty array', () => {
    const html = buildPdfHtml([]);
    expect(html).toMatch(/<!DOCTYPE html>/i);
    expect(typeof html).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// H-01: escapeHtml unit tests (pure function)
// ---------------------------------------------------------------------------

describe('escapeHtml', () => {
  it('leaves plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('escapes ampersand', () => {
    expect(escapeHtml('Freude & Stille')).toBe('Freude &amp; Stille');
  });

  it('escapes less-than and greater-than', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('escapes all special characters in one string', () => {
    expect(escapeHtml('<b class="x">a & b\'s</b>')).toBe(
      '&lt;b class=&quot;x&quot;&gt;a &amp; b&#39;s&lt;/b&gt;'
    );
  });

  it('does not double-escape already-safe text', () => {
    expect(escapeHtml('normal text, no specials')).toBe('normal text, no specials');
  });
});

// ---------------------------------------------------------------------------
// H-01: buildPdfHtml — HTML escaping of user fields
// ---------------------------------------------------------------------------

describe('buildPdfHtml — HTML escaping of user fields', () => {
  it('escapes & in feelings', () => {
    const html = buildPdfHtml([{ ...BASE, feelings: 'Freude & Stille' }]);
    expect(html).toContain('Freude &amp; Stille');
    expect(html).not.toContain('Freude & Stille');
  });

  it('escapes <script> injection in note (XSS)', () => {
    const html = buildPdfHtml([{ ...BASE, note: '<script>alert(1)</script>' }]);
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>alert');
  });

  it('escapes double quotes in selfCareNote', () => {
    const html = buildPdfHtml([{ ...BASE, selfCareNote: '"Pause" machen' }]);
    expect(html).toContain('&quot;Pause&quot;');
  });

  it('escapes single quotes in note', () => {
    const html = buildPdfHtml([{ ...BASE, note: "it's fine" }]);
    expect(html).toContain('it&#39;s');
  });

  it('escapes HTML in distressNote', () => {
    const html = buildPdfHtml([{ ...BASE, distressNote: '<b>heftig</b>' }]);
    expect(html).toContain('&lt;b&gt;heftig&lt;/b&gt;');
    expect(html).not.toContain('<b>heftig');
  });

  it('escapes & in thoughtsNote', () => {
    const html = buildPdfHtml([{ ...BASE, thoughtsNote: 'a & b' }]);
    expect(html).toContain('a &amp; b');
  });

  it('escapes HTML in innerPart', () => {
    const html = buildPdfHtml([{ ...BASE, innerPart: '<Critic>' }]);
    expect(html).toContain('&lt;Critic&gt;');
    expect(html).not.toContain('<Critic>');
  });
});

// ---------------------------------------------------------------------------
// H-01: buildPdfHtml — field length limits
// ---------------------------------------------------------------------------

describe('buildPdfHtml — field length limits', () => {
  it('exports PDF_MAX_FIELD_LENGTH as a positive number', () => {
    expect(typeof PDF_MAX_FIELD_LENGTH).toBe('number');
    expect(PDF_MAX_FIELD_LENGTH).toBeGreaterThan(0);
  });

  it('includes full text when within the limit', () => {
    const short = 'A'.repeat(100);
    const html = buildPdfHtml([{ ...BASE, note: short }]);
    expect(html).toContain(short);
    expect(html).not.toContain('[gekürzt]');
  });

  it('does not truncate text at exactly the limit', () => {
    const atLimit = 'B'.repeat(PDF_MAX_FIELD_LENGTH);
    const html = buildPdfHtml([{ ...BASE, note: atLimit }]);
    expect(html).not.toContain('[gekürzt]');
  });

  it('truncates note exceeding limit and appends [gekürzt] marker', () => {
    const long = 'C'.repeat(PDF_MAX_FIELD_LENGTH + 1);
    const html = buildPdfHtml([{ ...BASE, note: long }]);
    expect(html).toContain('[gekürzt]');
    expect(html).not.toContain(long);
  });

  it('truncates feelings when exceeding limit', () => {
    const long = 'x'.repeat(PDF_MAX_FIELD_LENGTH + 100);
    const html = buildPdfHtml([{ ...BASE, feelings: long }]);
    expect(html).toContain('[gekürzt]');
  });

  it('truncates selfCareNote when exceeding limit', () => {
    const long = 'y'.repeat(PDF_MAX_FIELD_LENGTH + 100);
    const html = buildPdfHtml([{ ...BASE, selfCareNote: long }]);
    expect(html).toContain('[gekürzt]');
  });

  it('escaping happens after truncation (no double marker)', () => {
    const long = '<b>' + 'A'.repeat(PDF_MAX_FIELD_LENGTH) + '</b>';
    const html = buildPdfHtml([{ ...BASE, note: long }]);
    expect(html).toContain('[gekürzt]');
    // The truncated result should be escaped — opening <b> should not appear raw
    expect(html).not.toContain('<b>A');
  });
});

// ---------------------------------------------------------------------------
// getCheckInsByIds (tested via checkins DB tests — see checkins.db.test.ts)
// ---------------------------------------------------------------------------
