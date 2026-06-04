"use client";

import { useState, useEffect } from "react";
import { getTodos } from "@/lib/supabase/api";
import { extractTags, getTagColor } from "@/lib/tags";

interface Todo {
  id: number;
  text: string;
  done: boolean;
  created_at: string | null;
  completed_at: string | null;
}

type SortMode = "date" | "duration";

function daysBetween(startIso: string | null, endIso: string | null): number | null {
  if (!startIso || !endIso) return null;
  const s = new Date(startIso);
  const e = new Date(endIso);
  const sUtc = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
  const eUtc = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate());
  return Math.round((eUtc - sUtc) / 86400000);
}

function formatMonthDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function durationStyle(days: number): { bg: string; color: string; weight: number; label: string } {
  if (days >= 7) return { bg: "#fef2f2", color: "#b91c1c", weight: 600, label: `${days}일` }; // 회고 (red)
  if (days >= 3) return { bg: "#fffbeb", color: "#b45309", weight: 500, label: `${days}일` }; // 주의 (amber)
  if (days >= 1) return { bg: "#f3f4f6", color: "#111", weight: 500, label: `${days}일` }; // 보통
  return { bg: "transparent", color: "#9CA3AF", weight: 400, label: "당일" }; // 당일 — 조용히
}

const DAY_KR = ["일", "월", "화", "수", "목", "금", "토"];

function getWeekRange(offset = 0): { dates: Date[]; label: string; weekNumOfMonth: number; month: number; weekOfYear: number } {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day + offset * 7);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  const label = `${dates[0].getMonth() + 1}/${dates[0].getDate()} (${DAY_KR[dates[0].getDay()]}) ~ ${dates[6].getMonth() + 1}/${dates[6].getDate()} (${DAY_KR[dates[6].getDay()]})`;
  const firstDay = new Date(dates[0].getFullYear(), 0, 1);
  const weekOfYear = Math.ceil(((dates[0].getTime() - firstDay.getTime()) / 86400000 + firstDay.getDay() + 1) / 7);
  return { dates, label, weekNumOfMonth: Math.ceil(dates[0].getDate() / 7), month: dates[0].getMonth() + 1, weekOfYear };
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTimeHM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// 본문에서 [063], [루틴] 같은 프로젝트/카테고리 배지 후보 추출 — 첫 #태그 또는 텍스트 앞쪽 키워드
function extractBadge(text: string): { badge: string | null; cleanText: string } {
  // 패턴 1: 본문 시작에 "[063]" 같은 명시적 표시
  const bracketMatch = text.match(/^\s*\[([^\]]+)\]\s*(.*)/);
  if (bracketMatch) return { badge: bracketMatch[1], cleanText: bracketMatch[2] };
  return { badge: null, cleanText: text };
}

export default function CompletedThisWeek() {
  const [offset, setOffset] = useState(0);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("date");

  useEffect(() => {
    getTodos().then((data) => {
      setTodos(data as Todo[]);
      setLoading(false);
    });
  }, []);

  const { dates, label, weekNumOfMonth, month, weekOfYear } = getWeekRange(offset);
  const start = toDateStr(dates[0]);
  const end = toDateStr(dates[6]);

  // 이 주 완료 todo
  const completedInWeek = todos.filter((t) => {
    if (!t.done || !t.completed_at) return false;
    const d = toDateStr(new Date(t.completed_at));
    return d >= start && d <= end;
  });

  // 지난 주 완료 (비교용)
  const { dates: lastDates } = getWeekRange(offset - 1);
  const lastStart = toDateStr(lastDates[0]);
  const lastEnd = toDateStr(lastDates[6]);
  const completedLastWeek = todos.filter((t) => {
    if (!t.done || !t.completed_at) return false;
    const d = toDateStr(new Date(t.completed_at));
    return d >= lastStart && d <= lastEnd;
  });
  const weekDiff = completedInWeek.length - completedLastWeek.length;

  // 월 통계 (현재 보고 있는 주의 월)
  const refDate = dates[0];
  const monthStart = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, "0")}-01`;
  const monthEnd = toDateStr(new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0));
  const completedInMonth = todos.filter((t) => {
    if (!t.done || !t.completed_at) return false;
    const d = toDateStr(new Date(t.completed_at));
    return d >= monthStart && d <= monthEnd;
  });

  // 전월 비교
  const prevMonthFirst = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
  const prevMonthStart = `${prevMonthFirst.getFullYear()}-${String(prevMonthFirst.getMonth() + 1).padStart(2, "0")}-01`;
  const prevMonthEnd = toDateStr(new Date(prevMonthFirst.getFullYear(), prevMonthFirst.getMonth() + 1, 0));
  const completedPrevMonth = todos.filter((t) => {
    if (!t.done || !t.completed_at) return false;
    const d = toDateStr(new Date(t.completed_at));
    return d >= prevMonthStart && d <= prevMonthEnd;
  }).length;

  // 평균 완료/일 (이번 주 기준 = 7일 평균)
  const avgPerDay = Math.round((completedInWeek.length / 7) * 10) / 10;
  // 월 평균/일
  const daysInMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate();
  const monthAvgPerDay = Math.round((completedInMonth.length / daysInMonth) * 10) / 10;

  // 날짜별 그룹 (최신 날짜부터)
  const grouped: Record<string, Todo[]> = {};
  for (const t of completedInWeek) {
    const d = toDateStr(new Date(t.completed_at!));
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(t);
  }
  // 시간 역순 (최신부터)
  for (const k of Object.keys(grouped)) {
    grouped[k].sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
  }
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const todayStr = toDateStr(new Date());

  // 기간순 정렬 — 이번 주 항목 전체를 소요일 내림차순
  const byDuration = [...completedInWeek].sort((a, b) => {
    const da = daysBetween(a.created_at, a.completed_at) ?? 0;
    const db = daysBetween(b.created_at, b.completed_at) ?? 0;
    if (db !== da) return db - da;
    return (b.completed_at ?? "").localeCompare(a.completed_at ?? "");
  });

  // 회고 자동 picking — 7일+ 항목 (소요일 긴 순, 최대 3개)
  const longRunning = byDuration
    .filter((t) => (daysBetween(t.created_at, t.completed_at) ?? 0) >= 7)
    .slice(0, 3);

  // 본문에서 #태그를 칩으로 분리 렌더링 (clean text 기준)
  function renderItemText(text: string) {
    const tagRegex = /#([\w가-힣]+)/g;
    const parts: Array<{ kind: "text" | "tag"; value: string }> = [];
    let last = 0;
    let m: RegExpExecArray | null;
    tagRegex.lastIndex = 0;
    while ((m = tagRegex.exec(text)) !== null) {
      if (m.index > last) parts.push({ kind: "text", value: text.slice(last, m.index) });
      parts.push({ kind: "tag", value: m[1] });
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push({ kind: "text", value: text.slice(last) });
    return parts.map((p, i) => {
      if (p.kind === "text") return <span key={i}>{p.value}</span>;
      const c = getTagColor(p.value);
      return (
        <span key={i} style={{
          display: "inline-block", fontSize: "0.7rem", fontWeight: 500,
          padding: "1px 7px", borderRadius: "10px",
          background: c.bg, color: c.text, margin: "0 2px", verticalAlign: "1px",
        }}>#{p.value}</span>
      );
    });
  }

  return (
    <div style={{ marginTop: "8px", marginBottom: "24px" }}>
      {/* 헤더 — DONE 라벨 + 네비 */}
      <div className="font-heading" style={{ fontSize: "0.72rem", fontWeight: 600, color: "#111", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
        Done
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 24px", alignItems: "center", marginBottom: "2px" }}>
        <button onClick={() => setOffset((p) => p - 1)}
          style={{ background: "none", border: "none", fontSize: "1.15rem", color: "#111", cursor: "pointer", padding: "4px 0", fontFamily: "inherit", fontWeight: 300 }}>
          ‹
        </button>
        <div style={{ textAlign: "center", fontSize: "0.92rem", fontWeight: 700, color: "#111" }}>
          {month}월 {weekNumOfMonth}번째 주
        </div>
        <button onClick={() => setOffset((p) => p + 1)}
          disabled={offset >= 0}
          style={{ background: "none", border: "none", fontSize: "1.15rem", color: offset >= 0 ? "#D1D5DB" : "#111", cursor: offset >= 0 ? "not-allowed" : "pointer", padding: "4px 0", fontFamily: "inherit", fontWeight: 300, textAlign: "right" }}>
          ›
        </button>
      </div>
      <div style={{ textAlign: "center", fontSize: "0.74rem", color: "#9CA3AF", marginBottom: "18px" }}>
        {label} · W{String(weekOfYear).padStart(2, "0")}
      </div>

      {/* 통계 3열 — 배경 없음, 타이포 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px", padding: "4px 0" }}>
        <div>
          <div style={{ fontSize: "0.65rem", color: "#9CA3AF", marginBottom: "2px" }} className="font-heading">이번 주 완료</div>
          <div className="font-heading" style={{ fontSize: "1.7rem", fontWeight: 700, color: "#111", lineHeight: 1.1 }}>{completedInWeek.length}</div>
          <div style={{ fontSize: "0.65rem", color: "#9CA3AF", marginTop: "2px" }}>
            <b style={{ color: "#111", fontWeight: 500 }}>{weekDiff >= 0 ? `+${weekDiff}` : weekDiff}</b> vs 지난 주
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.65rem", color: "#9CA3AF", marginBottom: "2px" }} className="font-heading">{month}월 누적</div>
          <div className="font-heading" style={{ fontSize: "1.7rem", fontWeight: 700, color: "#111", lineHeight: 1.1 }}>{completedInMonth.length}</div>
          <div style={{ fontSize: "0.65rem", color: "#9CA3AF", marginTop: "2px" }}>전월 <b style={{ color: "#111", fontWeight: 500 }}>{completedPrevMonth}</b></div>
        </div>
        <div>
          <div style={{ fontSize: "0.65rem", color: "#9CA3AF", marginBottom: "2px" }} className="font-heading">평균 완료/일</div>
          <div className="font-heading" style={{ fontSize: "1.7rem", fontWeight: 700, color: "#111", lineHeight: 1.1 }}>{avgPerDay}</div>
          <div style={{ fontSize: "0.65rem", color: "#9CA3AF", marginTop: "2px" }}>월 <b style={{ color: "#111", fontWeight: 500 }}>{monthAvgPerDay}</b></div>
        </div>
      </div>

      {/* 회고 자동 picking — 7일+ 항목 */}
      {longRunning.length > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "10px 12px", marginBottom: "14px" }}>
          <div className="font-heading" style={{ fontSize: "0.62rem", fontWeight: 600, color: "#b91c1c", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
            오래 묵힌 일
          </div>
          {longRunning.map((t) => {
            const days = daysBetween(t.created_at, t.completed_at) ?? 0;
            const { cleanText } = extractBadge(t.text);
            return (
              <div key={`lr-${t.id}`} style={{ fontSize: "0.78rem", color: "#7f1d1d", padding: "2px 0", display: "flex", justifyContent: "space-between", gap: "8px" }}>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cleanText}</span>
                <span className="font-heading" style={{ fontWeight: 600, flexShrink: 0 }}>{days}일</span>
              </div>
            );
          })}
        </div>
      )}

      {/* 소팅 칩 */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
        <button
          onClick={() => setSortMode("date")}
          className="font-heading"
          style={{
            fontSize: "0.66rem", fontWeight: 500, padding: "4px 10px", borderRadius: "12px",
            background: sortMode === "date" ? "#111" : "#f3f4f6",
            color: sortMode === "date" ? "#fff" : "#6B7280",
            border: sortMode === "date" ? "1px solid #111" : "1px solid transparent",
            cursor: "pointer",
          }}
        >
          날짜순
        </button>
        <button
          onClick={() => setSortMode("duration")}
          className="font-heading"
          style={{
            fontSize: "0.66rem", fontWeight: 500, padding: "4px 10px", borderRadius: "12px",
            background: sortMode === "duration" ? "#111" : "#f3f4f6",
            color: sortMode === "duration" ? "#fff" : "#6B7280",
            border: sortMode === "duration" ? "1px solid #111" : "1px solid transparent",
            cursor: "pointer",
          }}
        >
          기간순
        </button>
      </div>

      {/* 월 헤딩 */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderTop: "1px solid #ececec", paddingTop: "14px", marginBottom: "10px" }}>
        <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111" }}>{month}월</div>
        <div style={{ fontSize: "0.7rem", color: "#9CA3AF" }}>
          <b style={{ color: "#111", fontWeight: 500 }}>{completedInWeek.length}건</b> / 이번 주
        </div>
      </div>

      {loading ? (
        <div style={{ fontSize: "0.78rem", color: "#9CA3AF", padding: "8px 0" }}>불러오는 중...</div>
      ) : completedInWeek.length === 0 ? (
        <div style={{ fontSize: "0.78rem", color: "#9CA3AF", padding: "12px 0", textAlign: "center" }}>
          이 주에 완료한 항목이 없어요.
        </div>
      ) : sortMode === "date" ? (
        sortedDates.map((d) => {
          const dateObj = new Date(d + "T00:00:00");
          const dow = DAY_KR[dateObj.getDay()];
          const isToday = d === todayStr;
          return (
            <div key={d} style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #f0f0f0", marginBottom: "4px" }}>
                <div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "#111" }}>
                    {dateObj.getMonth() + 1}/{dateObj.getDate()} <span style={{ color: "#9CA3AF", fontWeight: 400, fontSize: "0.84rem", marginLeft: "4px" }}>{dow}</span>
                  </div>
                  {isToday && (
                    <span className="font-heading" style={{ display: "inline-block", background: "#111", color: "#fff", fontSize: "0.58rem", fontWeight: 700, padding: "2px 7px", borderRadius: "3px", letterSpacing: "0.08em", marginTop: "4px" }}>
                      TODAY
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#9CA3AF", paddingTop: "3px" }}>{grouped[d].length}건</div>
              </div>
              {grouped[d].map((t) => renderDoneItem(t))}
            </div>
          );
        })
      ) : (
        <div>
          {byDuration.map((t) => (
            <div key={t.id} style={{ borderTop: "1px solid #f0f0f0", paddingTop: "4px" }}>
              {renderDoneItem(t)}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  function renderDoneItem(t: Todo) {
    const { badge, cleanText } = extractBadge(t.text);
    const days = daysBetween(t.created_at, t.completed_at);
    const dStyle = days !== null ? durationStyle(days) : null;
    const isSameDay = days === 0;
    return (
      <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "7px 0" }}>
        <div style={{ width: "18px", height: "18px", background: "rgba(0,0,0,0.5)", color: "#fff", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.78rem", marginTop: "1px" }}>
          ✓
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.84rem", color: "#111", lineHeight: 1.4 }}>
            {renderItemText(cleanText)}
            {badge && (
              <span className="font-heading" style={{ display: "inline-block", border: "1px solid #d1d5db", color: "#6B7280", fontSize: "0.62rem", padding: "1px 6px", borderRadius: "3px", marginLeft: "6px", verticalAlign: "1px" }}>
                {badge}
              </span>
            )}
          </div>
          {dStyle && days !== null && t.created_at && t.completed_at && (
            <div className="font-heading" style={{ fontSize: "0.66rem", color: "#9CA3AF", marginTop: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
              {!isSameDay && (
                <>
                  <span>{formatMonthDay(t.created_at)}</span>
                  <span style={{ color: "#d1d5db" }}>→</span>
                  <span>{formatMonthDay(t.completed_at)}</span>
                </>
              )}
              {isSameDay && <span>{formatMonthDay(t.completed_at)}</span>}
              <span style={{ background: dStyle.bg, color: dStyle.color, fontWeight: dStyle.weight, padding: isSameDay ? "0" : "0 6px", borderRadius: "3px" }}>
                {dStyle.label}
              </span>
            </div>
          )}
        </div>
        <div className="font-heading" style={{ fontSize: "0.72rem", color: "#9CA3AF", flexShrink: 0, paddingTop: "2px" }}>
          {t.completed_at ? formatTimeHM(t.completed_at) : ""}
        </div>
      </div>
    );
  }
}
