import { withDbRetry } from '../lib/database/withDbRetry';
import type { SQLiteDatabase } from 'expo-sqlite';

function makeDb(getFirstAsyncImpl?: jest.Mock): Pick<SQLiteDatabase, 'getFirstAsync'> {
  return {
    getFirstAsync: getFirstAsyncImpl ?? jest.fn().mockResolvedValue({ n: 1 }),
  } as unknown as Pick<SQLiteDatabase, 'getFirstAsync'>;
}

describe('withDbRetry', () => {
  it('returns result directly when fn succeeds on first call', async () => {
    const db = makeDb();
    const fn = jest.fn().mockResolvedValue('ok');
    const result = await withDbRetry(db as SQLiteDatabase, fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
    expect((db as any).getFirstAsync).not.toHaveBeenCalled();
  });

  it('retries once after prepareAsync error and returns second-call result', async () => {
    const warmup = jest.fn().mockResolvedValue({ n: 1 });
    const db = makeDb(warmup);
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('NativeDatabase.prepareAsync returned null'))
      .mockResolvedValueOnce('retried');

    const result = await withDbRetry(db as SQLiteDatabase, fn);
    expect(result).toBe('retried');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(warmup).toHaveBeenCalledTimes(1);
  });

  it('rethrows non-prepareAsync errors without retry', async () => {
    const warmup = jest.fn();
    const db = makeDb(warmup);
    const fn = jest.fn().mockRejectedValue(new Error('disk full'));

    await expect(withDbRetry(db as SQLiteDatabase, fn)).rejects.toThrow('disk full');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(warmup).not.toHaveBeenCalled();
  });

  it('rethrows if retry also fails', async () => {
    const db = makeDb();
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('NativeDatabase.prepareAsync returned null'))
      .mockRejectedValueOnce(new Error('NativeDatabase.prepareAsync returned null'));

    await expect(withDbRetry(db as SQLiteDatabase, fn)).rejects.toThrow('prepareAsync');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
