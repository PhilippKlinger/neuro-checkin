import type { CheckIn } from '../types/checkin';
import { getLevelLabel, ENERGY_LABELS, FOCUS_LABELS, DISTRESS_LABELS } from '../types/checkin';

function formatDate(createdAt: string): string {
  // SQLite stores as "YYYY-MM-DD HH:MM:SS" — convert to readable German format
  const parts = createdAt.split(' ');
  const datePart = parts[0] ?? createdAt;
  const timePart = parts[1] ? parts[1].slice(0, 5) : '';
  return timePart ? `${datePart}, ${timePart} Uhr` : datePart;
}

function row(label: string, value: string): string {
  return `<tr><td class="label">${label}</td><td class="value">${value}</td></tr>`;
}

function buildCheckInBlock(c: CheckIn): string {
  const rows: string[] = [];

  if (!c.energySkipped && c.energyLevel > 0) {
    rows.push(
      row('Energie', `${c.energyLevel}/5 — ${getLevelLabel(c.energyLevel, ENERGY_LABELS)}`)
    );
  }
  if (!c.focusSkipped && c.focusLevel > 0) {
    rows.push(row('Fokus', `${c.focusLevel}/5 — ${getLevelLabel(c.focusLevel, FOCUS_LABELS)}`));
  }
  if (c.feelings) {
    rows.push(row('Gefühle', c.feelings));
  }
  if (c.distressLevel !== null) {
    const label = getLevelLabel(c.distressLevel, DISTRESS_LABELS);
    const note = c.distressNote ? ` — ${c.distressNote}` : '';
    rows.push(row('Stress', `${c.distressLevel}/5 — ${label}${note}`));
  }
  if (c.thoughtsType) {
    const typeLabel =
      c.thoughtsType === 'supportive'
        ? 'Unterstützend'
        : c.thoughtsType === 'burdening'
          ? 'Belastend'
          : 'Gemischt';
    const note = c.thoughtsNote ? ` — ${c.thoughtsNote}` : '';
    rows.push(row('Gedanken', `${typeLabel}${note}`));
  }
  if (c.selfCareNote) {
    rows.push(row('Selbstfürsorge', c.selfCareNote));
  }
  if (c.innerPart) {
    rows.push(row('IFS-Anteil', c.innerPart));
  }
  if (c.note) {
    rows.push(row('Notiz', c.note));
  }

  const tableContent = rows.length > 0 ? rows.join('\n') : '<tr><td colspan="2">—</td></tr>';

  return `
  <div class="checkin-block">
    <h2 class="checkin-date">${formatDate(c.createdAt)}</h2>
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
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
      font-size: 13px;
      color: #2c2c2c;
      padding: 24px 32px;
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
