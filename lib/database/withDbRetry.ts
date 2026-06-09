import type { SQLiteDatabase } from 'expo-sqlite';

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 50;

// Android: NativeDatabase.prepareAsync can return null transiently — during cold
// start (DB still warming) or after extended app use. A single warmup+retry is not
// enough: the warmup query itself hits the same null pipeline and throws. So we try
// up to MAX_ATTEMPTS times, each time re-initialising the pipeline with a warmup
// SELECT (whose own failure is ignored) and backing off briefly before retrying.
export async function withDbRetry<T>(
  db: SQLiteDatabase,
  fn: () => Promise<T>,
  attempts = MAX_ATTEMPTS
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isPrepareError = error instanceof Error && error.message.includes('prepareAsync');
      if (!isPrepareError || attempt === attempts - 1) throw error;
      try {
        await db.getFirstAsync<{ n: number }>('SELECT ? AS n', 1);
      } catch {
        // The warmup may also hit the null pipeline — ignore and let the backoff
        // + next attempt do the recovery.
      }
      await new Promise((resolve) => setTimeout(resolve, BASE_BACKOFF_MS * (attempt + 1)));
    }
  }
  throw lastError;
}
