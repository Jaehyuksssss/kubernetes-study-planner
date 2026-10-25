"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, LayoutDashboard, Moon, Route, Settings, Sun, TerminalSquare } from "lucide-react";
import { useStudyStore } from "@/stores/study-store";

const NAV_ITEMS = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/calendar", label: "캘린더", icon: CalendarDays },
  { href: "/plan", label: "학습 계획", icon: Route },
  { href: "/statistics", label: "통계", icon: BarChart3 },
  { href: "/settings", label: "설정", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hydrate = useStudyStore((state) => state.hydrate);
  const hydrated = useStudyStore((state) => state.hydrated);
  const theme = useStudyStore((state) => state.settings.theme);
  const examDate = useStudyStore((state) => state.settings.examDate);
  const updateSettings = useStudyStore((state) => state.updateSettings);

  useEffect(() => { hydrate(); }, [hydrate]);

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><TerminalSquare size={19} /></span><span>CKA<span className="brand-light">/tracker</span></span></div>
        <nav className="nav-list" aria-label="주요 메뉴">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === href : pathname.startsWith(href);
            return <Link key={href} href={href} className={`nav-link ${active ? "active" : ""}`}><Icon size={17} /><span>{label}</span></Link>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="exam-chip"><span className="pulse-dot" /><div><b>CKA Exam</b><small>{examDate.replaceAll("-", ". ")}</small></div></div>
          <button className="theme-button" onClick={() => updateSettings({ theme: theme === "dark" ? "light" : "dark" })} aria-label="테마 전환">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}<span>{theme === "dark" ? "라이트 모드" : "다크 모드"}</span>
          </button>
        </div>
      </aside>
      <main className="main-content">
        {!hydrated ? <div className="loading-shell"><span className="loading-dot" />학습 데이터를 불러오는 중...</div> : children}
      </main>
      <nav className="mobile-nav" aria-label="모바일 메뉴">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === href : pathname.startsWith(href);
          return <Link key={href} href={href} className={active ? "active" : ""}><Icon size={19} /><span>{label}</span></Link>;
        })}
      </nav>
    </div>
  );
}
