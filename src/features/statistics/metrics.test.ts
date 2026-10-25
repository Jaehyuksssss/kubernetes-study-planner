import { describe, expect, it } from "vitest";
import { createSeedData } from "@/data/roadmap";
import { getCompletionRate, getCurrentStreak, getDailyMinutes, getTimeProgress } from "@/features/statistics/metrics";
import { kstTimestamp } from "@/lib/date";
import type { StudySession } from "@/types/study";

function session(date: string, minutes: number): StudySession {
  const startedAt = kstTimestamp(date);
  return { id: date, itemId: null, date, durationSeconds: minutes * 60, source: "manual", segments: [{ startedAt, endedAt: startedAt + minutes * 60_000 }], createdAt: new Date(startedAt).toISOString() };
}

describe("학습 지표", () => {
  it("시간 진도와 항목 완료율을 별도로 계산한다", () => {
    const data = createSeedData();
    const sessions = [session("2026-10-26", 966)];
    const items = data.items.map((item, index) => ({ ...item, status: index === 0 ? "completed" as const : item.status }));
    expect(getTimeProgress(sessions, data.settings)).toBe(10);
    expect(getCompletionRate(items)).toBeCloseTo(1.2, 1);
  });

  it("수동 기록을 일별 분으로 집계한다", () => {
    expect(getDailyMinutes([session("2026-10-26", 45), session("2026-10-26", 30)], "2026-10-26")).toBe(75);
  });

  it("휴식일은 streak를 끊거나 늘리지 않는다", () => {
    const data = createSeedData();
    const sessions = [session("2026-10-26", 30), session("2026-10-27", 30)];
    expect(getCurrentStreak(sessions, data.settings, "2026-10-29")).toBe(2);
    expect(getCurrentStreak([...sessions, session("2026-10-29", 30)], data.settings, "2026-10-29")).toBe(3);
  });
});
