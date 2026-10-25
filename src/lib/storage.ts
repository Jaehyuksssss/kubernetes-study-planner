import { createSeedData, DEFAULT_SETTINGS } from "@/data/roadmap";
import { IDLE_TIMER } from "@/lib/timer";
import { STUDY_AREAS, type PersistedStudyData, type StudyItem, type StudySession } from "@/types/study";

export const STORAGE_KEY = "cka-study-tracker:v1";
export const SCHEMA_VERSION = 1;

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isTimerSegment(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const segment = value as { startedAt?: unknown; endedAt?: unknown };
  return isNumber(segment.startedAt) && (segment.endedAt === null || isNumber(segment.endedAt));
}

function isStudyItem(value: unknown): value is StudyItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<StudyItem>;
  return Boolean(
    isString(item.id) && isString(item.title) && isString(item.scheduledDate) &&
    STUDY_AREAS.includes(item.area as (typeof STUDY_AREAS)[number]) &&
    isNumber(item.estimatedMinutes) && isNumber(item.actualMinutes) &&
    ["planned", "in_progress", "completed"].includes(item.status ?? "") &&
    ["easy", "medium", "hard"].includes(item.difficulty ?? "") &&
    isString(item.description) && isString(item.notes) && isString(item.createdAt) && isString(item.updatedAt),
  );
}

function isSession(value: unknown): value is StudySession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<StudySession>;
  return Boolean(
    isString(session.id) && isString(session.date) && isNumber(session.durationSeconds) &&
    ["timer", "manual"].includes(session.source ?? "") && Array.isArray(session.segments) && session.segments.every(isTimerSegment) &&
    isString(session.createdAt) && (session.itemId === null || isString(session.itemId)),
  );
}

export function validateImportedData(value: unknown): PersistedStudyData {
  if (!value || typeof value !== "object") throw new Error("JSON 객체가 아닙니다.");
  const data = value as Partial<PersistedStudyData>;
  if (data.schemaVersion !== SCHEMA_VERSION) throw new Error(`지원하지 않는 스키마 버전입니다. (지원: ${SCHEMA_VERSION})`);
  if (!Array.isArray(data.items) || !data.items.every(isStudyItem)) throw new Error("학습 항목 형식이 올바르지 않습니다.");
  if (!Array.isArray(data.sessions) || !data.sessions.every(isSession)) throw new Error("학습 기록 형식이 올바르지 않습니다.");
  if (!data.settings || typeof data.settings !== "object") throw new Error("설정 정보가 없습니다.");
  const settings = data.settings;
  if (!isString(settings.studyStartDate) || !isString(settings.examDate) ||
      !isNumber(settings.weeklyTargetMinutes) || !isNumber(settings.totalTargetMinutes) ||
      settings.timezone !== "Asia/Seoul" || !["dark", "light"].includes(settings.theme) ||
      !Array.isArray(settings.restDays) || !settings.restDays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)) {
    throw new Error("설정 값이 올바르지 않습니다.");
  }
  const timer = data.timer ?? IDLE_TIMER;
  if (!timer || !["idle", "running", "paused"].includes(timer.status) || !Array.isArray(timer.segments) ||
      !timer.segments.every(isTimerSegment) || !isNumber(timer.accumulatedSeconds) ||
      (timer.itemId !== null && !isString(timer.itemId))) {
    throw new Error("타이머 정보가 올바르지 않습니다.");
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    items: data.items,
    sessions: data.sessions,
    settings: { ...DEFAULT_SETTINGS, ...settings },
    timer,
    seeded: Boolean(data.seeded),
  };
}

export const studyRepository = {
  load(): PersistedStudyData {
    if (typeof window === "undefined") return createSeedData();
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createSeedData();
      this.save(seed);
      return seed;
    }
    try {
      return validateImportedData(JSON.parse(raw) as unknown);
    } catch {
      const backupKey = `${STORAGE_KEY}:invalid:${Date.now()}`;
      window.localStorage.setItem(backupKey, raw);
      const seed = createSeedData();
      this.save(seed);
      return seed;
    }
  },
  save(data: PersistedStudyData): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  },
  parseImport(raw: string): PersistedStudyData {
    try {
      return validateImportedData(JSON.parse(raw) as unknown);
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error("올바른 JSON 파일이 아닙니다.");
      throw error;
    }
  },
};
