#!/usr/bin/env node
// claude-guardian.mjs — GRD-01 Phase 1 (non-blocking)
// Feuert bei UserPromptSubmit (Kontext-Injektion) und Stop (P0-Warnungen).
// Phase 1: exit immer 0 — niemals blockieren, nur erinnern.

import { readFileSync } from 'fs';

let input;
try {
  const raw = readFileSync(0, 'utf-8'); // fd 0 = stdin, Windows-kompatibel
  input = JSON.parse(raw);
} catch {
  process.exit(0); // Fail silent — Guardian blockiert Claude nie
}

const event = input?.hook_event_name ?? '';
const transcript = Array.isArray(input?.transcript) ? input.transcript : [];

function extractText(content) {
  if (typeof content === 'string') return content.toLowerCase();
  if (Array.isArray(content)) {
    return content
      .filter(c => c?.type === 'text')
      .map(c => c?.text ?? '')
      .join(' ')
      .toLowerCase();
  }
  return '';
}

function getLastMessage(role) {
  for (let i = transcript.length - 1; i >= 0; i--) {
    if (transcript[i]?.role === role) return extractText(transcript[i].content);
  }
  return '';
}

// ── UserPromptSubmit: Kontext-Injektion ──────────────────────────────────────
if (event === 'UserPromptSubmit') {
  const prompt = getLastMessage('user');
  const hints = [];

  if (/\b(bug|fix|fixing|fixed|crash|broken|kaputt|fehler|finding|regressi)\b/.test(prompt)) {
    hints.push('Bugfix → /regression: Root Cause → Naht → Absicherung. Kein Fix ohne Ursache.');
  }
  if (/\b(feature|refactor|neue|add|bau|implement|erstell|umbau|sprint)\b/.test(prompt)) {
    hints.push('Feature → DoD-Stufe beachten (Logic / UI / Native / Release). 1 logische Änderung pro Branch.');
  }
  if (/\b(release|build|eas|play.?console|preview|production|publish|git.?tag)\b/.test(prompt)) {
    hints.push('Release → /release-gate vor dem Build. Version-Sync: app.json / package.json / Git-Tag müssen übereinstimmen.');
  }
  if (/\b(layout|scroll|safe.?area|padding|touch.?target|a11y|accessibility|dark.?mode|animation|overlay)\b/.test(prompt)) {
    hints.push('UI → A11y (44px Targets, Labels, Roles), NAV_AREA_PADDING, insets.bottom, Dark/Light, Reduced Motion prüfen.');
  }
  if (/\b(notification|sqlite|database|db|filesystem|pdf|print|permission|expo-print|expo-sqlite|expo-file)\b/.test(prompt)) {
    hints.push('Native-API → Gerätetest Pflicht. DoD-Stufe = Native. Keine API in ihrem Verhaltenstest mocken.');
  }
  if (/\b(architektur|architecture|service|modul|module|deep|shallow|deletion.?test|naht|seam)\b/.test(prompt)) {
    hints.push('Architektur → Decision-Log respektieren (A-33 renderStep-Switch, A-34 StepScaffold, K-3 NotificationSlot). Erst Deletion-Test.');
  }

  if (hints.length > 0) {
    process.stdout.write('[Guardian] ' + hints.join(' | ') + '\n');
  }

  process.exit(0);
}

// ── Stop: P0-Warnungen (Phase 1: nur warnen, nicht blockieren) ───────────────
if (event === 'Stop') {
  const prompt = getLastMessage('user');
  const response = getLastMessage('assistant');
  const warnings = [];

  // P0-A: Bugfix ohne Regression-Gedanke
  const isBugfix = /\b(bug|fix|crash|finding|fehler)\b/.test(prompt);
  const hasRegression = /\b(regression|root.?cause|naht|absicher)\b/.test(response) || response.includes('/regression');
  if (isBugfix && !hasRegression) {
    warnings.push('P0: Bugfix ohne Regression-Gedanke — /regression-Schritt erwähnt?');
  }

  // P0-B: Native-API-Änderung ohne Gerätetest-Hinweis
  const isNative = /\b(notification|sqlite|pdf|print|filesystem|file.rename|permission)\b/.test(prompt);
  const hasDeviceTest = /\b(gerätetest|device.?test|emulator|physical|gerät)\b/.test(response);
  if (isNative && !hasDeviceTest) {
    warnings.push('P0: Native-API-Kontext ohne Gerätetest-Hinweis — DoD-Stufe Native beachten.');
  }

  // P0-C: Versions-Änderung ohne Sync-Erwähnung
  const isVersion = /\b(version|versioncode|app\.json|package\.json)\b/.test(prompt);
  const hasSync = /\b(sync|synchron|git.?tag|release.?gate)\b/.test(response);
  if (isVersion && !hasSync) {
    warnings.push('P0: Versions-Änderung — Version-Sync geprüft (app.json / package.json / Git-Tag)?');
  }

  if (warnings.length > 0) {
    // Phase 1: Warnungen ausgeben, NICHT blockieren
    process.stdout.write('[Guardian Phase 1 – Warnungen] ' + warnings.join(' | ') + '\n');
  }

  process.exit(0);
}

// Unbekanntes Event → kein Eingriff
process.exit(0);
