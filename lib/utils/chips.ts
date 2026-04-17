/**
 * Chip selection utilities for comma-separated value strings.
 * Used by StepFeelings and StepSelfCare.
 */

export function isChipSelected(chip: string, value: string): boolean {
  return value.split(',').map((s) => s.trim()).includes(chip);
}

export function toggleChip(chip: string, value: string): string {
  const parts = value.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.includes(chip)) {
    return parts.filter((p) => p !== chip).join(', ');
  }
  return [...parts, chip].join(', ');
}
