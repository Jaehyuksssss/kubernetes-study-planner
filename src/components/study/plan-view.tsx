"use client";

import { useMemo, useState } from "react";
import { BookOpen, CalendarRange, Check, CheckCircle2, Circle, Clock3, Edit3, Plus, Target, Trash2 } from "lucide-react";
import { ROADMAP_WEEKS } from "@/data/roadmap";
import { getRangeMinutes, getPlannedMinutes } from "@/features/statistics/metrics";
import { addDays, formatKoreanDate, getWeekNumber, toDateKey } from "@/lib/date";
import { formatMinutes, percent } from "@/lib/format";
import { useStudyStore } from "@/stores/study-store";
import { StudyItemDialog } from "@/components/study/study-item-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import type { StudyItem } from "@/types/study";

const PHASES = [
  { label: "기초", weeks: "1–3주", range: [1, 3], tone: "phase-green" },
  { label: "워크로드", weeks: "4–6주", range: [4, 6], tone: "phase-blue" },
  { label: "아키텍처", weeks: "7–9주", range: [7, 9], tone: "phase-purple" },
  { label: "장애 대응", weeks: "10–12주", range: [10, 12], tone: "phase-amber" },
  { label: "실전", weeks: "13–14주", range: [13, 14], tone: "phase-red" },
] as const;

export function PlanView() {
  const items = useStudyStore((state) => state.items);
  const sessions = useStudyStore((state) => state.sessions);
  const settings = useStudyStore((state) => state.settings);
  const toggleItem = useStudyStore((state) => state.toggleItem);
  const moveItem = useStudyStore((state) => state.moveItem);
  const deleteItem = useStudyStore((state) => state.deleteItem);
  const initialWeek = Math.min(14, Math.max(1, getWeekNumber(toDateKey(), settings.studyStartDate)));
  const [selectedWeek, setSelectedWeek] = useState(initialWeek);
  const [dialog, setDialog] = useState<{ item?: StudyItem } | null>(null);
  const roadmap = ROADMAP_WEEKS[selectedWeek - 1];
  const weekStart = addDays(settings.studyStartDate, (selectedWeek - 1) * 7);
  const weekEnd = selectedWeek === 14 ? settings.examDate : addDays(weekStart, 6);
  const weekItems = useMemo(() => items.filter((item) => item.scheduledDate >= weekStart && item.scheduledDate <= weekEnd).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)), [items, weekStart, weekEnd]);
  const planned = getPlannedMinutes(weekItems, weekStart, weekEnd);
  const actual = getRangeMinutes(sessions, weekStart, weekEnd);
  const completed = weekItems.filter((item) => item.status === "completed").length;

  return (
    <div className="page">
      <header className="page-header row-header"><div><span className="eyebrow">14-WEEK ROADMAP</span><h1>CKA 학습 계획</h1><p>개념부터 실전까지, 주차별 학습 항목을 직접 조정할 수 있어요.</p></div><button className="button primary" onClick={() => setDialog({})}><Plus size={16} /> 학습 항목 추가</button></header>
      <section className="roadmap-strip">
        {PHASES.map((phase) => {
          const active = selectedWeek >= phase.range[0] && selectedWeek <= phase.range[1];
          return <button key={phase.label} className={`${phase.tone} ${active ? "active" : ""}`} onClick={() => setSelectedWeek(phase.range[0])}><i /><span><b>{phase.label}</b><small>{phase.weeks}</small></span></button>;
        })}
      </section>
      <div className="week-tabs" role="tablist" aria-label="주차 선택">{ROADMAP_WEEKS.map((week) => <button key={week.week} className={selectedWeek === week.week ? "active" : ""} onClick={() => setSelectedWeek(week.week)}>{week.week}주</button>)}</div>

      <div className="plan-layout">
        <aside className="panel week-overview">
          <span className="week-kicker">WEEK {String(selectedWeek).padStart(2, "0")}</span><h2>{roadmap?.title}</h2><p className="week-range"><CalendarRange size={15} /> {weekStart.replaceAll("-", ".")} – {weekEnd.replaceAll("-", ".")}</p>
          <div className="outcome-box"><span><Target size={15} /> 이번 주 완료 목표</span><p>{roadmap?.outcome}</p></div>
          <div className="topic-list"><span>핵심 주제</span>{roadmap?.topics.map((topic) => <p key={topic}><Check size={13} />{topic}</p>)}</div>
          <div className="week-progress"><div><span>시간 달성률</span><b>{percent(actual, settings.weeklyTargetMinutes)}%</b></div><ProgressBar value={percent(actual, settings.weeklyTargetMinutes)} /><small>{formatMinutes(actual)} / 목표 {formatMinutes(settings.weeklyTargetMinutes)}</small></div>
          <div className="week-mini-stats"><div><Clock3 size={15} /><span>계획<b>{formatMinutes(planned)}</b></span></div><div><CheckCircle2 size={15} /><span>완료<b>{completed}/{weekItems.length}</b></span></div></div>
        </aside>

        <section className="panel week-schedule">
          <div className="panel-heading"><div><span className="eyebrow"><BookOpen size={13} /> WEEKLY SCHEDULE</span><h2>일자별 학습 항목</h2></div><span className="panel-stat">{weekItems.length}개 항목</span></div>
          {weekItems.length === 0 ? <EmptyState title="이 주차에는 항목이 없어요" description="새 학습 항목을 만들어 계획을 채워보세요." /> : <div className="plan-item-list">{weekItems.map((item, index) => {
            const showDate = index === 0 || weekItems[index - 1]?.scheduledDate !== item.scheduledDate;
            return <div key={item.id} className="plan-item-wrap">{showDate && <div className="plan-date-label"><b>{item.scheduledDate.slice(8)}일</b><span>{formatKoreanDate(item.scheduledDate, { weekday: "long" })}</span></div>}<article className={`plan-item ${item.status === "completed" ? "done" : ""}`}>
              <button className={`task-check ${item.status === "completed" ? "checked" : ""}`} onClick={() => toggleItem(item.id)}>{item.status === "completed" ? <CheckCircle2 size={20} /> : <Circle size={20} />}</button>
              <div className="plan-item-copy"><div><h3>{item.title}</h3><StatusBadge status={item.status} /></div><p>{item.description}</p><div className="item-chips"><span>{item.area}</span><span>예상 {formatMinutes(item.estimatedMinutes)}</span><span>실제 {formatMinutes(item.actualMinutes)}</span><span className={`difficulty ${item.difficulty}`}>{item.difficulty === "easy" ? "쉬움" : item.difficulty === "medium" ? "보통" : "어려움"}</span></div></div>
              <div className="plan-item-actions"><label title="날짜 이동"><input type="date" value={item.scheduledDate} onChange={(event) => moveItem(item.id, event.target.value)} /></label><button onClick={() => setDialog({ item })} aria-label="수정"><Edit3 size={16} /></button><button onClick={() => { if (window.confirm(`“${item.title}” 항목을 삭제할까요?`)) deleteItem(item.id); }} aria-label="삭제"><Trash2 size={16} /></button></div>
            </article></div>;
          })}</div>}
        </section>
      </div>
      {dialog && <StudyItemDialog item={dialog.item} defaultDate={dialog.item?.scheduledDate ?? weekStart} onClose={() => setDialog(null)} />}
    </div>
  );
}
