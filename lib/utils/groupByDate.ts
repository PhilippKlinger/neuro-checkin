import type { CheckIn } from '../types/checkin';

export interface HistorySection {
  title: string;
  data: CheckIn[];
}

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
] as const;

function toLocalDate(sqliteDate: string): Date {
  const normalized =
    sqliteDate.includes('T') || sqliteDate.includes('Z') ? sqliteDate : sqliteDate + 'Z';
  return new Date(normalized);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMondayOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

function getSectionKey(itemDate: Date, now: Date): string {
  const todayStart = startOfDay(now);
  const itemStart = startOfDay(itemDate);

  const diffMs = todayStart.getTime() - itemStart.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Heute';
  if (diffDays === 1) return 'Gestern';

  const thisMonday = getMondayOfWeek(now);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);

  if (itemStart >= thisMonday) return 'Diese Woche';
  if (itemStart >= lastMonday) return 'Letzte Woche';

  return `${MONTH_NAMES[itemDate.getMonth()]} ${itemDate.getFullYear()}`;
}

export function groupCheckInsByDate(items: CheckIn[]): HistorySection[] {
  if (items.length === 0) return [];

  const now = new Date();
  const sections: HistorySection[] = [];
  let currentKey = '';

  for (const item of items) {
    const itemDate = toLocalDate(item.createdAt);
    const key = getSectionKey(itemDate, now);

    if (key !== currentKey) {
      sections.push({ title: key, data: [item] });
      currentKey = key;
    } else {
      sections[sections.length - 1].data.push(item);
    }
  }

  return sections;
}
