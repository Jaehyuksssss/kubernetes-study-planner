"use client";

import { useMemo } from "react";
import { Activity, BarChart3, Clock3, Target, TrendingUp } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getCompletionRate, getPlannedMinutes, getRangeMinutes, getTimeProgress, getTotalMinutes, sessionSecondsByDate } from "@/features/statistics/metrics";
import { addDays, getWeekRange, isDateBetween, toDateKey } from "@/lib/date";
import { formatMinutes, percent } from "@/lib/format";
import { useStudyStore } from "@/stores/study-store";

const DAY_NAMES = ["월", "화", "수", "목", "금", "토", "일"];
const PIE_COLORS = ["#45d483", "#638cff", "#a77bf3", "#f3ae4c", "#45b8d4", "#ed6a7a", "#88a66a", "#b7bfcb"];
const tooltipStyle = { background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 12 };

export function StatisticsView() {
  const items = useStudyStore((state) => state.items);
  const sessions = useStudyStore((state) => state.sessions);
  const settings = useStudyStore((state) => state.settings);
  const today = toDateKey();
  const week = getWeekRange(today);
  const secondsByDate = useMemo(() => sessionSecondsByDate(sessions), [sessions]);
  const total = getTotalMinutes(sessions);
  const weeklyActual = getRangeMinutes(sessions, week.start, week.end);
  const weeklyPlanned = getPlannedMinutes(items, week.start, week.end);
  const weeklyRate = percent(weeklyActual, settings.weeklyTargetMinutes);
  const timeProgress = getTimeProgress(sessions, settings);
  const completionRate = getCompletionRate(items);

  const dailyData = DAY_NAMES.map((name, index) => {
    const date = addDays(week.start, index);
    return {
      name,
      date: date.slice(5),
      planned: items.filter((item) => item.scheduledDate === date).reduce((sum, item) => sum + item.estimatedMinutes, 0),
      actual: Math.round((secondsByDate[date] ?? 0) / 60),
    };
  });

  const categoryData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const session of sessions) {
      const item = items.find((entry) => entry.id === session.itemId);
      const category = item?.area ?? "자유 학습";
      totals.set(category, (totals.get(category) ?? 0) + session.durationSeconds / 60);
    }
    return [...totals.entries()].map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value);
  }, [items, sessions]);

  let cumulativeActual = 0;
  const weeklyData = Array.from({ length: 14 }, (_, index) => {
    const start = addDays(settings.studyStartDate, index * 7);
    const end = index === 13 ? settings.examDate : addDays(start, 6);
    const actual = getRangeMinutes(sessions, start, end);
    cumulativeActual += actual;
    return {
      week: `${index + 1}주`,
      actual,
      planned: items.filter((item) => isDateBetween(item.scheduledDate, start, end)).reduce((sum, item) => sum + item.estimatedMinutes, 0),
      cumulative: cumulativeActual,
      target: Math.min(settings.totalTargetMinutes, settings.weeklyTargetMinutes * (index + 1)),
      progress: percent(cumulativeActual, settings.totalTargetMinutes),
    };
  });

  return (
    <div className="page">
      <header className="page-header"><span className="eyebrow">LEARNING ANALYTICS</span><h1>학습 통계</h1><p>계획과 실제 학습량의 차이를 확인하고 다음 주 계획을 조정하세요.</p></header>
      <div className="stats-kpi-grid">
        <article><span className="metric-icon green"><Clock3 size={17} /></span><div><small>누적 학습 시간</small><strong>{formatMinutes(total)}</strong></div></article>
        <article><span className="metric-icon blue"><TrendingUp size={17} /></span><div><small>이번 주 달성률</small><strong>{weeklyRate}%</strong></div></article>
        <article><span className="metric-icon amber"><Target size={17} /></span><div><small>시간 기준 진도</small><strong>{timeProgress}%</strong></div></article>
        <article><span className="metric-icon purple"><Activity size={17} /></span><div><small>항목 완료율</small><strong>{completionRate}%</strong></div></article>
      </div>

      <div className="charts-grid">
        <section className="panel chart-panel chart-wide">
          <div className="panel-heading"><div><span className="eyebrow"><BarChart3 size={13} /> THIS WEEK</span><h2>요일별 계획 · 실제 시간</h2></div><span className="panel-stat">{formatMinutes(weeklyActual)} / {formatMinutes(settings.weeklyTargetMinutes)}</span></div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={dailyData} margin={{ top: 12, right: 4, bottom: 0, left: -18 }} barGap={5}><CartesianGrid stroke="var(--chart-grid)" vertical={false} /><XAxis dataKey="name" stroke="var(--muted)" tickLine={false} axisLine={false} /><YAxis stroke="var(--muted)" tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(Number(value) / 60)}h`} /><Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--hover)" }} /><Legend iconType="circle" iconSize={7} /><Bar name="계획(분)" dataKey="planned" fill="#384252" radius={[5, 5, 0, 0]} maxBarSize={32} /><Bar name="실제(분)" dataKey="actual" fill="#45d483" radius={[5, 5, 0, 0]} maxBarSize={32} /></BarChart></ResponsiveContainer>
          </div>
        </section>

        <section className="panel chart-panel goal-panel">
          <div className="panel-heading"><div><span className="eyebrow">WEEKLY GOAL</span><h2>주간 목표 달성</h2></div></div>
          <div className="goal-ring" style={{ "--goal": `${Math.min(100, weeklyRate) * 3.6}deg` } as React.CSSProperties}><div><strong>{weeklyRate}%</strong><span>달성</span></div></div>
          <div className="goal-comparison"><div><span>계획 시간</span><b>{formatMinutes(weeklyPlanned)}</b></div><div><span>실제 시간</span><b>{formatMinutes(weeklyActual)}</b></div></div>
          <ProgressBar value={weeklyRate} size="md" />
          <p className="chart-note">달성률은 100%를 넘어도 기록되며, 막대 너비만 100%로 제한됩니다.</p>
        </section>

        <section className="panel chart-panel">
          <div className="panel-heading"><div><span className="eyebrow">BY CATEGORY</span><h2>학습 영역별 시간</h2></div></div>
          <div className="chart-box pie-box">
            {categoryData.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={84} paddingAngle={3} stroke="none">{categoryData.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer> : <div className="chart-empty">학습 기록을 추가하면<br />영역별 분포가 표시됩니다.</div>}
          </div>
          <div className="category-legend">{categoryData.slice(0, 5).map((entry, index) => <div key={entry.name}><i style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} /><span>{entry.name}</span><b>{formatMinutes(entry.value)}</b></div>)}</div>
        </section>

        <section className="panel chart-panel chart-wide-secondary">
          <div className="panel-heading"><div><span className="eyebrow">14-WEEK TREND</span><h2>주차별 누적 학습량 · 진도 추이</h2></div><span className="panel-stat">목표 {formatMinutes(settings.totalTargetMinutes)}</span></div>
          <div className="chart-box tall">
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={weeklyData} margin={{ top: 12, right: 10, bottom: 0, left: -10 }}><defs><linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#45d483" stopOpacity={0.32}/><stop offset="95%" stopColor="#45d483" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="var(--chart-grid)" vertical={false} /><XAxis dataKey="week" stroke="var(--muted)" tickLine={false} axisLine={false} interval={1} /><YAxis stroke="var(--muted)" tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(Number(value) / 60)}h`} /><Tooltip contentStyle={tooltipStyle} /><Legend iconType="circle" iconSize={7} /><Area name="누적 실제(분)" type="monotone" dataKey="cumulative" stroke="#45d483" fill="url(#actualFill)" strokeWidth={2.5} /><Line name="누적 목표(분)" type="monotone" dataKey="target" stroke="#638cff" strokeDasharray="5 5" dot={false} strokeWidth={2} /></AreaChart></ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
