import type { SQLiteDatabase } from 'expo-sqlite';
import type { CheckIn, CheckInInsert, BodySignals } from '../types/checkin';
import { EMPTY_BODY_SIGNALS } from '../types/checkin';

export async function insertCheckIn(
  db: SQLiteDatabase,
  data: CheckInInsert
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO check_ins (
      energy_level, focus_level, body_signals, feelings,
      thoughts_type, thoughts_note, self_care_note, inner_part, note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    data.energyLevel,
    data.focusLevel,
    JSON.stringify(data.bodySignals),
    data.feelings,
    data.thoughtsType,
    data.thoughtsNote,
    data.selfCareNote,
    data.innerPart,
    data.note
  );
  return result.lastInsertRowId;
}

export async function getCheckIns(
  db: SQLiteDatabase,
  limit = 50,
  offset = 0
): Promise<CheckIn[]> {
  const rows = await db.getAllAsync<{
    id: number;
    created_at: string;
    energy_level: number;
    focus_level: number;
    body_signals: string;
    feelings: string;
    thoughts_type: string | null;
    thoughts_note: string | null;
    self_care_note: string | null;
    inner_part: string | null;
    note: string | null;
  }>(
    'SELECT * FROM check_ins ORDER BY created_at DESC LIMIT ? OFFSET ?',
    limit,
    offset
  );

  return rows.map(mapRowToCheckIn);
}

export async function getCheckInById(
  db: SQLiteDatabase,
  id: number
): Promise<CheckIn | null> {
  const row = await db.getFirstAsync<{
    id: number;
    created_at: string;
    energy_level: number;
    focus_level: number;
    body_signals: string;
    feelings: string;
    thoughts_type: string | null;
    thoughts_note: string | null;
    self_care_note: string | null;
    inner_part: string | null;
    note: string | null;
  }>('SELECT * FROM check_ins WHERE id = ?', id);

  return row ? mapRowToCheckIn(row) : null;
}

export async function deleteCheckIn(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM check_ins WHERE id = ?', id);
}

export async function countCheckIns(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM check_ins');
  return row?.count ?? 0;
}

export async function deleteAllCheckIns(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM check_ins');
}

function parseBodySignals(raw: string): BodySignals {
  try {
    return JSON.parse(raw) as BodySignals;
  } catch {
    return { ...EMPTY_BODY_SIGNALS };
  }
}

function mapRowToCheckIn(row: {
  id: number;
  created_at: string;
  energy_level: number;
  focus_level: number;
  body_signals: string;
  feelings: string;
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
    bodySignals: parseBodySignals(row.body_signals),
    feelings: row.feelings,
    thoughtsType: row.thoughts_type as CheckIn['thoughtsType'],
    thoughtsNote: row.thoughts_note,
    selfCareNote: row.self_care_note,
    innerPart: row.inner_part,
    note: row.note,
  };
}
