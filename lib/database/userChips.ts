import type { SQLiteDatabase } from 'expo-sqlite';
import { MAX_USER_CHIPS_PER_CATEGORY } from '../constants/userChips';
import { parseUserChipTerms } from '../utils/parseUserChipTerms';

type ChipCategory = 'feelings' | 'self_care';

// ---------------------------------------------------------------------------
// prepareAsync NullPointer retry guard (H-5 pattern, GT-10)
// Mirrors the same guard in insertCheckIn (checkins.ts).
// Android: NativeDatabase.prepareAsync can return null; a warmup query
// re-initialises the prepared-statement pipeline so the retry succeeds.
// ---------------------------------------------------------------------------
async function withRetry<T>(db: SQLiteDatabase, fn: () => Promise<T>): Promise<T> {
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

// ---------------------------------------------------------------------------
// saveUserChips
// ---------------------------------------------------------------------------

/**
 * Parses `text` and persists valid user-defined chip terms for the given category.
 *
 * Rules (UCL-01 Step 1 — policy locked):
 * - `parseUserChipTerms` filters: too-short / too-long / standard chips / dedup
 * - NEW chips are only inserted when the category count is below MAX_USER_CHIPS_PER_CATEGORY.
 *   EXISTING chips always get their use_count incremented regardless of count (Option A).
 * - Dedup key: normalized_label = LOWER + whitespace-collapsed label (case-insensitive UNIQUE).
 */
export async function saveUserChips(
  db: SQLiteDatabase,
  category: ChipCategory,
  text: string,
  standardChips: string[]
): Promise<void> {
  const { accepted } = parseUserChipTerms(text, standardChips);
  const now = new Date().toISOString();

  for (const label of accepted) {
    const normalizedLabel = label.toLowerCase().replace(/\s+/g, ' ').trim();

    // Check whether this chip already exists (use_count increment always allowed).
    const existing = await withRetry(db, () =>
      db.getFirstAsync<{ id: number }>(
        `SELECT id FROM user_chips WHERE category = ? AND normalized_label = ?`,
        [category, normalizedLabel]
      )
    );

    if (!existing) {
      // New chip — enforce per-category limit (Option A: no auto-evict).
      const countRow = await withRetry(db, () =>
        db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) AS count FROM user_chips WHERE category = ? AND use_count >= 1`,
          [category]
        )
      );
      if ((countRow?.count ?? 0) >= MAX_USER_CHIPS_PER_CATEGORY) {
        continue; // Limit full — skip silently; UI already shows hint
      }
    }

    await withRetry(db, () =>
      db.runAsync(
        `INSERT OR IGNORE INTO user_chips
           (category, label, normalized_label, use_count, last_used_at)
         VALUES (?, ?, ?, 0, ?)`,
        [category, label, normalizedLabel, now]
      )
    );
    await withRetry(db, () =>
      db.runAsync(
        `UPDATE user_chips
         SET use_count = use_count + 1, last_used_at = ?
         WHERE category = ? AND normalized_label = ?`,
        [now, category, normalizedLabel]
      )
    );
  }
}

// ---------------------------------------------------------------------------
// getUserChips
// ---------------------------------------------------------------------------

/**
 * Returns up to MAX_USER_CHIPS_PER_CATEGORY chip labels for the given category,
 * sorted by use_count DESC, last_used_at DESC.
 * These are the SAME chips shown in UI and managed in Settings (Count == Visible == Manageable).
 */
export async function getUserChips(db: SQLiteDatabase, category: ChipCategory): Promise<string[]> {
  const rows = await withRetry(db, () =>
    db.getAllAsync<{ label: string }>(
      `SELECT label FROM user_chips
       WHERE category = ? AND use_count >= 1
       ORDER BY use_count DESC, last_used_at DESC
       LIMIT ${MAX_USER_CHIPS_PER_CATEGORY}`,
      [category]
    )
  );
  return rows.map((r) => r.label);
}

// ---------------------------------------------------------------------------
// countUserChipsByCategory
// ---------------------------------------------------------------------------

/**
 * Returns the number of stored user chips for the given category (use_count >= 1).
 * Replaces the old `countUserChips()` which counted across all categories.
 * Enables "X/10" display in Settings.
 */
export async function countUserChipsByCategory(
  db: SQLiteDatabase,
  category: ChipCategory
): Promise<number> {
  const row = await withRetry(db, () =>
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count FROM user_chips WHERE category = ? AND use_count >= 1`,
      [category]
    )
  );
  return row?.count ?? 0;
}

// ---------------------------------------------------------------------------
// countUserChips (kept for backward compat — settings.tsx)
// ---------------------------------------------------------------------------

/** @deprecated Use countUserChipsByCategory for per-category counts. */
export async function countUserChips(db: SQLiteDatabase): Promise<number> {
  const row = await withRetry(db, () =>
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM user_chips WHERE use_count >= 1`
    )
  );
  return row?.count ?? 0;
}

// ---------------------------------------------------------------------------
// deleteUserChipByLabel / deleteUserChips
// ---------------------------------------------------------------------------

export async function deleteUserChipByLabel(
  db: SQLiteDatabase,
  category: ChipCategory,
  label: string
): Promise<void> {
  await withRetry(db, () =>
    db.runAsync(`DELETE FROM user_chips WHERE category = ? AND label = ?`, [category, label])
  );
}

export async function deleteUserChips(db: SQLiteDatabase, category?: ChipCategory): Promise<void> {
  if (category) {
    await withRetry(db, () =>
      db.runAsync(`DELETE FROM user_chips WHERE category = ?`, [category])
    );
  } else {
    await withRetry(db, () =>
      db.runAsync(`DELETE FROM user_chips`, [])
    );
  }
}
