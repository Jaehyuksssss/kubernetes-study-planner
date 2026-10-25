import { addDays, getKstWeekday, getWeekRange, isDateBetween, splitSegmentsByKstDate, toDateKey } from "@/lib/date";
import { percent } from "@/lib/format";
import type { AppSettings, StudyItem, StudySession } from "@/types/study";

export function sessionSecondsByDate(sessions: StudySession[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const session of sessions) {
    if (session.source === "manual" || session.segments.length === 0) {
      totals[session.date] = (totals[session.date] ?? 0) + session.durationSeconds;
      continue;
    }
    const split = splitSegmentsByKstDate(session.segments);
    for (const [date, seconds] of Object.entries(split)) {
      totals[date] = (totals[date] ?? 0) + seconds;
    }
  }
  return totals;
}

export function getDailyMinutes(sessions: StudySession[], date: string): number {
  return Math.round((sessionSecondsByDate(sessions)[date] ?? 0) / 60);
}

export function getRangeMinutes(sessions: StudySession[], start: string, end: string): number {
  return Math.round(
    Object.entries(sessionSecondsByDate(sessions))
      .filter(([date]) => isDateBetween(date, start, end))
      .reduce((sum, [, seconds]) => sum + seconds, 0) / 60,
  );
}

export function getWeekMinutes(sessions: StudySession[], date: string): number {
  const range = getWeekRange(date);
  return getRangeMinutes(sessions, range.start, range.end);
}

export function getTotalMinutes(sessions: StudySession[]): number {
  return Math.round(sessions.reduce((sum, session) => sum + session.durationSeconds, 0) / 60);
}

export function getCompletionRate(items: StudyItem[]): number {
  return percent(items.filter((item) => item.status === "completed").length, items.length);
}

export function getTimeProgress(sessions: StudySession[], settings: AppSettings): number {
  return percent(getTotalMinutes(sessions), settings.totalTargetMinutes);
}

export function getCurrentStreak(
  sessions: StudySession[],
  settings: AppSettings,
  today = toDateKey(),
): number {
  const studied = new Set(
    Object.entries(sessionSecondsByDate(sessions))
      .filter(([, seconds]) => seconds > 0)
      .map(([date]) => date),
  );
  let cursor = studied.has(today) || settings.restDays.includes(getKstWeekday(today)) ? today : addDays(today, -1);
  let streak = 0;
  let guard = 0;
  while (guard < 3660) {
    if (studied.has(cursor)) {
      streak += 1;
    } else if (!settings.restDays.includes(getKstWeekday(cursor))) {
      break;
    }
    cursor = addDays(cursor, -1);
    guard += 1;
  }
  return streak;
}

export function getPlannedMinutes(items: StudyItem[], start: string, end: string): number {
  return items
    .filter((item) => isDateBetween(item.scheduledDate, start, end))
    .reduce((sum, item) => sum + item.estimatedMinutes, 0);
}
