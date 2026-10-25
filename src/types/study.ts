export const STUDY_AREAS = [
  "Kubernetes 기초",
  "Workloads",
  "Networking",
  "Storage",
  "Cluster Architecture",
  "Security",
  "Troubleshooting",
  "실전 모의고사",
] as const;

export type StudyArea = (typeof STUDY_AREAS)[number];
export type StudyStatus = "planned" | "in_progress" | "completed";
export type Difficulty = "easy" | "medium" | "hard";

export interface StudyItem {
  id: string;
  title: string;
  area: StudyArea;
  description: string;
  scheduledDate: string;
  estimatedMinutes: number;
  actualMinutes: number;
  status: StudyStatus;
  difficulty: Difficulty;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimerSegment {
  startedAt: number;
  endedAt: number | null;
}

export interface StudySession {
  id: string;
  itemId: string | null;
  date: string;
  durationSeconds: number;
  source: "timer" | "manual";
  segments: TimerSegment[];
  createdAt: string;
}

export interface AppSettings {
  studyStartDate: string;
  examDate: string;
  weeklyTargetMinutes: number;
  totalTargetMinutes: number;
  timezone: "Asia/Seoul";
  theme: "dark" | "light";
  restDays: number[];
}

export interface StudyTimer {
  status: "idle" | "running" | "paused";
  itemId: string | null;
  segments: TimerSegment[];
  accumulatedSeconds: number;
}

export interface PersistedStudyData {
  schemaVersion: number;
  items: StudyItem[];
  sessions: StudySession[];
  settings: AppSettings;
  timer: StudyTimer;
  seeded: boolean;
}

export interface StudyItemDraft {
  title: string;
  area: StudyArea;
  description: string;
  scheduledDate: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  status: StudyStatus;
  difficulty: Difficulty;
  notes: string;
}
