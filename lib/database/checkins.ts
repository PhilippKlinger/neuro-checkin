import type { SQLiteDatabase } from 'expo-sqlite';
import type { CheckIn, CheckInInsert, BodySignals } from '../types/checkin';
import { EMPTY_BODY_SIGNALS } from '../types/checkin';
import { TEXT_LIMITS } from '../constants/limits';

const VALID_THOUGHTS_TYPES = ['supportive', 'burdening', 'mixed'] as const;

// Android: NativeDatabase.prepareAsync can return null after the app is used for a while.
// Re-running a warmup query re-initialises the prepared-statement pipeline, then retry once.
async function withPrepareAsyncRetry<T>(db: SQLiteDatabase, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Error && error.message.includes('prepareAsync')) {
      await db.getFirstAsync<{ n: number }>('SELECT ? AS n', 1);
      return await fn();
    }
    throw error;
  }
}

function clampLevel(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function trimOrNull(value: string | null | undefined, maxLength?: number): string | null {
  if (value == null) return null;
  let trimmed = value.trim();
  if (trimmed === '') return null;
  if (maxLength && trimmed.length > maxLength) {
    trimmed = trimmed.slice(0, maxLength);
  }
  return trimmed;
}

function normalizeSignal(value: unknown): boolean | null {
  if (value === true || value === false) return value;
  return null;
}

export function normalizeCheckInInsert(data: CheckInInsert): CheckInInsert {
  const energyLevel = clampLevel(data.energyLevel, 0, 5);
  const focusLevel = clampLevel(data.focusLevel, 0, 5);
  const distressLevel = data.distressLevel == null ? null : clampLevel(data.distressLevel, 1, 5);

  let feelings = (data.feelings ?? '').trim();
  if (feelings.length > TEXT_LIMITS.MAX_FEELINGS_LENGTH) {
    feelings = feelings.slice(0, TEXT_LIMITS.MAX_FEELINGS_LENGTH);
  }

  const thoughtsType =
    data.thoughtsType && (VALID_THOUGHTS_TYPES as readonly string[]).includes(data.thoughtsType)
      ? data.thoughtsType
      : null;

  const bodySignals: BodySignals = {
    hunger: normalizeSignal(data.bodySignals.hunger),
    thirst: normalizeSignal(data.bodySignals.thirst),
    temperature: normalizeSignal(data.bodySignals.temperature),
    pain: normalizeSignal(data.bodySignals.pain),
    restroom: normalizeSignal(data.bodySignals.restroom),
    seating: normalizeSignal(data.bodySignals.seating),
    externalStimuli: normalizeSignal(data.bodySignals.externalStimuli),
  };

  return {
    energyLevel,
    focusLevel,
    energySkipped: data.energySkipped,
    focusSkipped: data.focusSkipped,
    bodySignals,
    feelings,
    feelingsSkipped: data.feelingsSkipped,
    distressLevel,
    distressNote: trimOrNull(data.distressNote, TEXT_LIMITS.MAX_NOTE_LENGTH),
    thoughtsType,
    thoughtsNote: trimOrNull(data.thoughtsNote, TEXT_LIMITS.MAX_NOTE_LENGTH),
    selfCareNote: trimOrNull(data.selfCareNote, TEXT_LIMITS.MAX_NOTE_LENGTH),
    innerPart: trimOrNull(data.innerPart, TEXT_LIMITS.MAX_INNER_PART_LENGTH),
    note: trimOrNull(data.note, TEXT_LIMITS.MAX_NOTE_LENGTH),
  };
}

export async function insertCheckIn(db: SQLiteDatabase, data: CheckInInsert): Promise<number> {
  const normalized = normalizeCheckInInsert(data);

  // Closure captures normalized once — used for first attempt and retry.
  const doInsert = () =>
    db.runAsync(
      `INSERT INTO check_ins (
        energy_level, focus_level, body_signals, feelings,
        distress_level, distress_note,
        thoughts_type, thoughts_note, self_care_note, inner_part, note,
        energy_skipped, focus_skipped, feelings_skipped
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      normalized.energyLevel,
      normalized.focusLevel,
      JSON.stringify(normalized.bodySignals),
      normalized.feelings,
      normalized.distressLevel,
      normalized.distressNote,
      normalized.thoughtsType,
      normalized.thoughtsNote,
      normalized.selfCareNote,
      normalized.innerPart,
      normalized.note,
      normalized.energySkipped ? 1 : 0,
      normalized.focusSkipped ? 1 : 0,
      normalized.feelingsSkipped ? 1 : 0
    );

  const result = await withPrepareAsyncRetry(db, doInsert);
  return result.lastInsertRowId;
}

export async function getCheckIns(db: SQLiteDatabase, limit = 50, offset = 0): Promise<CheckIn[]> {
  const rows = await withPrepareAsyncRetry(db, () =>
    db.getAllAsync<{
      id: number;
      created_at: string;
      energy_level: number;
      focus_level: number;
      energy_skipped: number;
      focus_skipped: number;
      feelings_skipped: number;
      body_signals: string;
      feelings: string;
      distress_level: number | null;
      distress_note: string | null;
      thoughts_type: string | null;
      thoughts_note: string | null;
      self_care_note: string | null;
      inner_part: string | null;
      note: string | null;
    }>('SELECT * FROM check_ins ORDER BY created_at DESC LIMIT ? OFFSET ?', limit, offset)
  );

  return rows.map(mapRowToCheckIn);
}

export async function getCheckInById(db: SQLiteDatabase, id: number): Promise<CheckIn | null> {
  const row = await withPrepareAsyncRetry(db, () =>
    db.getFirstAsync<{
      id: number;
      created_at: string;
      energy_level: number;
      focus_level: number;
      energy_skipped: number;
      focus_skipped: number;
      feelings_skipped: number;
      body_signals: string;
      feelings: string;
      distress_level: number | null;
      distress_note: string | null;
      thoughts_type: string | null;
      thoughts_note: string | null;
      self_care_note: string | null;
      inner_part: string | null;
      note: string | null;
    }>('SELECT * FROM check_ins WHERE id = ?', id)
  );

  return row ? mapRowToCheckIn(row) : null;
}

export async function getCheckInsByIds(db: SQLiteDatabase, ids: number[]): Promise<CheckIn[]> {
  if (ids.length === 0) return [];
  // ids come from internal state (number[]); placeholders use ? not values — safe
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await db.getAllAsync<{
    id: number;
    created_at: string;
    energy_level: number;
    focus_level: number;
    energy_skipped: number;
    focus_skipped: number;
    feelings_skipped: number;
    body_signals: string;
    feelings: string;
    distress_level: number | null;
    distress_note: string | null;
    thoughts_type: string | null;
    thoughts_note: string | null;
    self_care_note: string | null;
    inner_part: string | null;
    note: string | null;
  }>(`SELECT * FROM check_ins WHERE id IN (${placeholders}) ORDER BY created_at DESC`, ids);
  return rows.map(mapRowToCheckIn);
}

export async function deleteCheckIn(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM check_ins WHERE id = ?', id);
}

export async function countCheckIns(db: SQLiteDatabase): Promise<number> {
  const row = await withPrepareAsyncRetry(db, () =>
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM check_ins')
  );
  return row?.count ?? 0;
}

export async function deleteAllCheckIns(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM check_ins');
}

function parseBodySignals(raw: string): BodySignals {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...EMPTY_BODY_SIGNALS };
    return {
      hunger: parsed.hunger === true ? true : parsed.hunger === false ? false : null,
      thirst: parsed.thirst === true ? true : parsed.thirst === false ? false : null,
      temperature: parsed.temperature === true ? true : parsed.temperature === false ? false : null,
      pain: parsed.pain === true ? true : parsed.pain === false ? false : null,
      restroom: parsed.restroom === true ? true : parsed.restroom === false ? false : null,
      seating: parsed.seating === true ? true : parsed.seating === false ? false : null,
      externalStimuli:
        parsed.externalStimuli === true ? true : parsed.externalStimuli === false ? false : null,
    };
  } catch (error) {
    console.error('parseBodySignals: invalid JSON, using defaults', error);
    return { ...EMPTY_BODY_SIGNALS };
  }
}

function mapRowToCheckIn(row: {
  id: number;
  created_at: string;
  energy_level: number;
  focus_level: number;
  energy_skipped: number;
  focus_skipped: number;
  feelings_skipped: number;
  body_signals: string;
  feelings: string;
  distress_level: number | null;
  distress_note: string | null;
  thoughts_type: string | null;
  thoughts_note: string | null;
  self_care_note: string | null;
  inner_part: string | null;
  note: string | null;
}): CheckIn {
  return {
    id: row.id,
    createdAt: row.created_at,
    energyLevel: row.energy_level,
    focusLevel: row.focus_level,
    energySkipped: row.energy_skipped === 1,
    focusSkipped: row.focus_skipped === 1,
    feelingsSkipped: row.feelings_skipped === 1,
    bodySignals: parseBodySignals(row.body_signals),
    feelings: row.feelings,
    distressLevel: row.distress_level,
    distressNote: row.distress_note,
    thoughtsType: row.thoughts_type as CheckIn['thoughtsType'],
    thoughtsNote: row.thoughts_note,
    selfCareNote: row.self_care_note,
    innerPart: row.inner_part,
    note: row.note,
  };
}
