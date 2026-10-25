"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Database, Download, Moon, RotateCcw, Save, ShieldCheck, Sun, Upload } from "lucide-react";
import { SCHEMA_VERSION } from "@/lib/storage";
import { formatMinutes } from "@/lib/format";
import { useStudyStore } from "@/stores/study-store";
import type { AppSettings } from "@/types/study";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function SettingsView() {
  const settings = useStudyStore((state) => state.settings);
  const items = useStudyStore((state) => state.items);
  const sessions = useStudyStore((state) => state.sessions);
  const updateSettings = useStudyStore((state) => state.updateSettings);
  const exportData = useStudyStore((state) => state.exportData);
  const importData = useStudyStore((state) => state.importData);
  const resetAll = useStudyStore((state) => state.resetAll);
  const [form, setForm] = useState(settings);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const patchForm = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => setForm((current) => ({ ...current, [key]: value }));

  const save = () => {
    if (form.studyStartDate > form.examDate) return setNotice({ type: "error", text: "시험일은 학습 시작일보다 늦어야 합니다." });
    if (form.weeklyTargetMinutes <= 0 || form.totalTargetMinutes <= 0) return setNotice({ type: "error", text: "학습 목표 시간은 0보다 커야 합니다." });
    updateSettings(form);
    setNotice({ type: "success", text: "설정을 저장했습니다. 기존 학습 일정의 날짜는 유지됩니다." });
  };

  const download = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cka-study-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice({ type: "success", text: "학습 데이터 백업 파일을 만들었습니다." });
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("5MB 이하의 백업 파일만 가져올 수 있습니다.");
      const raw = await file.text();
      if (!window.confirm("현재 데이터를 가져온 백업으로 교체할까요? 이 작업 전 내보내기를 권장합니다.")) return;
      importData(raw);
      setForm(useStudyStore.getState().settings);
      setNotice({ type: "success", text: "백업 데이터를 안전하게 가져왔습니다." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "데이터를 가져오지 못했습니다." });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="page settings-page">
      <header className="page-header"><span className="eyebrow">PREFERENCES & DATA</span><h1>설정</h1><p>목표와 화면 테마, 로컬 학습 데이터를 관리하세요.</p></header>
      {notice && <div className={`notice ${notice.type}`}>{notice.type === "success" ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}{notice.text}<button onClick={() => setNotice(null)}>×</button></div>}
      <div className="settings-layout">
        <div className="settings-main">
          <section className="panel settings-section">
            <div className="settings-heading"><div className="settings-icon"><Save size={18} /></div><div><h2>학습 목표</h2><p>D-Day와 모든 진도 계산의 기준입니다.</p></div></div>
            <div className="form-grid settings-form">
              <label className="field"><span>학습 시작일</span><input className="field-input" type="date" value={form.studyStartDate} onChange={(event) => patchForm("studyStartDate", event.target.value)} /></label>
              <label className="field"><span>시험 목표일</span><input className="field-input" type="date" value={form.examDate} onChange={(event) => patchForm("examDate", event.target.value)} /></label>
              <label className="field"><span>주간 목표 (시간)</span><input className="field-input" type="number" step="0.5" min="0.5" value={form.weeklyTargetMinutes / 60} onChange={(event) => patchForm("weeklyTargetMinutes", Number(event.target.value) * 60)} /><small>현재 {formatMinutes(form.weeklyTargetMinutes)}</small></label>
              <label className="field"><span>전체 목표 (시간)</span><input className="field-input" type="number" step="0.5" min="1" value={form.totalTargetMinutes / 60} onChange={(event) => patchForm("totalTargetMinutes", Number(event.target.value) * 60)} /><small>현재 {formatMinutes(form.totalTargetMinutes)}</small></label>
              <label className="field span-2"><span>시간대</span><input className="field-input" value="Asia/Seoul (KST, UTC+9)" disabled /><small>학습 세션과 날짜 집계는 한국 시간대를 기준으로 합니다.</small></label>
            </div>
            <div className="setting-divider" />
            <div className="rest-day-setting"><div><b>연속 학습 휴식일</b><p>휴식일에 기록이 없어도 Streak가 끊기지 않으며, 일수에는 더해지지 않습니다.</p></div><div className="weekday-pills">{WEEKDAYS.map((day, index) => <button key={day} className={form.restDays.includes(index) ? "active" : ""} onClick={() => patchForm("restDays", form.restDays.includes(index) ? form.restDays.filter((entry) => entry !== index) : [...form.restDays, index])}>{day}</button>)}</div></div>
            <div className="settings-actions"><button className="button primary" onClick={save}><Save size={16} /> 설정 저장</button></div>
          </section>

          <section className="panel settings-section">
            <div className="settings-heading"><div className="settings-icon"><Sun size={18} /></div><div><h2>화면 테마</h2><p>기본은 다크 모드이며 언제든 전환할 수 있어요.</p></div></div>
            <div className="theme-options"><button className={form.theme === "dark" ? "active" : ""} onClick={() => patchForm("theme", "dark")}><span className="theme-preview dark"><i /><i /><i /></span><b><Moon size={16} /> 다크</b></button><button className={form.theme === "light" ? "active" : ""} onClick={() => patchForm("theme", "light")}><span className="theme-preview light"><i /><i /><i /></span><b><Sun size={16} /> 라이트</b></button></div>
          </section>

          <section className="panel settings-section">
            <div className="settings-heading"><div className="settings-icon"><Database size={18} /></div><div><h2>데이터 관리</h2><p>브라우저에 저장된 데이터를 JSON으로 백업하고 복원합니다.</p></div></div>
            <div className="data-actions"><button className="data-action" onClick={download}><span><Download size={18} /></span><div><b>데이터 내보내기</b><small>모든 계획, 기록, 설정을 JSON으로 저장</small></div></button><button className="data-action" onClick={() => fileRef.current?.click()}><span><Upload size={18} /></span><div><b>데이터 가져오기</b><small>유효성 검사를 통과한 백업만 적용</small></div></button><input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(event) => void handleImport(event.target.files?.[0])} /></div>
            <div className="danger-zone"><div><b>모든 학습 기록 초기화</b><p>기본 14주 로드맵으로 돌아가며 실제 시간과 완료 상태가 모두 삭제됩니다.</p></div><button className="button danger" onClick={() => { if (window.confirm("모든 학습 기록을 삭제하고 기본 로드맵으로 초기화할까요? 이 작업은 되돌릴 수 없습니다.")) { resetAll(); setForm(useStudyStore.getState().settings); setNotice({ type: "success", text: "기본 로드맵으로 초기화했습니다." }); } }}><RotateCcw size={15} /> 전체 초기화</button></div>
          </section>
        </div>

        <aside className="settings-side">
          <section className="panel storage-card"><ShieldCheck size={21} /><h3>로컬 우선 저장</h3><p>데이터는 서버로 전송되지 않고 이 브라우저의 localStorage에만 저장됩니다.</p><div><span>스키마 버전</span><b>v{SCHEMA_VERSION}</b></div><div><span>학습 항목</span><b>{items.length}개</b></div><div><span>학습 세션</span><b>{sessions.length}개</b></div></section>
          <section className="panel policy-card"><span className="eyebrow">STREAK POLICY</span><h3>연속 학습 계산 기준</h3><ul><li>실제 학습 시간이 있는 날짜만 1일로 계산</li><li>지정한 휴식일은 기록이 없어도 Streak 유지</li><li>오늘 학습 전에는 어제까지의 Streak 유지</li><li>한국 시간 자정 기준으로 세션 분할</li></ul></section>
        </aside>
      </div>
    </div>
  );
}
