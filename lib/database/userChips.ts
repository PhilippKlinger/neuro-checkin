import type { SQLiteDatabase } from 'expo-sqlite';

type ChipCategory = 'feelings' | 'self_care';

export async function saveUserChips(
  db: SQLiteDatabase,
  category: ChipCategory,
  text: string,
  standardChips: string[]
): Promise<void> {
  const terms = text
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !standardChips.includes(t));

  for (const label of terms) {
    await db.runAsync(
      `INSERT OR IGNORE INTO user_chips (category, label, use_count) VALUES (?, ?, 0)`,
      [category, label]
    );
    await db.runAsync(
      `UPDATE user_chips SET use_count = use_count + 1 WHERE category = ? AND label = ?`,
      [category, label]
    );
  }
}

export async function getUserChips(db: SQLiteDatabase, category: ChipCategory): Promise<string[]> {
  const rows = await db.getAllAsync<{ label: string; use_count: number }>(
    `SELECT label, use_count FROM user_chips WHERE category = ? AND use_count >= 1 ORDER BY use_count DESC, id DESC LIMIT 20`,
    [category]
  );
  return rows.slice(0, 20).map((r) => r.label);
}

export async function deleteUserChips(db: SQLiteDatabase, category?: ChipCategory): Promise<void> {
  if (category) {
    await db.runAsync(`DELETE FROM user_chips WHERE category = ?`, [category]);
  } else {
    await db.runAsync(`DELETE FROM user_chips`, []);
  }
}
