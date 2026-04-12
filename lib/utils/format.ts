/**
 * Parses a SQLite datetime string (YYYY-MM-DD HH:MM:SS) as UTC
 * and returns a proper Date object.
 */
function parseSqliteDate(iso: string): Date {
  // SQLite datetime('now') produces "YYYY-MM-DD HH:MM:SS" without timezone.
  // Append 'Z' to ensure consistent UTC interpretation across platforms.
  const normalized = iso.includes('T') || iso.includes('Z') ? iso : iso + 'Z';
  return new Date(normalized);
}

export function formatDate(iso: string): string {
  return parseSqliteDate(iso).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatTime(iso: string): string {
  return parseSqliteDate(iso).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(iso: string): string {
  const date = parseSqliteDate(iso);
  const datePart = date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart}, ${timePart}`;
}
