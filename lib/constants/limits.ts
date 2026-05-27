export const TEXT_LIMITS = {
  // Feelings field stores comma-separated chip labels.
  // Max: 10 chips × 30 chars + 9 separators (", ") ≈ 318 chars. (UCL-01, GT-10 Finding 11)
  MAX_FEELINGS_LENGTH: 320,
  MAX_NOTE_LENGTH: 200,
  MAX_INNER_PART_LENGTH: 150,
  MAX_FEEDBACK_LENGTH: 500,
} as const;
