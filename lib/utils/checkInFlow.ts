import type { CheckInDraft } from '../types/checkin';

type BlockableFields = Pick<
  CheckInDraft,
  'energyLevel' | 'energySkipped' | 'focusLevel' | 'focusSkipped'
>;

/**
 * Returns true when the current step requires a value that has not been
 * provided yet and has not been explicitly skipped.
 * Only steps 1 (energy) and 2 (focus) can be blocked.
 */
export function isStepBlocked(step: number, draft: BlockableFields): boolean {
  if (step === 1) return draft.energyLevel === 0 && !draft.energySkipped;
  if (step === 2) return draft.focusLevel === 0 && !draft.focusSkipped;
  return false;
}

/**
 * Returns true when the user left the check-in flow at `leftAt` (ms timestamp)
 * and `now - leftAt` exceeds `timeoutMs`.
 * Returns false when `leftAt` is null (no recorded leave time).
 */
export function isInactivityExpired(
  leftAt: number | null,
  now: number,
  timeoutMs: number
): boolean {
  if (leftAt === null) return false;
  return now - leftAt > timeoutMs;
}
