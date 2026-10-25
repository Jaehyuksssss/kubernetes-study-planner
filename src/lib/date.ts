const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00+09:00`);
}

export function toDateKey(value: Date | number = new Date()): string {
  const date = typeof value === "number" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addDays(dateKey: string, amount: number): string {
  const time = parseDateKey(dateKey).getTime() + amount * DAY_MS;
  return toDateKey(time);
}

export function diffCalendarDays(later: string, earlier: string): number {
  return Math.round((parseDateKey(later).getTime() - parseDateKey(earlier).getTime()) / DAY_MS);
}

export function getDday(examDate: string, now = new Date()): number {
  return diffCalendarDays(examDate, toDateKey(now));
}

export function getKstWeekday(dateKey: string): number {
  // KST midnight is 15:00 UTC on the previous day, so shift the UTC weekday.
  return (parseDateKey(dateKey).getUTCDay() + 1) % 7;
}

export function getWeekRange(dateKey: string): { start: string; end: string } {
  const day = getKstWeekday(dateKey);
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = addDays(dateKey, mondayOffset);
  return { start, end: addDays(start, 6) };
}

export function isDateBetween(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

export function formatKoreanDate(dateKey: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
    ...options,
  }).format(parseDateKey(dateKey));
}

export function getMonthGrid(year: number, month: number): string[] {
  const first = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const startOffset = getKstWeekday(first);
  const gridStart = addDays(first, -startOffset);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function getWeekNumber(dateKey: string, studyStartDate: string): number {
  return Math.max(1, Math.floor(diffCalendarDays(dateKey, studyStartDate) / 7) + 1);
}

export function splitSegmentsByKstDate(
  segments: Array<{ startedAt: number; endedAt: number | null }>,
  now = Date.now(),
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const segment of segments) {
    let cursor = segment.startedAt;
    const end = segment.endedAt ?? now;
    while (cursor < end) {
      const dateKey = toDateKey(cursor);
      const nextMidnightUtc = parseDateKey(addDays(dateKey, 1)).getTime();
      const sliceEnd = Math.min(end, nextMidnightUtc);
      result[dateKey] = (result[dateKey] ?? 0) + Math.max(0, sliceEnd - cursor) / 1000;
      cursor = sliceEnd;
    }
  }
  return result;
}

export function kstTimestamp(dateKey: string, hour = 12, minute = 0): number {
  return parseDateKey(dateKey).getTime() + hour * 60 * 60 * 1000 + minute * 60 * 1000;
}

export function toKstEpochParts(epoch: number): { date: string; millisecondsOfDay: number } {
  const shifted = epoch + KST_OFFSET_MS;
  return {
    date: new Date(shifted).toISOString().slice(0, 10),
    millisecondsOfDay: ((shifted % DAY_MS) + DAY_MS) % DAY_MS,
  };
}
