"use client";

import { addDays, getKstWeekday, parseDateKey, toDateKey } from "@/lib/date";
import { formatMinutes } from "@/lib/format";

function intensity(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

export function StudyHeatmap({ startDate, endDate, minutesByDate }: { startDate: string; endDate: string; minutesByDate: Record<string, number> }) {
  const start = addDays(startDate, -getKstWeekday(startDate));
  const end = addDays(endDate, 6 - getKstWeekday(endDate));
  const dates: string[] = [];
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) dates.push(cursor);
  const weeks = Math.ceil(dates.length / 7);
  const monthLabels = dates.filter((date, index) => index % 7 === 0).map((date, index) => ({
    index,
    label: new Intl.DateTimeFormat("ko-KR", { month: "short", timeZone: "Asia/Seoul" }).format(parseDateKey(date)),
  }));

  return (
    <div className="heatmap-scroll">
      <div className="heatmap-wrap" style={{ minWidth: `${Math.max(weeks * 17 + 34, 360)}px` }}>
        <div className="heatmap-months">
          {monthLabels.map((entry) => <span key={entry.index} style={{ left: `${34 + entry.index * 17}px` }}>{entry.label}</span>)}
        </div>
        <div className="heatmap-body">
          <div className="heatmap-days"><span>월</span><span>수</span><span>금</span></div>
          <div className="heatmap-grid" style={{ gridTemplateColumns: `repeat(${weeks}, 12px)` }}>
            {dates.map((date) => {
              const minutes = minutesByDate[date] ?? 0;
              return <span key={date} className={`heat-cell heat-${intensity(minutes)} ${date === toDateKey() ? "today" : ""}`} title={`${date} · ${formatMinutes(minutes)}`} />;
            })}
          </div>
        </div>
        <div className="heatmap-legend"><span>적게</span>{[0, 1, 2, 3, 4].map((level) => <i key={level} className={`heat-cell heat-${level}`} />)}<span>많이</span></div>
      </div>
    </div>
  );
}
