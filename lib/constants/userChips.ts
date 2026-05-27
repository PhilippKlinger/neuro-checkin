/** Per-category limit: maximum number of user-defined chips stored. (UCL-01 Step 1) */
export const MAX_USER_CHIPS_PER_CATEGORY = 10;

/** Minimum character length for a user-defined chip label. */
export const MIN_LABEL_LENGTH = 2;

/**
 * Maximum character length for a user-defined chip label.
 * Terms exceeding this are rejected with a hint — never silently truncated.
 * (UCL-01 Step 1: "gekürztes Wort = eins, das der Nutzer nie schrieb")
 */
export const MAX_LABEL_LENGTH = 30;
