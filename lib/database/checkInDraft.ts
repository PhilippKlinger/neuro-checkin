import type { SQLiteDatabase } from 'expo-sqlite';
import type { CheckInDraft } from '../types/checkin';
import { EMPTY_DRAFT, EMPTY_BODY_SIGNALS } from '../types/checkin';
import { INACTIVITY_TIMEOUT_MS } from '../constants/timing';

export const DRAFT_TTL_MS = INACTIVITY_TIMEOUT_MS; // 15 min

export async function saveDraft(
  db: SQLiteDatabase,
  draft: CheckInDraft,
  step: number
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO check_in_drafts (id, draft_json, step, saved_at)
     VALUES (1, ?, ?, ?)`,
    JSON.stringify(draft),
    step,
    new Date().toISOString()
  );
}

export async function loadDraft(
  db: SQLiteDatabase,
  now = Date.now()
): Promise<{ draft: CheckInDraft; step: number } | null> {
  const row = await db.getFirstAsync<{
    draft_json: string;
    step: number;
    saved_at: string;
  }>('SELECT draft_json, step, saved_at FROM check_in_drafts WHERE id = 1');

  if (!row) return null;

  const savedAtMs = new Date(row.saved_at).getTime();
  if (now - savedAtMs > DRAFT_TTL_MS) {
    await clearDraft(db);
    return null;
  }

  try {
    const parsed = JSON.parse(row.draft_json);
    if (!parsed || typeof parsed !== 'object') return null;

    const draft: CheckInDraft = {
      energyLevel: parsed.energyLevel ?? EMPTY_DRAFT.energyLevel,
      focusLevel: parsed.focusLevel ?? EMPTY_DRAFT.focusLevel,
      energySkipped: parsed.energySkipped ?? false,
      focusSkipped: parsed.focusSkipped ?? false,
      bodySignals: parsed.bodySignals ?? { ...EMPTY_BODY_SIGNALS },
      feelings: parsed.feelings ?? '',
      feelingsSkipped: parsed.feelingsSkipped ?? false,
      distressLevel: parsed.distressLevel ?? null,
      distressNote: parsed.distressNote ?? '',
      thoughtsType: parsed.thoughtsType ?? null,
      thoughtsNote: parsed.thoughtsNote ?? '',
      selfCareNote: parsed.selfCareNote ?? '',
      innerPart: parsed.innerPart ?? '',
      note: parsed.note ?? '',
    };
    return { draft, step: row.step };
  } catch {
    return null;
  }
}

export async function clearDraft(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM check_in_drafts WHERE id = 1');
}
