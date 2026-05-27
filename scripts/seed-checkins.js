/**
 * seed-checkins.js
 * Inserts 60 organic check-ins (30 days × 2/day) into the app DB via ADB + run-as.
 * Compatible with schema version 12 (v1.6.0+). Includes user_chips (UCL-01 limits: MAX 10/category).
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
  console.log('[0/5] better-sqlite3 nicht verfügbar — installiere aktuelle Version...');
  if (fs.existsSync(bsqlPath)) fs.rmSync(bsqlPath, { recursive: true, force: true });
  execSync('npm install --no-save better-sqlite3@latest', { cwd: ROOT, stdio: 'inherit' });
  Database = require(bsqlPath);
}

// ── seed data — 60 check-ins over 30 days ─────────────────────────────────
// Realistic ND patterns: morning (8-10h) + evening (19-22h), varying energy,
// some skipped fields, occasional distress spikes, alexithymia moments.

const checkins = [
  // ─── Day 30 (oldest) ───
  { created_at: dt(30, 8,45), energy_level:2, focus_level:1, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true,thirst:true,externalStimuli:true}), feelings:'erschöpft, angespannt', distress_level:4, distress_note:'Alles fühlt sich schwer an.', thoughts_type:'burdening', thoughts_note:'Alles fühlt sich schwer an heute.', self_care_note:null, inner_part:null, note:null },
  { created_at: dt(30,21,10), energy_level:1, focus_level:1, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({pain:true,seating:true}), feelings:'leer', distress_level:3, distress_note:null, thoughts_type:'burdening', thoughts_note:null, self_care_note:'Früh ins Bett.', inner_part:null, note:null },

  // ─── Day 29 ───
  { created_at: dt(29, 9,30), energy_level:3, focus_level:2, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true,thirst:false}), feelings:'neutral', distress_level:null, distress_note:null, thoughts_type:null, thoughts_note:null, self_care_note:'Gefrühstückt.', inner_part:null, note:null },
  { created_at: dt(29,20,15), energy_level:2, focus_level:2, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({}), feelings:'', distress_level:null, distress_note:null, thoughts_type:null, thoughts_note:null, self_care_note:null, inner_part:null, note:null },

  // ─── Day 28 ───
  { created_at: dt(28, 8,15), energy_level:4, focus_level:4, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:false,thirst:false,pain:false}), feelings:'leicht, zufrieden', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:'Hab gut geschlafen. Fühle mich klar.', self_care_note:'Tee gemacht, langsam gestartet.', inner_part:null, note:null },
  { created_at: dt(28,20,0), energy_level:3, focus_level:3, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true}), feelings:'zufrieden', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:'War ein guter Tag.', self_care_note:'Abendspaziergang.', inner_part:null, note:null },

  // ─── Day 27 ───
  { created_at: dt(27, 9,00), energy_level:3, focus_level:0, energy_skipped:0, focus_skipped:1, feelings_skipped:0, body_signals:bs({}), feelings:'verwirrt', distress_level:null, distress_note:null, thoughts_type:'mixed', thoughts_note:null, self_care_note:null, inner_part:null, note:'Kann mich nicht einschätzen.' },
  { created_at: dt(27,19,45), energy_level:2, focus_level:2, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({thirst:true,temperature:true}), feelings:'gereizt', distress_level:2, distress_note:null, thoughts_type:'burdening', thoughts_note:'Zu viele Reize heute.', self_care_note:'Noise-Cancelling.', inner_part:null, note:null },

  // ─── Day 26 ───
  { created_at: dt(26,10,00), energy_level:1, focus_level:1, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true,thirst:true,pain:true,externalStimuli:true}), feelings:'überwältigt', distress_level:5, distress_note:'Ich bin am Limit.', thoughts_type:'burdening', thoughts_note:'Kann das nicht in Worte fassen.', self_care_note:null, inner_part:null, note:'Harter Tag. Einfach nur da sein.' },
  { created_at: dt(26,22,00), energy_level:1, focus_level:0, energy_skipped:0, focus_skipped:1, feelings_skipped:1, body_signals:bs({}), feelings:'', distress_level:4, distress_note:null, thoughts_type:null, thoughts_note:null, self_care_note:null, inner_part:null, note:null },

  // ─── Day 25 ───
  { created_at: dt(25, 9,15), energy_level:2, focus_level:2, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true}), feelings:'erschöpft', distress_level:3, distress_note:null, thoughts_type:'burdening', thoughts_note:'Gestern nachwirkend.', self_care_note:'Langsam anfangen.', inner_part:null, note:null },
  { created_at: dt(25,20,30), energy_level:3, focus_level:3, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:false,thirst:false}), feelings:'neutral, leicht', distress_level:2, distress_note:null, thoughts_type:'mixed', thoughts_note:null, self_care_note:'Spazieren gewesen.', inner_part:null, note:null },

  // ─── Day 24 ───
  { created_at: dt(24, 8,30), energy_level:3, focus_level:3, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true,thirst:true,temperature:false}), feelings:'neutral', distress_level:null, distress_note:null, thoughts_type:null, thoughts_note:null, self_care_note:'Gegessen. Getrunken.', inner_part:null, note:null },
  { created_at: dt(24,21,00), energy_level:3, focus_level:4, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({}), feelings:'zufrieden', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:'Produktiver Nachmittag.', self_care_note:null, inner_part:null, note:null },

  // ─── Day 23 ───
  { created_at: dt(23, 9,45), energy_level:4, focus_level:5, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:false,thirst:false,pain:false}), feelings:'motiviert, leicht', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:'Klarer Kopf heute. Selten so.', self_care_note:null, inner_part:null, note:null },
  { created_at: dt(23,19,30), energy_level:3, focus_level:3, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true}), feelings:'zufrieden, dankbar', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:null, self_care_note:'Gekocht, Podcast gehört.', inner_part:null, note:null },

  // ─── Day 22 ───
  { created_at: dt(22, 8,00), energy_level:2, focus_level:2, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({thirst:true,seating:true}), feelings:'leer, abgestumpft', distress_level:2, distress_note:null, thoughts_type:null, thoughts_note:null, self_care_note:null, inner_part:null, note:null },
  { created_at: dt(22,20,45), energy_level:2, focus_level:1, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({externalStimuli:true}), feelings:'gereizt', distress_level:3, distress_note:null, thoughts_type:'burdening', thoughts_note:'Zu laut überall.', self_care_note:'Stöpsel rein, Licht aus.', inner_part:null, note:null },

  // ─── Day 21 ───
  { created_at: dt(21, 9,30), energy_level:3, focus_level:3, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true,thirst:true}), feelings:'neutral', distress_level:null, distress_note:null, thoughts_type:'mixed', thoughts_note:null, self_care_note:'Gefrühstückt.', inner_part:null, note:null },
  { created_at: dt(21,21,15), energy_level:4, focus_level:4, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:false}), feelings:'leicht, freudig', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:'Guter Abend.', self_care_note:null, inner_part:null, note:null },

  // ─── Day 20 ───
  { created_at: dt(20,10,15), energy_level:0, focus_level:0, energy_skipped:1, focus_skipped:1, feelings_skipped:0, body_signals:bs({}), feelings:'Kann ich gerade nicht sagen', distress_level:null, distress_note:null, thoughts_type:null, thoughts_note:null, self_care_note:null, inner_part:null, note:'Alexithymie-Tag.' },
  { created_at: dt(20,20,00), energy_level:2, focus_level:2, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true,thirst:true}), feelings:'erschöpft', distress_level:2, distress_note:null, thoughts_type:null, thoughts_note:null, self_care_note:'Essen bestellt.', inner_part:null, note:null },

  // ─── Day 19 ───
  { created_at: dt(19, 8,45), energy_level:3, focus_level:4, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:false,thirst:false}), feelings:'leicht', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:null, self_care_note:'Morgenroutine eingehalten.', inner_part:null, note:null },
  { created_at: dt(19,19,50), energy_level:3, focus_level:3, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({temperature:true}), feelings:'neutral, frustriert', distress_level:2, distress_note:null, thoughts_type:'mixed', thoughts_note:'Einiges hat heute nicht geklappt.', self_care_note:null, inner_part:null, note:null },

  // ─── Day 18 ───
  { created_at: dt(18, 9,00), energy_level:4, focus_level:4, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true,thirst:false}), feelings:'motiviert', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:'Klar und ruhig.', self_care_note:'Yoga gemacht.', inner_part:null, note:null },
  { created_at: dt(18,21,30), energy_level:3, focus_level:2, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({seating:true}), feelings:'neutral', distress_level:null, distress_note:null, thoughts_type:null, thoughts_note:null, self_care_note:null, inner_part:null, note:null },

  // ─── Day 17 ───
  { created_at: dt(17, 9,15), energy_level:2, focus_level:1, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true,thirst:true,pain:true}), feelings:'angespannt, erschöpft', distress_level:4, distress_note:'Kopfschmerzen seit gestern.', thoughts_type:'burdening', thoughts_note:null, self_care_note:'Ibuprofen, Wasser.', inner_part:null, note:null },
  { created_at: dt(17,20,00), energy_level:2, focus_level:2, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({pain:true}), feelings:'erschöpft', distress_level:3, distress_note:null, thoughts_type:'burdening', thoughts_note:'Wird das je besser?', self_care_note:'Früh schlafen.', inner_part:null, note:null },

  // ─── Day 16 ───
  { created_at: dt(16, 8,30), energy_level:3, focus_level:3, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true}), feelings:'neutral', distress_level:2, distress_note:null, thoughts_type:'mixed', thoughts_note:null, self_care_note:'Gefrühstückt.', inner_part:null, note:'Kopf besser.' },
  { created_at: dt(16,19,45), energy_level:3, focus_level:4, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:false,thirst:false}), feelings:'zufrieden', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:'Heute geschafft was ich wollte.', self_care_note:null, inner_part:null, note:null },

  // ─── Day 15 ───
  { created_at: dt(15,10,00), energy_level:5, focus_level:5, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:false,thirst:false,pain:false,externalStimuli:false}), feelings:'freudig, motiviert', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:'Heute fühlt sich alles richtig an.', self_care_note:null, inner_part:null, note:'Seltener guter Tag.' },
  { created_at: dt(15,21,00), energy_level:4, focus_level:4, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({}), feelings:'dankbar, zufrieden', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:null, self_care_note:'Langer Spaziergang.', inner_part:null, note:null },

  // ─── Day 14 ───
  { created_at: dt(14, 9,30), energy_level:3, focus_level:3, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true,thirst:true}), feelings:'neutral', distress_level:null, distress_note:null, thoughts_type:null, thoughts_note:null, self_care_note:'Wasser, Snack.', inner_part:null, note:null },
  { created_at: dt(14,20,30), energy_level:2, focus_level:2, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({externalStimuli:true}), feelings:'gereizt, angespannt', distress_level:3, distress_note:null, thoughts_type:'burdening', thoughts_note:'Zu viel Bildschirmzeit.', self_care_note:'Digital Detox ab jetzt.', inner_part:null, note:null },

  // ─── Day 13 ───
  { created_at: dt(13, 8,15), energy_level:3, focus_level:4, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:false,thirst:false}), feelings:'leicht', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:null, self_care_note:'Morgenroutine.', inner_part:null, note:null },
  { created_at: dt(13,20,00), energy_level:3, focus_level:3, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({}), feelings:'neutral, zufrieden', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:'Ruhiger Tag.', self_care_note:null, inner_part:null, note:null },

  // ─── Day 12 ───
  { created_at: dt(12, 9,00), energy_level:2, focus_level:0, energy_skipped:0, focus_skipped:1, feelings_skipped:0, body_signals:bs({hunger:true}), feelings:'Irgendwo zwischen müde und okay. Schwer zu sagen.', distress_level:null, distress_note:null, thoughts_type:'mixed', thoughts_note:null, self_care_note:null, inner_part:null, note:null },
  { created_at: dt(12,21,45), energy_level:2, focus_level:2, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({thirst:true}), feelings:'erschöpft', distress_level:2, distress_note:null, thoughts_type:null, thoughts_note:null, self_care_note:'Tee.', inner_part:null, note:null },

  // ─── Day 11 ───
  { created_at: dt(11, 8,45), energy_level:4, focus_level:4, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:false,thirst:false,temperature:false}), feelings:'leicht, motiviert', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:'Gut geschlafen.', self_care_note:null, inner_part:null, note:null },
  { created_at: dt(11,19,30), energy_level:3, focus_level:3, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true}), feelings:'zufrieden', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:null, self_care_note:'Gekocht.', inner_part:null, note:null },

  // ─── Day 10 ───
  { created_at: dt(10,10,30), energy_level:1, focus_level:1, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true,thirst:true,externalStimuli:true,temperature:true}), feelings:'überwältigt, gereizt', distress_level:5, distress_note:'Sensorische Überlastung.', thoughts_type:'burdening', thoughts_note:'Shutdown-Gefahr.', self_care_note:'Dunkler Raum, Decke.', inner_part:null, note:'Meltdown knapp verhindert.' },
  { created_at: dt(10,22,15), energy_level:1, focus_level:0, energy_skipped:0, focus_skipped:1, feelings_skipped:1, body_signals:bs({}), feelings:'', distress_level:3, distress_note:null, thoughts_type:null, thoughts_note:null, self_care_note:null, inner_part:null, note:null },

  // ─── Day 9 ───
  { created_at: dt(9, 9,15), energy_level:2, focus_level:2, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true,pain:true}), feelings:'erschöpft', distress_level:3, distress_note:null, thoughts_type:'burdening', thoughts_note:'Gestern war zu viel.', self_care_note:'Langsam. Kein Druck.', inner_part:null, note:null },
  { created_at: dt(9, 20,00), energy_level:3, focus_level:3, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:false}), feelings:'neutral', distress_level:2, distress_note:null, thoughts_type:'mixed', thoughts_note:null, self_care_note:'Abend-Spaziergang.', inner_part:null, note:null },

  // ─── Day 8 ───
  { created_at: dt(8, 8,30), energy_level:3, focus_level:4, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:false,thirst:false}), feelings:'leicht', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:null, self_care_note:'Morgenroutine.', inner_part:null, note:null },
  { created_at: dt(8, 20,30), energy_level:4, focus_level:4, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({}), feelings:'zufrieden, dankbar', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:'Produktiv und trotzdem entspannt.', self_care_note:null, inner_part:null, note:null },

  // ─── Day 7 ───
  { created_at: dt(7, 9,00), energy_level:3, focus_level:3, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true,thirst:true}), feelings:'neutral', distress_level:null, distress_note:null, thoughts_type:null, thoughts_note:null, self_care_note:'Gegessen.', inner_part:null, note:null },
  { created_at: dt(7, 19,15), energy_level:2, focus_level:2, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({seating:true,temperature:true}), feelings:'frustriert', distress_level:2, distress_note:null, thoughts_type:'mixed', thoughts_note:'Nicht alles geschafft.', self_care_note:null, inner_part:null, note:null },

  // ─── Day 6 ───
  { created_at: dt(6, 8,45), energy_level:4, focus_level:5, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:false,thirst:false,pain:false}), feelings:'motiviert, leicht', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:'Fokus-Tag.', self_care_note:null, inner_part:null, note:null },
  { created_at: dt(6, 21,00), energy_level:3, focus_level:3, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true}), feelings:'zufrieden', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:null, self_care_note:'Essen, Musik.', inner_part:null, note:null },

  // ─── Day 5 ───
  { created_at: dt(5, 9,30), energy_level:2, focus_level:2, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true,externalStimuli:true}), feelings:'angespannt', distress_level:3, distress_note:null, thoughts_type:'burdening', thoughts_note:'Zu wenig Schlaf.', self_care_note:'Kaffee, ruhiger Ort.', inner_part:null, note:null },
  { created_at: dt(5, 20,45), energy_level:2, focus_level:1, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({pain:true,thirst:true}), feelings:'erschöpft, leer', distress_level:3, distress_note:null, thoughts_type:'burdening', thoughts_note:null, self_care_note:'Früh ins Bett.', inner_part:null, note:null },

  // ─── Day 4 ───
  { created_at: dt(4, 8,15), energy_level:3, focus_level:3, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true,thirst:false}), feelings:'neutral', distress_level:null, distress_note:null, thoughts_type:'mixed', thoughts_note:null, self_care_note:'Gefrühstückt.', inner_part:null, note:'Besser geschlafen.' },
  { created_at: dt(4, 20,00), energy_level:4, focus_level:4, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:false,thirst:false}), feelings:'zufrieden, leicht', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:'War ein guter Tag.', self_care_note:'Spaziergang.', inner_part:null, note:null },

  // ─── Day 3 ───
  { created_at: dt(3, 9,00), energy_level:3, focus_level:0, energy_skipped:0, focus_skipped:1, feelings_skipped:0, body_signals:bs({}), feelings:'verwirrt', distress_level:null, distress_note:null, thoughts_type:null, thoughts_note:null, self_care_note:null, inner_part:null, note:'Kann Fokus nicht einschätzen.' },
  { created_at: dt(3, 21,30), energy_level:3, focus_level:3, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:false}), feelings:'neutral, zufrieden', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:null, self_care_note:null, inner_part:null, note:null },

  // ─── Day 2 ───
  { created_at: dt(2, 8,30), energy_level:4, focus_level:4, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:false,thirst:false}), feelings:'leicht, motiviert', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:'Guter Start.', self_care_note:'Morgenroutine.', inner_part:null, note:null },
  { created_at: dt(2, 19,45), energy_level:3, focus_level:3, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:true}), feelings:'zufrieden', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:null, self_care_note:'Gekocht, Netflix.', inner_part:null, note:null },

  // ─── Day 1 (yesterday) ───
  { created_at: dt(1, 9,00), energy_level:3, focus_level:4, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:false,thirst:false,externalStimuli:false}), feelings:'leicht, zufrieden', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:null, self_care_note:'Morgenroutine eingehalten.', inner_part:null, note:null },
  { created_at: dt(1, 20,30), energy_level:3, focus_level:3, energy_skipped:0, focus_skipped:0, feelings_skipped:0, body_signals:bs({hunger:false}), feelings:'neutral, dankbar', distress_level:null, distress_note:null, thoughts_type:'supportive', thoughts_note:'Ruhiger Abend.', self_care_note:null, inner_part:null, note:null },
];

// ── user chips ─────────────────────────────────────────────────────────────
// UCL-01 limits: MAX_USER_CHIPS_PER_CATEGORY = 10, MIN_LABEL_LENGTH = 2, MAX_LABEL_LENGTH = 30
//
// feelings  → 9 chips  (near full: 1 slot left)
//   → Test: add 10th in-app = allowed (fills up)
//   → Test: add 11th in-app = blocked after UCL-01 implementation
//
// self_care → 10 chips (completely full)
//   → Test: add any new chip = immediately blocked after UCL-01 implementation
//
// None overlap with FEELING_CHIPS / SELF_CARE_CHIPS standard lists.
// Sorted by use_count DESC so top chips appear first in UI.

const userChips = [
  // ── feelings (9/10) ──────────────────────────────────────────────────────
  { category: 'feelings', label: 'Benommen',         use_count: 12 },
  { category: 'feelings', label: 'Zittrig',           use_count: 9  },
  { category: 'feelings', label: 'Wach',              use_count: 7  },
  { category: 'feelings', label: 'Kribbelig',         use_count: 6  },
  { category: 'feelings', label: 'Taub',              use_count: 5  },
  { category: 'feelings', label: 'Ausgeliefert',      use_count: 4  },
  { category: 'feelings', label: 'Schwebend',         use_count: 3  },
  { category: 'feelings', label: 'Geerdet',           use_count: 2  },
  { category: 'feelings', label: 'Seltsam',           use_count: 1  },

  // ── self_care (10/10 — VOLL) ─────────────────────────────────────────────
  { category: 'self_care', label: 'Rückzug',          use_count: 14 },
  { category: 'self_care', label: 'Decke',            use_count: 11 },
  { category: 'self_care', label: 'Noise-Cancelling', use_count: 8  },
  { category: 'self_care', label: 'Dösen',            use_count: 7  },
  { category: 'self_care', label: 'Lesen',            use_count: 6  },
  { category: 'self_care', label: 'Fenster auf',      use_count: 4  },
  { category: 'self_care', label: 'Kuscheln',         use_count: 3  },
  { category: 'self_care', label: 'Zettel schreiben', use_count: 2  },
  { category: 'self_care', label: 'Kalt waschen',     use_count: 2  },
  { category: 'self_care', label: 'Kerze an',         use_count: 1  },
];

// ── main ───────────────────────────────────────────────────────────────────

console.log(`\n[seed-checkins] ${checkins.length} Check-ins + ${userChips.length} User-Chips vorbereitet.\n`);

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
  db.pragma('wal_checkpoint(TRUNCATE)');

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

  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });

  insertMany(checkins);
  const count = db.prepare('SELECT COUNT(*) AS n FROM check_ins').get().n;
  console.log(`     ✓ Check-ins in der Datenbank: ${count}`);

  // — user chips
  const insertChip = db.prepare(
    `INSERT OR IGNORE INTO user_chips (category, label, use_count) VALUES (@category, @label, @use_count)`
  );
  const insertManyChips = db.transaction((rows) => {
    for (const row of rows) insertChip.run(row);
  });
  insertManyChips(userChips);
  const chipCount = db.prepare('SELECT COUNT(*) AS n FROM user_chips').get().n;
  const feelingsCount  = db.prepare("SELECT COUNT(*) AS n FROM user_chips WHERE category = 'feelings'").get().n;
  const selfCareCount  = db.prepare("SELECT COUNT(*) AS n FROM user_chips WHERE category = 'self_care'").get().n;
  console.log(`     ✓ User-Chips in der Datenbank: ${chipCount} (feelings: ${feelingsCount}/10, self_care: ${selfCareCount}/10)`);

  db.pragma('wal_checkpoint(TRUNCATE)');
  db.close();

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

  console.log('\n✓ Fertig. App neu starten — Verlauf, Home-Karte und eigene Chips sind gefüllt.\n');
  console.log('  Teste: Gefühle-Chips im Check-in → "Deine Wörter" sichtbar (9 Wörter).');
  console.log('  Teste: Selbstfürsorge → 10 eigene Chips (komplett voll nach UCL-01).');
  console.log('  Teste: Einstellungen → Eigene Chips verwalten, Einzel-Löschen.');

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
