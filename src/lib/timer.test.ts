import { describe, expect, it } from "vitest";
import { pauseTimer, resumeTimer, timerElapsedSeconds } from "@/lib/timer";
import type { StudyTimer } from "@/types/study";

describe("학습 타이머", () => {
  it("시작 시각 기준으로 실제 경과 시간을 계산한다", () => {
    const timer: StudyTimer = { status: "running", itemId: null, accumulatedSeconds: 0, segments: [{ startedAt: 1_000, endedAt: null }] };
    expect(timerElapsedSeconds(timer, 61_000)).toBe(60);
  });

  it("일시정지 구간을 경과 시간에서 제외한다", () => {
    const running: StudyTimer = { status: "running", itemId: "a", accumulatedSeconds: 0, segments: [{ startedAt: 1_000, endedAt: null }] };
    const paused = pauseTimer(running, 31_000);
    const resumed = resumeTimer(paused, 91_000);
    expect(timerElapsedSeconds(resumed, 121_000)).toBe(60);
    expect(resumed.segments).toHaveLength(2);
  });

  it("중복 pause와 resume 호출은 상태를 바꾸지 않는다", () => {
    const paused: StudyTimer = { status: "paused", itemId: null, accumulatedSeconds: 10, segments: [{ startedAt: 0, endedAt: 10_000 }] };
    expect(pauseTimer(paused, 20_000)).toBe(paused);
  });
});
