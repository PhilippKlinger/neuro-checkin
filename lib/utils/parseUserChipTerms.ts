import { MIN_LABEL_LENGTH, MAX_LABEL_LENGTH } from '../constants/userChips';

export interface ParseUserChipTermsResult {
  /** Terms within bounds, not standard, not a duplicate — ready to persist. */
  accepted: string[];
  /**
   * Terms that exceeded MAX_LABEL_LENGTH and were rejected.
   * Callers may surface these to the user as a ruhiger Hinweis.
   * Never silently truncated — a shortened word is one the user never wrote.
   */
  rejectedTooLong: string[];
}

/**
 * Parses a comma-separated string of chip terms:
 * 1. Split by comma, trim each part, collapse internal whitespace.
 * 2. Silently skip: empty, below MIN_LABEL_LENGTH, standard chips (case-insensitive), duplicates.
 * 3. Flag as rejectedTooLong: terms exceeding MAX_LABEL_LENGTH.
 * 4. Return accepted terms preserving the user's original casing (after trim+collapse).
 *
 * Pure function — no DB access. (UCL-01 Step 1, K-5 Architecture Decision)
 */
export function parseUserChipTerms(
  text: string,
  standardChips: string[]
): ParseUserChipTermsResult {
  const standardLower = new Set(
    standardChips.map((c) => c.toLowerCase().replace(/\s+/g, ' ').trim())
  );

  const seen = new Set<string>(); // case-insensitive dedup within input
  const accepted: string[] = [];
  const rejectedTooLong: string[] = [];

  const rawTerms = text.split(',').map((t) => t.replace(/\s+/g, ' ').trim());

  for (const term of rawTerms) {
    if (term.length === 0) continue;

    // Too short — silent skip
    if (term.length < MIN_LABEL_LENGTH) continue;

    // Too long — reject with flag
    if (term.length > MAX_LABEL_LENGTH) {
      rejectedTooLong.push(term);
      continue;
    }

    const termLower = term.toLowerCase();

    // Standard chip — silent skip
    if (standardLower.has(termLower)) continue;

    // Duplicate within this input — silent skip
    if (seen.has(termLower)) continue;

    seen.add(termLower);
    accepted.push(term);
  }

  return { accepted, rejectedTooLong };
}
