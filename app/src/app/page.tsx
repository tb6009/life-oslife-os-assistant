"use client";

import { useState, useEffect } from "react";
import WeatherHero from "@/components/briefing/WeatherHero";
import Greeting from "@/components/briefing/Greeting";
import DailyInsight from "@/components/briefing/DailyInsight";
// BriefingBlock에서 TodayBlock 제거 — 홈에서 직접 렌더링
import RoutineList from "@/components/briefing/RoutineList";
import ActivityTracker from "@/components/briefing/ActivityTracker";
import CompletedThisWeek from "@/components/briefing/CompletedThisWeek";
import HomeTabs from "@/components/briefing/HomeTabs";
import DynamicRecommend from "@/components/briefing/DynamicRecommend";
import TodoList from "@/components/briefing/TodoList";
import { getTimeOfDay } from "@/lib/theme/timeColor";
import type { TimeOfDay, ColorOption } from "@/lib/theme/timeColor";
import type { DayData, ScheduleItem } from "@/lib/types/briefing";
import { mockWeatherByTime } from "@/lib/data/mockBriefing";
import { getSchedules, toggleScheduleDone, deleteSchedule } from "@/lib/supabase/api";

const dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

function formatDate(): string {
  const now = new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${days[now.getDay()]}, ${months[now.getMonth()]} ${String(now.getDate()).padStart(2, "0")}`;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function schedulesToDayData(
  schedules: Array<{ title: string; time: string | null }>,
  dayLabel: string
): DayData {
  if (schedules.length === 0) {
    return { summary: `${dayLabel} — 일정 없음`, items: [] };
  }
  return {
    summary: `${dayLabel} — ${schedules.length}건`,
    items: schedules.map((s) => ({
      text: s.time ? `${s.time} ${s.title}` : s.title,
      done: false,
    })),
  };
}

function CollapsibleUpcoming({ tomorrowData, dayAfterData, yesterdayData }: {
  tomorrowData: DayData;
  dayAfterData: DayData;
  yesterdayData: ScheduleItem[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: "24px" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: "4px 0" }}
      >
        <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Tomorrow / Upcoming
        </div>
        <span style={{ fontSize: "0.7rem", color: "#6B7280" }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ fontSize: "0.82rem", color: "#6B7280", paddingTop: "4px" }}>
          <div style={{ padding: "3px 0" }}>{tomorrowData.summary}</div>
          {tomorrowData.items?.map((item, i) => (
            <div key={`t-${i}`} style={{ padding: "2px 0", paddingLeft: "8px" }}>{item.text}</div>
          ))}
          <div style={{ padding: "3px 0" }}>{dayAfterData.summary}</div>
          {dayAfterData.items?.map((item, i) => (
            <div key={`d-${i}`} style={{ padding: "2px 0", paddingLeft: "8px" }}>{item.text}</div>
          ))}
          <div style={{ padding: "3px 0" }}>
            어제 — {yesterdayData.length > 0 ? yesterdayData.map(it => it.text).join(", ") : "일정 없음"}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("morning");
  const [colorOption] = useState<ColorOption>("blue");
  const [todaySchedules, setTodaySchedules] = useState<Array<{ id: number; title: string; time: string | null; done: boolean }>>([]);
  const [todayDayName, setTodayDayName] = useState("");
  const todaySummary = todayDayName
    ? (todaySchedules.length === 0 ? `${todayDayName} — 일정 없음` : `${todayDayName} — ${todaySchedules.length}건`)
    : "불러오는 중...";
  const [tomorrowData, setTomorrowData] = useState<DayData>({ summary: "불러오는 중...", items: [] });
  const [dayAfterData, setDayAfterData] = useState<DayData>({ summary: "불러오는 중...", items: [] });
  const [yesterdayData, setYesterdayData] = useState<ScheduleItem[]>([]);
  const [dynamicSuggestion, setDynamicSuggestion] = useState("");

  useEffect(() => {
    // Google Calendar 동기화 시도 (로그인 상태면 자동 실행, 1회만)
    if (!sessionStorage.getItem("cal_synced")) {
      fetch("/api/calendar").then(() => sessionStorage.setItem("cal_synced", "1")).catch(() => {});
    }

    const hour = new Date().getHours();
    setTimeOfDay(getTimeOfDay(hour));

    const now = new Date();
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(now); dayAfter.setDate(dayAfter.getDate() + 2);

    // 스케줄 로드 + 동적 제안 생성
    Promise.all([
      getSchedules(toDateStr(now)),
      getSchedules(toDateStr(tomorrow)),
      getSchedules(toDateStr(dayAfter)),
      getSchedules(toDateStr(yesterday)),
    ]).then(([todayS, tomorrowS, dayAfterS, yesterdayS]) => {
      setTodaySchedules(todayS.map((s: { id: number; title: string; time: string | null; done?: boolean }) => ({
        id: s.id, title: s.title, time: s.time, done: s.done ?? false,
      })));
      setTodayDayName(dayNames[now.getDay()]);
      setTomorrowData(schedulesToDayData(tomorrowS, dayNames[tomorrow.getDay()]));
      setDayAfterData(schedulesToDayData(dayAfterS, dayNames[dayAfter.getDay()]));
      setYesterdayData(yesterdayS.length > 0
        ? yesterdayS.map((s: { title: string; time: string | null }) => ({ text: s.time ? `${s.time} ${s.title}` : s.title, done: true }))
        : [{ text: "일정 없음", done: true }]
      );

      // 동적 제안 생성
      const todayItems = todayS.map((s: { title: string }) => s.title).join(", ");
      const tomorrowItems = tomorrowS.map((s: { title: string }) => s.title).join(", ");
      if (todayS.length > 0 && tomorrowS.length > 0) {
        setDynamicSuggestion(`오늘은 ${todayItems} 일정이 있습니다. 내일은 ${tomorrowItems}이 예정되어 있으니, 오늘 일정에 집중하시고 저녁에 충분히 쉬세요.`);
      } else if (todayS.length > 0) {
        setDynamicSuggestion(`오늘은 ${todayItems} 일정이 있습니다. 내일은 여유로우니 오늘 집중하세요.`);
      } else if (tomorrowS.length > 0) {
        setDynamicSuggestion(`오늘은 일정이 없습니다. 내일 ${tomorrowItems}이 예정되어 있으니, 오늘 준비하거나 충분히 쉬세요.`);
      } else {
        setDynamicSuggestion("오늘은 일정이 없습니다. 자유로운 하루를 보내세요.");
      }
    });
  }, []);

  // v0.9.6 — UI 인터랙티브 컨트롤은 50% 회색으로 통일 (시간대 컬러는 WeatherHero 그라데이션에만 사용)
  const accentColor = "rgba(0,0,0,0.5)";
  const weather = mockWeatherByTime[timeOfDay];

  return (
    <div style={{ width: "100%" }}>
      <WeatherHero
        timeOfDay={timeOfDay}
        colorOption={colorOption}
        temperature={weather.temperature}
        condition={weather.condition}
        range={weather.range}
      />

      <div className="px-7">
        <Greeting timeOfDay={timeOfDay} date={formatDate()} />

        <DailyInsight
          weather={weather}
          accentColor={accentColor}
        />

        {/* Today Schedule — 체크 가능 */}
        <div className="mb-6">
          <div className="font-heading text-[0.7rem] font-medium uppercase tracking-[0.1em] mb-1" style={{ color: "#6B7280", marginTop: "24px" }}>
            Today
          </div>
          <div className="text-black font-medium" style={{ fontSize: "1.26rem" }}>{todaySummary}</div>
          {todaySchedules.map((s) => (
            <div
              key={s.id}
              style={{ display: "flex", alignItems: "center", gap: "10px", minHeight: "36px", padding: "2px 0" }}
            >
              <span
                onClick={async () => {
                  const newDone = !s.done;
                  setTodaySchedules((prev) => prev.map((p) => p.id === s.id ? { ...p, done: newDone } : p));
                  await toggleScheduleDone(s.id, newDone);
                }}
                style={{
                  width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: s.done ? "none" : `1.5px solid ${accentColor}`,
                  background: s.done ? accentColor : "transparent",
                  cursor: "pointer",
                }}
              >
                {s.done && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span
                onClick={async () => {
                  const newDone = !s.done;
                  setTodaySchedules((prev) => prev.map((p) => p.id === s.id ? { ...p, done: newDone } : p));
                  await toggleScheduleDone(s.id, newDone);
                }}
                style={{
                  fontSize: "0.84rem",
                  color: s.done ? "#6B7280" : "#333",
                  textDecoration: s.done ? "line-through" : "none",
                  lineHeight: 1.45,
                  flex: 1,
                  cursor: "pointer",
                }}
              >
                {s.time ? `${s.time} ${s.title}` : s.title}
              </span>
              <span
                onClick={async (e) => {
                  e.stopPropagation();
                  setTodaySchedules((prev) => prev.filter((p) => p.id !== s.id));
                  await deleteSchedule(s.id);
                }}
                style={{
                  fontSize: "0.78rem",
                  color: "#b3b3b3",
                  cursor: "pointer",
                  padding: "4px 6px",
                  flexShrink: 0,
                }}
              >
                ✕
              </span>
            </div>
          ))}
        </div>

        <RoutineList accentColor={accentColor} />

        <CollapsibleUpcoming
          tomorrowData={tomorrowData}
          dayAfterData={dayAfterData}
          yesterdayData={yesterdayData}
        />

        <HomeTabs
          daily={
            <>
              <DynamicRecommend accentColor={accentColor} />
              <TodoList accentColor={accentColor} />
            </>
          }
          activity={<ActivityTracker />}
          done={<CompletedThisWeek />}
        />
      </div>
    </div>
  );
}
