"use client";

import { create } from "zustand";
import { createSeedData } from "@/data/roadmap";
import { kstTimestamp, toDateKey } from "@/lib/date";
import { createId } from "@/lib/ids";
import { SCHEMA_VERSION, studyRepository } from "@/lib/storage";
import { IDLE_TIMER, pauseTimer, resumeTimer, timerElapsedSeconds } from "@/lib/timer";
import type { AppSettings, PersistedStudyData, StudyItem, StudyItemDraft, StudySession, StudyTimer } from "@/types/study";

interface StudyState extends PersistedStudyData {
  hydrated: boolean;
  hydrate: () => void;
  addItem: (draft: StudyItemDraft) => string;
  updateItem: (id: string, patch: Partial<StudyItemDraft>) => void;
  deleteItem: (id: string) => void;
  moveItem: (id: string, date: string) => void;
  toggleItem: (id: string) => void;
  addManualSession: (itemId: string | null, date: string, minutes: number) => void;
  startTimer: (itemId: string | null, now?: number) => boolean;
  pauseTimer: (now?: number) => void;
  resumeTimer: (now?: number) => void;
  stopTimer: (now?: number) => number;
  updateSettings: (settings: Partial<AppSettings>) => void;
  importData: (raw: string) => void;
  exportData: () => string;
  resetAll: () => void;
}

function persistedFromState(state: StudyState): PersistedStudyData {
  return {
    schemaVersion: SCHEMA_VERSION,
    items: state.items,
    sessions: state.sessions,
    settings: state.settings,
    timer: state.timer,
    seeded: state.seeded,
  };
}

function applyTheme(theme: AppSettings["theme"]): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export const useStudyStore = create<StudyState>((set, get) => {
  const seed = createSeedData();
  const commit = (updater: (state: StudyState) => Partial<StudyState>) => {
    set((state) => updater(state));
    studyRepository.save(persistedFromState(get()));
  };

  return {
    ...seed,
    hydrated: false,
    hydrate: () => {
      if (get().hydrated) return;
      const data = studyRepository.load();
      set({ ...data, hydrated: true });
      applyTheme(data.settings.theme);
    },
    addItem: (draft) => {
      const id = createId("item");
      const now = new Date().toISOString();
      const actualMinutes = Math.max(0, draft.actualMinutes ?? 0);
      const item: StudyItem = { ...draft, id, actualMinutes: 0, createdAt: now, updatedAt: now };
      commit((state) => ({ items: [...state.items, item] }));
      if (actualMinutes > 0) get().addManualSession(id, draft.scheduledDate, actualMinutes);
      return id;
    },
    updateItem: (id, patch) => {
      commit((state) => ({
        items: state.items.map((item) => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item),
      }));
    },
    deleteItem: (id) => {
      commit((state) => ({
        items: state.items.filter((item) => item.id !== id),
        sessions: state.sessions.map((session) => session.itemId === id ? { ...session, itemId: null } : session),
        timer: state.timer.itemId === id ? { ...state.timer, itemId: null } : state.timer,
      }));
    },
    moveItem: (id, date) => get().updateItem(id, { scheduledDate: date }),
    toggleItem: (id) => {
      const item = get().items.find((entry) => entry.id === id);
      if (item) get().updateItem(id, { status: item.status === "completed" ? "planned" : "completed" });
    },
    addManualSession: (itemId, date, minutes) => {
      const safeMinutes = Math.max(1, Math.round(minutes));
      const startedAt = kstTimestamp(date, 12);
      const session: StudySession = {
        id: createId("session"),
        itemId,
        date,
        durationSeconds: safeMinutes * 60,
        source: "manual",
        segments: [{ startedAt, endedAt: startedAt + safeMinutes * 60 * 1000 }],
        createdAt: new Date().toISOString(),
      };
      commit((state) => ({
        sessions: [...state.sessions, session],
        items: state.items.map((item) => item.id === itemId
          ? { ...item, actualMinutes: item.actualMinutes + safeMinutes, status: item.status === "planned" ? "in_progress" : item.status, updatedAt: new Date().toISOString() }
          : item),
      }));
    },
    startTimer: (itemId, now = Date.now()) => {
      if (get().timer.status !== "idle") return false;
      const timer: StudyTimer = { status: "running", itemId, segments: [{ startedAt: now, endedAt: null }], accumulatedSeconds: 0 };
      commit(() => ({ timer }));
      return true;
    },
    pauseTimer: (now = Date.now()) => commit((state) => ({ timer: pauseTimer(state.timer, now) })),
    resumeTimer: (now = Date.now()) => commit((state) => ({ timer: resumeTimer(state.timer, now) })),
    stopTimer: (now = Date.now()) => {
      const current = get().timer;
      if (current.status === "idle") return 0;
      const closed = current.status === "running" ? pauseTimer(current, now) : current;
      const durationSeconds = timerElapsedSeconds(closed, now);
      if (durationSeconds < 1 || closed.segments.length === 0) {
        commit(() => ({ timer: { ...IDLE_TIMER } }));
        return 0;
      }
      const date = toDateKey(closed.segments[0]?.startedAt ?? now);
      const minutes = Math.max(1, Math.round(durationSeconds / 60));
      const session: StudySession = {
        id: createId("session"),
        itemId: closed.itemId,
        date,
        durationSeconds,
        source: "timer",
        segments: closed.segments,
        createdAt: new Date(now).toISOString(),
      };
      commit((state) => ({
        sessions: [...state.sessions, session],
        timer: { ...IDLE_TIMER },
        items: state.items.map((item) => item.id === closed.itemId
          ? { ...item, actualMinutes: item.actualMinutes + minutes, status: item.status === "planned" ? "in_progress" : item.status, updatedAt: new Date(now).toISOString() }
          : item),
      }));
      return durationSeconds;
    },
    updateSettings: (patch) => {
      commit((state) => ({ settings: { ...state.settings, ...patch } }));
      if (patch.theme) applyTheme(patch.theme);
    },
    importData: (raw) => {
      const data = studyRepository.parseImport(raw);
      set({ ...data, hydrated: true });
      studyRepository.save(data);
      applyTheme(data.settings.theme);
    },
    exportData: () => JSON.stringify(persistedFromState(get()), null, 2),
    resetAll: () => {
      const data = createSeedData();
      set({ ...data, hydrated: true });
      studyRepository.save(data);
      applyTheme(data.settings.theme);
    },
  };
});
