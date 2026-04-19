export function timeStringToDate(time: string): Date {
  const date = new Date();
  const [h, m] = time.split(':').map(Number);
  date.setHours(h, m, 0, 0);
  return date;
}

export function dateToTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
