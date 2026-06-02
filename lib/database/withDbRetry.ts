import type { SQLiteDatabase } from 'expo-sqlite';

// Android: NativeDatabase.prepareAsync can return null after extended app use.
// A warmup SELECT re-initialises the prepared-statement pipeline so the retry succeeds.
export async function withDbRetry<T>(db: SQLiteDatabase, fn: () => Promise<T>): Promise<T> {
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
