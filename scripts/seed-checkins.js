/**
 * seed-checkins.js
 * Inserts 15 organic check-ins into the app DB via ADB + run-as.
 * Works on Google Play emulator images (no adb root needed).
 * Requires: debug build installed (npx expo run:android), ADB in PATH.
 * Run via: npm run seed
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT    = path.join(__dirname, '..');
const PACKAGE = 'com.philippklinger.neurocheckin';
const DB_LOCAL     = path.join(ROOT, '_nc_seed.db');
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
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(hour)}:${p(minute)}:00`;
}

function bs(o) {
  return JSON.stringify({
    hunger: null, thirst: null, temperature: null,
    pain: null, restroom: null, seating: null, externalStimuli: null,
    ...o,
  });
}

// ── ensure better-sqlite3 ──────────────────────────────────────────────────

const bsqlPath = path.join(ROOT, 'node_modules', 'better-sqlite3');

let Database;
try {
  Database = require(bsqlPath);
} catch (e) {
  // Handles: not installed OR wrong binary for current Node version (ERR_DLOPEN_FAILED)
  console.log('[0/5] better-sqlite3 nicht verfügbar — installiere aktuelle Version...');
  if (fs.existsSync(bsqlPath)) fs.rmSync(bsqlPath, { recursive: true, force: true });
  // --no-save: nicht in package.json/lockfile eintragen (kein RN-Dependency)
  // @latest: immer Node-kompatible Prebuilts
  execSync('npm install --no-save better-sqlite3@latest', { cwd: ROOT, stdio: 'inherit' });
  Database = require(bsqlPath);
}

// ── seed data ──────────────────────────────────────────────────────────────

const checkins = [
  { created_at: dt(21,  9,15), energy_level:2, focus_level:1,  body_signals:bs({hunger:true,thirst:true,externalStimuli:true}),             feelings:'erschöpft, angespannt',             thoughts_type:'burdening',  thoughts_note:'Alles fühlt sich schwer an heute.',          self_care_note:null,                                    note:null },
  { created_at: dt(20, 20,45), energy_level:3, focus_level:0,  body_signals:bs({}),                                                         feelings:'',                                  thoughts_type:null,         thoughts_note:null,                                         self_care_note:null,                                    note:null },
  { created_at: dt(18,  8,30), energy_level:4, focus_level:4,  body_signals:bs({hunger:true,thirst:false,temperature:false}),                feelings:'leicht, zufrieden',                 thoughts_type:'supportive', thoughts_note:'Hab gut geschlafen. Fühle mich klar.',       self_care_note:'Tee gemacht, langsam gestartet.',       note:null },
  { created_at: dt(16, 14,20), energy_level:1, focus_level:2,  body_signals:bs({thirst:true,temperature:true,externalStimuli:true,seating:true}), feelings:'überwältigt, gereizt',         thoughts_type:'burdening',  thoughts_note:null,                                         self_care_note:'Kurze Pause, Stöpsel rein.',             note:'Zu viel auf einmal.' },
  { created_at: dt(15, 21, 0), energy_level:3, focus_level:3,  body_signals:bs({hunger:false}),                                             feelings:'Irgendwo zwischen müde und okay. Schwer zu sagen.', thoughts_type:'mixed', thoughts_note:null,                             self_care_note:null,                                    note:null },
  { created_at: dt(13,  9, 0), energy_level:2, focus_level:0,  body_signals:bs({}),                                                         feelings:'erschöpft',                         thoughts_type:null,         thoughts_note:null,                                         self_care_note:null,                                    note:null },
  { created_at: dt(12, 12,10), energy_level:3, focus_level:4,  body_signals:bs({hunger:true,thirst:true}),                                  feelings:'neutral, leicht',                   thoughts_type:'supportive', thoughts_note:null,                                         self_care_note:'Gegessen, kurz spazieren.',             note:null },
  { created_at: dt(10,  8,45), energy_level:4, focus_level:5,  body_signals:bs({hunger:false,thirst:false,pain:false}),                     feelings:'leicht',                            thoughts_type:'supportive', thoughts_note:'Klarer Kopf heute. Selten so.',              self_care_note:null,                                    note:null },
  { created_at: dt( 9, 19,50), energy_level:2, focus_level:2,  body_signals:bs({thirst:true,seating:true}),                                 feelings:'leer, abgestumpft',                 thoughts_type:null,         thoughts_note:null,                                         self_care_note:'Früh schlafen.',                        note:null },
  { created_at: dt( 7, 15,30), energy_level:1, focus_level:1,  body_signals:bs({pain:true,externalStimuli:true}),                           feelings:'Nicht definierbar',                 thoughts_type:'burdening',  thoughts_note:'Kann das nicht in Worte fassen.',            self_care_note:null,                                    note:'Harter Tag. Einfach nur da sein.' },
  { created_at: dt( 5, 11, 0), energy_level:3, focus_level:4,  body_signals:bs({hunger:true,thirst:true,temperature:false}),                feelings:'verwirrt, neutral',                 thoughts_type:'mixed',      thoughts_note:null,                                         self_care_note:'Gegessen. Getrunken. Reicht.',          note:null },
  { created_at: dt( 4, 20, 0), energy_level:4, focus_level:4,  body_signals:bs({hunger:false,thirst:false}),                               feelings:'zufrieden, leicht',                 thoughts_type:'supportive', thoughts_note:'War ein guter Tag.',                         self_care_note:'Abendspaziergang.',                     note:null },
  { created_at: dt( 3,  9,30), energy_level:3, focus_level:0,  body_signals:bs({}),                                                         feelings:'',                                  thoughts_type:null,         thoughts_note:null,                                         self_care_note:null,                                    note:null },
  { created_at: dt( 2, 14, 0), energy_level:3, focus_level:3,  body_signals:bs({hunger:true,temperature:true}),                             feelings:'neutral, frustriert',               thoughts_type:'mixed',      thoughts_note:'Einiges hat heute nicht geklappt.',          self_care_note:null,                                    note:null },
  { created_at: dt( 1,  8,30), energy_level:3, focus_level:4,  body_signals:bs({hunger:false,thirst:false,externalStimuli:false}),          feelings:'leicht, zufrieden',                 thoughts_type:'supportive', thoughts_note:null,                                         self_care_note:'Morgenroutine eingehalten.',            note:null },
];

// ── main ───────────────────────────────────────────────────────────────────

console.log(`\n[seed-checkins] ${checkins.length} Check-ins vorbereitet.\n`);

try {
  // 1 — App stoppen damit DB nicht gesperrt ist
  console.log('[1/5] App stoppen...');
  run(`adb shell am force-stop ${PACKAGE}`);

  // 2 — Alle 3 WAL-Dateien streamen (Schema liegt im WAL, nicht in der .db)
  console.log('[2/5] Datenbank vom Gerät streamen (db + wal + shm)...');
  fs.writeFileSync(DB_LOCAL,     execSync(`adb exec-out run-as ${PACKAGE} cat files/SQLite/neuro-checkin.db`));
  try { fs.writeFileSync(DB_LOCAL_WAL, execSync(`adb exec-out run-as ${PACKAGE} cat files/SQLite/neuro-checkin.db-wal`)); } catch { /* optional */ }
  try { fs.writeFileSync(DB_LOCAL_SHM, execSync(`adb exec-out run-as ${PACKAGE} cat files/SQLite/neuro-checkin.db-shm`)); } catch { /* optional */ }

  // 3 — Lokal einfügen
  console.log('[3/5] Check-ins einfügen...');
  const db = new Database(DB_LOCAL);
  // WAL in Hauptdatei einfalten damit nur noch .db relevant ist
  db.pragma('wal_checkpoint(TRUNCATE)');

  const insert = db.prepare(`
    INSERT INTO check_ins
      (created_at, energy_level, focus_level, body_signals, feelings,
       thoughts_type, thoughts_note, self_care_note, inner_part, note)
    VALUES
      (@created_at, @energy_level, @focus_level, @body_signals, @feelings,
       @thoughts_type, @thoughts_note, @self_care_note, @inner_part, @note)
  `);

  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run({ inner_part: null, ...row });
  });

  insertMany(checkins);
  db.pragma('wal_checkpoint(TRUNCATE)');
  const count = db.prepare('SELECT COUNT(*) AS n FROM check_ins').get().n;
  db.close();
  console.log(`     ✓ Check-ins in der Datenbank: ${count}`);

  // 4 — Nur die .db zurückschreiben (WAL ist eingefaltet), WAL+SHM auf Gerät löschen
  console.log('[4/5] Datenbank zurückschreiben...');
  run(`adb push "${DB_LOCAL}" /data/local/tmp/_nc_seed.db`);
  run(`adb shell run-as ${PACKAGE} cp /data/local/tmp/_nc_seed.db files/SQLite/neuro-checkin.db`);
  try { run(`adb shell run-as ${PACKAGE} rm files/SQLite/neuro-checkin.db-wal`); } catch { /* ok */ }
  try { run(`adb shell run-as ${PACKAGE} rm files/SQLite/neuro-checkin.db-shm`); } catch { /* ok */ }

  // 5 — Aufräumen
  console.log('[5/5] Aufräumen...');
  try { run(`adb shell rm /data/local/tmp/_nc_seed.db`); } catch { /* ok */ }
  for (const f of [DB_LOCAL, DB_LOCAL_WAL, DB_LOCAL_SHM]) {
    try { fs.unlinkSync(f); } catch { /* ok */ }
  }

  console.log('\n✓ Fertig. App neu starten — Verlauf und Home-Karte sind gefüllt.\n');

} catch (e) {
  console.error('\n[Fehler]', e.message);
  if (e.message.includes('run-as')) {
    console.log('\nHinweis: run-as funktioniert nur mit einem Debug-Build (npx expo run:android).');
    console.log('EAS-Builds (internal distribution) sind nicht debuggable.\n');
  }
  for (const f of [DB_LOCAL, DB_LOCAL_WAL, DB_LOCAL_SHM]) {
    try { fs.unlinkSync(f); } catch { /* ok */ }
  }
}
