import { describe, expect, it } from "vitest";
import { getDday, getWeekRange, splitSegmentsByKstDate, toDateKey } from "@/lib/date";

describe("한국 시간 날짜 계산", () => {
  it("UTC 시각을 Asia/Seoul 날짜로 변환한다", () => {
    expect(toDateKey(new Date("2026-10-25T16:00:00.000Z"))).toBe("2026-10-26");
  });

  it("D-Day를 달력 날짜 차이로 계산한다", () => {
    expect(getDday("2027-01-30", new Date("2026-10-25T15:00:00.000Z"))).toBe(96);
    expect(getDday("2027-01-30", new Date("2027-01-29T15:00:00.000Z"))).toBe(0);
  });

  it("월요일부터 일요일까지 주간 범위를 반환한다", () => {
    expect(getWeekRange("2026-10-29")).toEqual({ start: "2026-10-26", end: "2026-11-01" });
    expect(getWeekRange("2026-11-01")).toEqual({ start: "2026-10-26", end: "2026-11-01" });
  });

  it("자정을 넘긴 세션을 KST 날짜별로 나눈다", () => {
    const totals = splitSegmentsByKstDate([{
      startedAt: Date.parse("2026-10-26T14:30:00.000Z"),
      endedAt: Date.parse("2026-10-26T15:30:00.000Z"),
    }]);
    expect(totals["2026-10-26"]).toBe(1800);
    expect(totals["2026-10-27"]).toBe(1800);
  });
});
