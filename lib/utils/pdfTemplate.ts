import type { CheckIn, BodySignals } from '../types/checkin';
import { SIGNAL_LABELS } from '../types/checkin';
import { presentCheckIn } from './presentCheckIn';
import { formatDate, formatTime } from './format';

export const PDF_MAX_FIELD_LENGTH = 1000;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeValue(text: string): string {
  const truncated =
    text.length > PDF_MAX_FIELD_LENGTH ? text.slice(0, PDF_MAX_FIELD_LENGTH) + '[gekürzt]' : text;
  return escapeHtml(truncated);
}

function row(label: string, value: string): string {
  return `<tr><td class="label">${label}</td><td class="value">${safeValue(value)}</td></tr>`;
}

function buildCheckInBlock(c: CheckIn): string {
  const p = presentCheckIn(c);
  const rows: string[] = [];

  rows.push(row('Energie', p.energy ?? 'Nicht angegeben'));
  rows.push(row('Fokus', p.focus ?? 'Nicht angegeben'));

  const signalKeys = Object.keys(SIGNAL_LABELS) as (keyof BodySignals)[];
  const activeSignals = signalKeys
    .filter((k) => c.bodySignals[k] === true)
    .map((k) => SIGNAL_LABELS[k]);
  const inactiveSignals = signalKeys
    .filter((k) => c.bodySignals[k] === false)
    .map((k) => SIGNAL_LABELS[k]);
  if (activeSignals.length > 0 || inactiveSignals.length > 0) {
    const parts: string[] = [];
    if (activeSignals.length > 0) parts.push(`Ja: ${activeSignals.join(', ')}`);
    if (inactiveSignals.length > 0) parts.push(`Nein: ${inactiveSignals.join(', ')}`);
    rows.push(row('Körpersignale', parts.join(' · ')));
  }

  if (c.feelingsSkipped) {
    rows.push(row('Gefühle', 'Übersprungen'));
  } else if (p.feelings) {
    rows.push(row('Gefühle', p.feelings));
  }

  if (p.distressWithNote) rows.push(row('Stress', p.distressWithNote));
  if (p.thoughtsType) {
    const note = p.thoughtsNote ? ` — ${p.thoughtsNote}` : '';
    rows.push(row('Gedanken', `${p.thoughtsType}${note}`));
  }
  if (p.selfCare) rows.push(row('Selbstfürsorge', p.selfCare));
  if (p.innerPart) rows.push(row('IFS-Anteil', p.innerPart));
  if (p.note) rows.push(row('Notiz', p.note));

  const tableContent = rows.length > 0 ? rows.join('\n') : '<tr><td colspan="2">—</td></tr>';

  return `
  <div class="checkin-block">
    <h2 class="checkin-date">${formatDate(c.createdAt)}, ${formatTime(c.createdAt)} Uhr</h2>
    <table>
      <tbody>
        ${tableContent}
      </tbody>
    </table>
  </div>`;
}

export function buildPdfHtml(checkIns: CheckIn[]): string {
  const exportDate = new Date().toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const blocks = checkIns.map(buildCheckInBlock).join('\n  <hr class="divider" />\n');

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Neuro Check-in Export</title>
  <style>
    @page {
      margin: 24px 32px 48px 32px;
      @bottom-center {
        content: counter(page) " / " counter(pages);
        font-size: 9px;
        color: #aaa;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
      font-size: 13px;
      color: #2c2c2c;
      padding: 0;
      line-height: 1.5;
    }
    header {
      border-bottom: 2px solid #c8b8a2;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    header h1 { font-size: 20px; font-weight: 600; color: #4a3728; }
    header p { font-size: 11px; color: #888; margin-top: 4px; }
    .checkin-block { page-break-inside: avoid; padding: 12px 0; }
    .checkin-date {
      font-size: 14px;
      font-weight: 600;
      color: #4a3728;
      margin-bottom: 8px;
    }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 4px 8px 4px 0; vertical-align: top; }
    td.label {
      width: 30%;
      font-weight: 500;
      color: #666;
      white-space: nowrap;
    }
    td.value { color: #2c2c2c; }
    hr.divider { border: none; border-top: 1px solid #e8ddd4; margin: 8px 0; }
    footer {
      margin-top: 32px;
      border-top: 1px solid #e8ddd4;
      padding-top: 10px;
      font-size: 10px;
      color: #aaa;
      text-align: center;
    }
  </style>
</head>
<body>
  <header>
    <h1>Neuro Check-in</h1>
    <p>Exportiert am ${exportDate}</p>
  </header>

  ${blocks.length > 0 ? blocks : '<p style="color:#888;">Keine Check-ins ausgewählt.</p>'}

  <footer>Erstellt mit Neuro Check-in</footer>
</body>
</html>`;
}
