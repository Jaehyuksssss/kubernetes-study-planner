import type { StudyTimer } from "@/types/study";

export const IDLE_TIMER: StudyTimer = {
  status: "idle",
  itemId: null,
  segments: [],
  accumulatedSeconds: 0,
};

export function timerElapsedSeconds(timer: StudyTimer, now = Date.now()): number {
  const finished = timer.segments.reduce((sum, segment) => {
    const end = segment.endedAt ?? now;
    return sum + Math.max(0, end - segment.startedAt) / 1000;
  }, 0);
  return Math.floor(finished);
}

export function pauseTimer(timer: StudyTimer, now = Date.now()): StudyTimer {
  if (timer.status !== "running") return timer;
  return {
    ...timer,
    status: "paused",
    segments: timer.segments.map((segment, index) =>
      index === timer.segments.length - 1 && segment.endedAt === null
        ? { ...segment, endedAt: now }
        : segment,
    ),
    accumulatedSeconds: timerElapsedSeconds(timer, now),
  };
}

export function resumeTimer(timer: StudyTimer, now = Date.now()): StudyTimer {
  if (timer.status !== "paused") return timer;
  return {
    ...timer,
    status: "running",
    segments: [...timer.segments, { startedAt: now, endedAt: null }],
  };
}
