"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, Circle, Clock3, Flame, Gauge, Target, TrendingUp, Trophy } from "lucide-react";
import { StudyHeatmap } from "@/components/calendar/study-heatmap";
import { StudyTimer } from "@/components/timer/study-timer";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCompletionRate, getCurrentStreak, getDailyMinutes, getTimeProgress, getTotalMinutes, getWeekMinutes, sessionSecondsByDate } from "@/features/statistics/metrics";
import { formatKoreanDate, getDday, getWeekRange, isDateBetween, toDateKey } from "@/lib/date";
import { formatMinutes, percent } from "@/lib/format";
import { useStudyStore } from "@/stores/study-store";

export function DashboardView() {
  const items = useStudyStore((state) => state.items);
  const sessions = useStudyStore((state) => state.sessions);
  const settings = useStudyStore((state) => state.settings);
  const toggleItem = useStudyStore((state) => state.toggleItem);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);
  const today = toDateKey(now);
  const dday = getDday(settings.examDate, new Date(now));
  const week = getWeekRange(today);
  const todayItems = items.filter((item) => item.scheduledDate === today).sort((a, b) => a.title.localeCompare(b.title));
  const todayTarget = todayItems.reduce((sum, item) => sum + item.estimatedMinutes, 0);
  const todayActual = getDailyMinutes(sessions, today);
  const weekMinutes = getWeekMinutes(sessions, today);
  const weekRate = percent(weekMinutes, settings.weeklyTargetMinutes);
  const totalMinutes = getTotalMinutes(sessions);
  const timeProgress = getTimeProgress(sessions, settings);
  const completionRate = getCompletionRate(items);
  const streak = getCurrentStreak(sessions, settings, today);
  const nextItem = items.filter((item) => item.status !== "completed" && item.scheduledDate >= today).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0];
  const dailySeconds = sessionSecondsByDate(sessions);
  const minutesByDate = Object.fromEntries(Object.entries(dailySeconds).map(([date, seconds]) => [date, Math.round(seconds / 60)]));

  return (
    <div className="page dashboard-page">
      <header className="page-header dashboard-header">
        <div><span className="eyebrow">{formatKoreanDate(today, { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</span><h1>좋은 시작이에요, 오늘도 한 걸음씩.</h1><p>CKA 합격까지의 학습 흐름을 한눈에 확인하세요.</p></div>
        <div className="dday-block"><small>EXAM COUNTDOWN</small><strong>{dday > 0 ? `D-${dday}` : dday === 0 ? "D-DAY" : `D+${Math.abs(dday)}`}</strong><span>{settings.examDate.replaceAll("-", ".")} · CKA</span></div>
      </header>

      <div className="metric-grid">
        <article className="metric-card accent"><div className="metric-top"><span className="metric-icon green"><Clock3 size={17} /></span><span>오늘 학습</span></div><div className="metric-value">{formatMinutes(todayActual)} <small>/ {formatMinutes(todayTarget)}</small></div><ProgressBar value={percent(todayActual, todayTarget)} /><p>{todayTarget ? `목표의 ${percent(todayActual, todayTarget)}%` : "오늘은 계획된 학습이 없어요"}</p></article>
        <article className="metric-card"><div className="metric-top"><span className="metric-icon blue"><TrendingUp size={17} /></span><span>이번 주 누적</span></div><div className="metric-value">{formatMinutes(weekMinutes)} <small>/ {formatMinutes(settings.weeklyTargetMinutes)}</small></div><ProgressBar value={weekRate} tone="blue" /><p>{weekRate}% 달성 · {week.start.slice(5).replace("-", ".")}–{week.end.slice(5).replace("-", ".")}</p></article>
        <article className="metric-card"><div className="metric-top"><span className="metric-icon amber"><Gauge size={17} /></span><span>전체 시간 진도</span></div><div className="metric-value">{timeProgress}% <small>· {formatMinutes(totalMinutes)}</small></div><ProgressBar value={timeProgress} tone="amber" /><p>총 목표 {formatMinutes(settings.totalTargetMinutes)}</p></article>
        <article className="metric-card"><div className="metric-top"><span className="metric-icon purple"><Flame size={17} /></span><span>연속 학습</span></div><div className="metric-value">{streak}<small>일</small></div><div className="streak-dots">{Array.from({ length: 7 }, (_, index) => <i key={index} className={index < Math.min(streak, 7) ? "filled" : ""} />)}</div><p>수요일 휴식은 연속 기록을 유지해요</p></article>
      </div>

      <div className="dashboard-columns">
        <div className="dashboard-main">
          <section className="panel">
            <div className="panel-heading"><div><span className="eyebrow"><CalendarClock size={13} /> TODAY</span><h2>오늘의 학습 계획</h2></div><Link href="/plan" className="text-button">전체 계획 <ArrowRight size={14} /></Link></div>
            {todayItems.length === 0 ? <div className="compact-empty"><Target size={19} /><div><b>오늘은 계획된 항목이 없어요.</b><span>내일의 학습을 미리 살펴보거나 자유 학습을 기록해 보세요.</span></div></div> : <div className="task-list">{todayItems.map((item) => <button key={item.id} className="task-row" onClick={() => toggleItem(item.id)}><span className={`task-check ${item.status === "completed" ? "checked" : ""}`}>{item.status === "completed" ? <CheckCircle2 size={20} /> : <Circle size={20} />}</span><span className="task-copy"><b>{item.title}</b><small>{item.area} · 예상 {formatMinutes(item.estimatedMinutes)}</small></span><StatusBadge status={item.status} /></button>)}</div>}
          </section>

          <section className="panel heatmap-panel">
            <div className="panel-heading"><div><span className="eyebrow"><Trophy size={13} /> CONSISTENCY</span><h2>학습 활동</h2></div><span className="panel-stat">총 {formatMinutes(totalMinutes)}</span></div>
            <StudyHeatmap startDate={settings.studyStartDate} endDate={settings.examDate} minutesByDate={minutesByDate} />
          </section>
        </div>
        <div className="dashboard-side">
          <StudyTimer />
          <section className="panel next-panel">
            <span className="eyebrow">UP NEXT</span><h2>다음 학습</h2>
            {nextItem ? <><div className="next-date"><strong>{nextItem.scheduledDate.slice(8)}</strong><span>{formatKoreanDate(nextItem.scheduledDate)}</span></div><h3>{nextItem.title}</h3><p>{nextItem.description}</p><div className="next-meta"><span>{nextItem.area}</span><span>{formatMinutes(nextItem.estimatedMinutes)}</span></div><Link href={`/plan?date=${nextItem.scheduledDate}`} className="button secondary full">학습 계획에서 보기 <ArrowRight size={15} /></Link></> : <div className="compact-empty"><CheckCircle2 size={19} /><div><b>모든 계획을 완료했어요!</b><span>멋진 완주입니다.</span></div></div>}
          </section>
        </div>
      </div>
      <div className="progress-summary"><span><Target size={15} /> 항목 완료율 <b>{completionRate}%</b></span><ProgressBar value={completionRate} tone="blue" size="md" /></div>
    </div>
  );
}
