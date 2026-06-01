/**
 * seed-patterns.js
 * Deterministic seed datasets to test the REFLECT-02 Home reflection states.
 * Unlike seed-checkins.js (organic, appends), this WIPES check_ins first so the
 * resulting reflection state is unambiguous.
 *
 * Usage:
 *   npm run seed:active   → 'active' card: 3 lines (Durst, Schmerzen, Energie hoch)
 *   npm run seed:varied   → 'varied' card: "Deine Tage waren sehr unterschiedlich."
 *   npm run seed:steady   → 'steady' card: "Deine Tage waren sich ähnlich."
 *
 * Requires: debug build installed (npx expo run:android), ADB in PATH.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT    = path.join(__dirname, '..');
const PACKAGE = 'com.philippklinger.neurocheckin';
const DB_LOCAL     = path.join(ROOT, '_nc_pattern.db');
const DB_LOCAL_WAL = DB_LOCAL + '-wal';
const DB_LOCAL_SHM = DB_LOCAL + '-shm';

// ── helpers ────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'inherit', ...opts });
}

function dt(daysAgo, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(hour)}:${p(minute)}:00`;
}

function bs(o) {
  return JSON.stringify({
    hunger: null, thirst: null, temperature: null,
    pain: null, restroom: null, seating: null, externalStimuli: null,
    ...o,
  });
}

/** Build a full check_ins row from a compact spec, dated newest-first (2/day). */
function row(idx, spec) {
  const day  = Math.floor(idx / 2) + 1;             // 2 check-ins per day
  const [h, m] = idx % 2 === 0 ? [9, 0] : [20, 30];
  return {
    created_at: dt(day, h, m),
    energy_level: spec.energy,
    focus_level: spec.focus ?? spec.energy,
    energy_skipped: 0,
    focus_skipped: 0,
    feelings_skipped: 0,
    body_signals: bs(spec.signals ?? {}),
    feelings: '',
    distress_level: spec.distress ?? null,
    distress_note: null,
    thoughts_type: null,
    thoughts_note: null,
    self_care_note: null,
    inner_part: null,
    note: null,
  };
}

function build(specs) {
  return specs.map((s, i) => row(i, s));
}

// ── datasets (14 check-ins each; hand-verified counts in comments) ───────────

const DATASETS = {
  // ACTIVE → dominant patterns. thirst 10/14 (71%), pain 8/14 (57%), energyHigh
  // 10/14 (71%). Card: "Du hattest oft Durst." + "Du hattest oft Schmerzen."
  // (2 negatives, cap) + "Deine Energie war oft hoch." (1 positive) = 3 lines.
  active: build([
    ...Array(8).fill({ energy: 5, signals: { thirst: true, pain: true } }),
    ...Array(2).fill({ energy: 4, signals: { thirst: true } }),
    ...Array(4).fill({ energy: 3 }),
  ]),

  // VARIED → no dominant dimension, but energy swings.
  // energyLow 5/14 (36%) and energyHigh 5/14 (36%) → neither dominant;
  // 5 low ≥2 AND 5 high ≥2 → energySwing → 'varied'.
  varied: build([
    ...Array(5).fill({ energy: 1 }),
    ...Array(5).fill({ energy: 5 }),
    ...Array(4).fill({ energy: 3 }),
  ]),

  // STEADY → calm, similar days. 10×energy3 + 4×energy4 → energyHigh 4/14 (29%)
  // not dominant; range = 4−3 = 1 ≤ 1; no tense distress; few signals → 'steady'.
  steady: build([
    ...Array(10).fill({ energy: 3 }),
    ...Array(4).fill({ energy: 4 }),
  ]),
};

// ── main ─────────────────────────────────────────────────────────────────────

function main(mode) {
  const checkins = DATASETS[mode];
  if (!checkins) {
    console.error(`\n[Fehler] Unbekannter Modus "${mode}". Erlaubt: ${Object.keys(DATASETS).join(', ')}\n`);
    process.exit(1);
  }

  console.log(`\n[seed-patterns] Modus "${mode}" — ${checkins.length} Check-ins (check_ins wird zuerst geleert).\n`);

  // ensure better-sqlite3 (only when actually run)
  const bsqlPath = path.join(ROOT, 'node_modules', 'better-sqlite3');
  let Database;
  try {
    Database = require(bsqlPath);
  } catch {
    console.log('[0/5] better-sqlite3 nicht verfügbar — installiere...');
    if (fs.existsSync(bsqlPath)) fs.rmSync(bsqlPath, { recursive: true, force: true });
    execSync('npm install --no-save better-sqlite3@latest', { cwd: ROOT, stdio: 'inherit' });
    Database = require(bsqlPath);
  }

  try {
    console.log('[1/5] App stoppen...');
    run(`adb shell am force-stop ${PACKAGE}`);

    console.log('[2/5] Datenbank vom Gerät streamen (db + wal + shm)...');
    fs.writeFileSync(DB_LOCAL, execSync(`adb exec-out run-as ${PACKAGE} cat files/SQLite/neuro-checkin.db`));
    try { fs.writeFileSync(DB_LOCAL_WAL, execSync(`adb exec-out run-as ${PACKAGE} cat files/SQLite/neuro-checkin.db-wal`)); } catch { /* optional */ }
    try { fs.writeFileSync(DB_LOCAL_SHM, execSync(`adb exec-out run-as ${PACKAGE} cat files/SQLite/neuro-checkin.db-shm`)); } catch { /* optional */ }

    console.log('[3/5] check_ins leeren + Pattern-Daten einfügen...');
    const db = new Database(DB_LOCAL);
    db.pragma('wal_checkpoint(TRUNCATE)');
    db.exec('DELETE FROM check_ins;');

    const insert = db.prepare(`
      INSERT INTO check_ins
        (created_at, energy_level, focus_level, energy_skipped, focus_skipped, feelings_skipped,
         body_signals, feelings, distress_level, distress_note,
         thoughts_type, thoughts_note, self_care_note, inner_part, note)
      VALUES
        (@created_at, @energy_level, @focus_level, @energy_skipped, @focus_skipped, @feelings_skipped,
         @body_signals, @feelings, @distress_level, @distress_note,
         @thoughts_type, @thoughts_note, @self_care_note, @inner_part, @note)
    `);
    const insertMany = db.transaction((rows) => { for (const r of rows) insert.run(r); });
    insertMany(checkins);

    const count = db.prepare('SELECT COUNT(*) AS n FROM check_ins').get().n;
    console.log(`     ✓ Check-ins in der Datenbank: ${count}`);

    db.pragma('wal_checkpoint(TRUNCATE)');
    db.close();

    console.log('[4/5] Datenbank zurückschreiben...');
    run(`adb push "${DB_LOCAL}" /data/local/tmp/_nc_pattern.db`);
    run(`adb shell run-as ${PACKAGE} cp /data/local/tmp/_nc_pattern.db files/SQLite/neuro-checkin.db`);
    try { run(`adb shell run-as ${PACKAGE} rm files/SQLite/neuro-checkin.db-wal`); } catch { /* ok */ }
    try { run(`adb shell run-as ${PACKAGE} rm files/SQLite/neuro-checkin.db-shm`); } catch { /* ok */ }

    console.log('[5/5] Aufräumen...');
    try { run(`adb shell rm /data/local/tmp/_nc_pattern.db`); } catch { /* ok */ }
    for (const f of [DB_LOCAL, DB_LOCAL_WAL, DB_LOCAL_SHM]) {
      try { fs.unlinkSync(f); } catch { /* ok */ }
    }

    console.log(`\n✓ Fertig. App neu starten — Home-Karte zeigt jetzt den "${mode}"-Zustand.\n`);
  } catch (e) {
    console.error('\n[Fehler]', e.message);
    if (e.message.includes('run-as')) {
      console.log('\nHinweis: run-as funktioniert nur mit einem Debug-Build (npx expo run:android).\n');
    }
    for (const f of [DB_LOCAL, DB_LOCAL_WAL, DB_LOCAL_SHM]) {
      try { fs.unlinkSync(f); } catch { /* ok */ }
    }
  }
}

// Only run the ADB plumbing when invoked directly (allows importing DATASETS in tests).
if (require.main === module) {
  main(process.argv[2] || 'active');
}

module.exports = { DATASETS };
