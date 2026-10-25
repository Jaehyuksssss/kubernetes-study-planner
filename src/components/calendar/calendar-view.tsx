"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, CheckCircle2, ChevronLeft, ChevronRight, Circle, Clock3, Edit3, Plus, Trash2 } from "lucide-react";
import { StudyHeatmap } from "@/components/calendar/study-heatmap";
import { StudyItemDialog } from "@/components/study/study-item-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { sessionSecondsByDate } from "@/features/statistics/metrics";
import { formatKoreanDate, getMonthGrid, parseDateKey, toDateKey } from "@/lib/date";
import { formatMinutes } from "@/lib/format";
import { useStudyStore } from "@/stores/study-store";
import type { StudyItem } from "@/types/study";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function heatClass(minutes: number): string {
  if (!minutes) return "";
  if (minutes < 30) return "day-heat-1";
  if (minutes < 60) return "day-heat-2";
  if (minutes < 120) return "day-heat-3";
  return "day-heat-4";
}

export function CalendarView() {
  const items = useStudyStore((state) => state.items);
  const sessions = useStudyStore((state) => state.sessions);
  const settings = useStudyStore((state) => state.settings);
  const toggleItem = useStudyStore((state) => state.toggleItem);
  const deleteItem = useStudyStore((state) => state.deleteItem);
  const today = toDateKey();
  const todayDate = parseDateKey(today);
  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(today);
  const [dialog, setDialog] = useState<{ item?: StudyItem } | null>(null);
  const days = getMonthGrid(year, month);
  const secondsByDate = useMemo(() => sessionSecondsByDate(sessions), [sessions]);
  const minutesByDate = useMemo(() => Object.fromEntries(Object.entries(secondsByDate).map(([date, seconds]) => [date, Math.round(seconds / 60)])), [secondsByDate]);
  const selectedItems = items.filter((item) => item.scheduledDate === selectedDate).sort((a, b) => a.title.localeCompare(b.title));

  const shiftMonth = (amount: number) => {
    const next = new Date(Date.UTC(year, month + amount, 1));
    setYear(next.getUTCFullYear());
    setMonth(next.getUTCMonth());
  };

  return (
    <div className="page">
      <header className="page-header row-header"><div><span className="eyebrow">STUDY CALENDAR</span><h1>학습 캘린더</h1><p>계획과 실제 학습 기록의 흐름을 날짜별로 확인하세요.</p></div><button className="button primary" onClick={() => setDialog({})}><Plus size={16} /> 학습 항목 추가</button></header>
      <div className="calendar-layout">
        <section className="panel calendar-panel">
          <div className="calendar-toolbar"><button className="icon-button" onClick={() => shiftMonth(-1)} aria-label="이전 달"><ChevronLeft size={18} /></button><h2>{year}년 {month + 1}월</h2><button className="icon-button" onClick={() => shiftMonth(1)} aria-label="다음 달"><ChevronRight size={18} /></button><button className="text-button today-button" onClick={() => { setYear(todayDate.getFullYear()); setMonth(todayDate.getMonth()); setSelectedDate(today); }}>오늘</button></div>
          <div className="calendar-weekdays">{WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">
            {days.map((date) => {
              const dateMonth = Number(date.slice(5, 7)) - 1;
              const dayItems = items.filter((item) => item.scheduledDate === date);
              const minutes = minutesByDate[date] ?? 0;
              const complete = dayItems.length > 0 && dayItems.every((item) => item.status === "completed");
              const partial = !complete && (minutes > 0 || dayItems.some((item) => item.status === "in_progress" || item.status === "completed"));
              return (
                <button key={date} className={`calendar-day ${dateMonth !== month ? "outside" : ""} ${date === today ? "today" : ""} ${date === selectedDate ? "selected" : ""} ${heatClass(minutes)}`} onClick={() => setSelectedDate(date)}>
                  <span className="day-number">{Number(date.slice(8))}</span>
                  {minutes > 0 && <b>{formatMinutes(minutes)}</b>}
                  {dayItems.length > 0 && <span className={`day-status ${complete ? "complete" : partial ? "partial" : "planned"}`}><i />{dayItems.length}개</span>}
                </button>
              );
            })}
          </div>
          <div className="calendar-legend"><span><i className="legend-dot complete" /> 완료</span><span><i className="legend-dot partial" /> 일부 완료</span><span><i className="legend-dot planned" /> 미완료/예정</span><span className="ml-auto">색이 진할수록 학습 시간이 길어요</span></div>
        </section>
        <aside className="panel day-detail">
          <div className="panel-heading"><div><span className="eyebrow">SELECTED DATE</span><h2>{formatKoreanDate(selectedDate, { month: "long", day: "numeric", weekday: "long" })}</h2></div><button className="icon-button" onClick={() => setDialog({})} aria-label="이 날짜에 추가"><CalendarPlus size={18} /></button></div>
          <div className="day-total"><Clock3 size={16} /><span>실제 학습</span><strong>{formatMinutes(minutesByDate[selectedDate] ?? 0)}</strong></div>
          {selectedItems.length === 0 ? <EmptyState title="등록된 학습이 없어요" description="과거 기록을 추가하거나 앞으로의 학습을 계획해 보세요." /> : <div className="day-item-list">{selectedItems.map((item) => (
            <article className="day-item" key={item.id}>
              <div className="day-item-top"><button className={`task-check ${item.status === "completed" ? "checked" : ""}`} onClick={() => toggleItem(item.id)} aria-label="완료 전환">{item.status === "completed" ? <CheckCircle2 size={19} /> : <Circle size={19} />}</button><div><h3>{item.title}</h3><span>{item.area}</span></div><StatusBadge status={item.status} /></div>
              <p>{item.description}</p><div className="day-item-bottom"><span>예상 {formatMinutes(item.estimatedMinutes)}</span><span>실제 {formatMinutes(item.actualMinutes)}</span><div className="item-actions"><button onClick={() => setDialog({ item })} aria-label="수정"><Edit3 size={15} /></button><button onClick={() => { if (window.confirm(`“${item.title}” 항목을 삭제할까요? 학습 시간 기록은 보존됩니다.`)) deleteItem(item.id); }} aria-label="삭제"><Trash2 size={15} /></button></div></div>
            </article>
          ))}</div>}
        </aside>
      </div>
      <section className="panel heatmap-panel calendar-heatmap"><div className="panel-heading"><div><span className="eyebrow">CONTRIBUTION MAP</span><h2>14주 학습 히트맵</h2></div></div><StudyHeatmap startDate={settings.studyStartDate} endDate={settings.examDate} minutesByDate={minutesByDate} /></section>
      {dialog && <StudyItemDialog item={dialog.item} defaultDate={dialog.item?.scheduledDate ?? selectedDate} onClose={() => setDialog(null)} />}
    </div>
  );
}
