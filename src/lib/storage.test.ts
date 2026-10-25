import { afterEach, describe, expect, it } from "vitest";
import { createSeedData } from "@/data/roadmap";
import { STORAGE_KEY, studyRepository, validateImportedData } from "@/lib/storage";

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
});

describe("저장소 스키마", () => {
  it("기본 데이터는 검증을 통과하고 실제 기록이 비어 있다", () => {
    const seed = createSeedData();
    expect(validateImportedData(seed).items).toHaveLength(83);
    expect(seed.sessions).toHaveLength(0);
    expect(seed.items.every((item) => item.actualMinutes === 0 && item.status === "planned")).toBe(true);
  });

  it("알 수 없는 스키마 버전을 거부한다", () => {
    expect(() => validateImportedData({ ...createSeedData(), schemaVersion: 99 })).toThrow("지원하지 않는 스키마");
  });

  it("손상된 항목 데이터를 거부한다", () => {
    expect(() => validateImportedData({ ...createSeedData(), items: [{ id: "bad" }] })).toThrow("학습 항목 형식");
  });

  it("localStorage에 저장한 데이터를 다시 복원한다", () => {
    const values = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
    Object.defineProperty(globalThis, "window", { value: { localStorage }, configurable: true });
    const seed = createSeedData();
    studyRepository.save(seed);
    expect(values.has(STORAGE_KEY)).toBe(true);
    expect(studyRepository.load().items).toHaveLength(83);
    studyRepository.clear();
    expect(values.has(STORAGE_KEY)).toBe(false);
  });
});
