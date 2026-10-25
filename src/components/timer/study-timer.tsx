"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleStop, Pause, Play, RotateCcw, Timer, Plus } from "lucide-react";
import { formatTimer } from "@/lib/format";
import { timerElapsedSeconds } from "@/lib/timer";
import { toDateKey } from "@/lib/date";
import { useStudyStore } from "@/stores/study-store";

export function StudyTimer() {
  const timer = useStudyStore((state) => state.timer);
  const items = useStudyStore((state) => state.items);
  const startTimer = useStudyStore((state) => state.startTimer);
  const pause = useStudyStore((state) => state.pauseTimer);
  const resume = useStudyStore((state) => state.resumeTimer);
  const stop = useStudyStore((state) => state.stopTimer);
  const addManual = useStudyStore((state) => state.addManualSession);
  const [now, setNow] = useState(() => Date.now());
  const [selectedId, setSelectedId] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualDate, setManualDate] = useState(() => toDateKey());
  const [manualMinutes, setManualMinutes] = useState(30);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const options = useMemo(() => items.filter((item) => item.status !== "completed").sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)), [items]);
  const activeItem = items.find((item) => item.id === timer.itemId);
  const elapsed = timerElapsedSeconds(timer, now);

  return (
    <section className="panel timer-panel">
      <div className="panel-heading">
        <div><span className="eyebrow"><Timer size={13} /> FOCUS TIMER</span><h2>학습 타이머</h2></div>
        <button className="text-button" onClick={() => setManualOpen((value) => !value)}><Plus size={15} /> 수동 기록</button>
      </div>
      <div className="timer-display">{formatTimer(elapsed)}</div>
      <p className="timer-label">{timer.status === "idle" ? "집중할 학습 항목을 선택하세요" : activeItem?.title ?? "자유 학습"}</p>
      <select className="field-input" value={timer.status === "idle" ? selectedId : timer.itemId ?? ""} onChange={(event) => setSelectedId(event.target.value)} disabled={timer.status !== "idle"} aria-label="타이머 학습 항목">
        <option value="">자유 학습</option>
        {options.map((item) => <option key={item.id} value={item.id}>{item.scheduledDate} · {item.title}</option>)}
      </select>
      <div className="timer-actions">
        {timer.status === "idle" && <button className="button primary grow" onClick={() => startTimer(selectedId || null)}><Play size={16} fill="currentColor" /> 시작</button>}
        {timer.status === "running" && <button className="button warning grow" onClick={() => pause()}><Pause size={16} fill="currentColor" /> 일시정지</button>}
        {timer.status === "paused" && <button className="button primary grow" onClick={() => resume()}><RotateCcw size={16} /> 재개</button>}
        {timer.status !== "idle" && <button className="button secondary" onClick={() => stop()}><CircleStop size={16} /> 종료·저장</button>}
      </div>
      {manualOpen && (
        <form className="manual-entry" onSubmit={(event) => { event.preventDefault(); addManual(selectedId || null, manualDate, manualMinutes); setManualOpen(false); }}>
          <input className="field-input" type="date" value={manualDate} onChange={(event) => setManualDate(event.target.value)} required />
          <label className="minute-input"><input className="field-input" type="number" min={1} max={1440} value={manualMinutes} onChange={(event) => setManualMinutes(Number(event.target.value))} required /><span>분</span></label>
          <button className="button primary" type="submit">기록</button>
        </form>
      )}
      {timer.status !== "idle" && <p className="timer-note"><span className="pulse-dot" /> 타이머 상태는 자동 저장됩니다. 이 창을 닫아도 안전해요.</p>}
    </section>
  );
}
