"use client";

import { useState, useEffect } from "react";
import { getHealthLogs, getJournalEntries, getRecommendationLogs, getTodos, getWeeklyReview, upsertWeeklyReview, getRoutines, getRoutineLogsByRange, getChatMessages } from "@/lib/supabase/api";
import { getEmotionColor } from "@/lib/theme/emotions";

const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];
const dayLabelsFull = ["일", "월", "화", "수", "목", "금", "토"];

function getWeekRange(offset: number = 0): { start: string; end: string; dates: Date[] } {
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
  const toStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: toStr(dates[0]), end: toStr(dates[6]), dates };
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px", marginTop: "24px" }}>
      {label}
    </div>
  );
}

interface DayDetail {
  date: string;
  dayLabel: string;
  sleep: number | null;
  condition: number | null;
  exercise: string | null;
  emotion: string | null;
}

export default function WeekTab() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekData, setWeekData] = useState<{
    sleepByDay: (number | null)[];
    coffeeByDay: (number | null)[];
    days: DayDetail[];
    emotions: string[];
    exerciseCount: number;
    exerciseList: string[];
    recommendTotal: number;
    recommendDone: number;
    recommendItems: Array<{ text: string; done: boolean }>;
    avgSleep: number;
    avgCondition: number;
    avgCoffee: number;
    todosDone: number;
    todosTotal: number;
    report: string;
  } | null>(null);

  const [nextWeek, setNextWeek] = useState("");
  const [oneLine, setOneLine] = useState("");
  const [reviewSaved, setReviewSaved] = useState(false);

  const { start, end, dates } = getWeekRange(weekOffset);
  const refDate = new Date();
  refDate.setDate(refDate.getDate() + weekOffset * 7);
  const weekNum = Math.ceil(((refDate.getTime() - new Date(refDate.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(refDate.getFullYear(), 0, 1).getDay() + 1) / 7);
  const yearWeek = `${refDate.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;

  const weekLabel = `${dates[0].getMonth() + 1}/${dates[0].getDate()} ~ ${dates[6].getMonth() + 1}/${dates[6].getDate()}`;

  useEffect(() => {
    // 회고 로드
    getWeeklyReview(yearWeek).then((d) => {
      if (d) {
        setNextWeek(d.next_week ?? "");
        setOneLine(d.one_line ?? "");
      }
    });
  }, [yearWeek]);

  useEffect(() => {
    Promise.all([
      getHealthLogs(start, end),
      getJournalEntries(start, end),
      getRecommendationLogs(start, end),
      getTodos(),
    ]).then(([healthLogs, journals, recLogs, todos]) => {
      const sleepByDay: (number | null)[] = [];
      const coffeeByDay: (number | null)[] = [];
      const days: DayDetail[] = [];
      let exerciseCount = 0;
      const exerciseList: string[] = [];
      const emotions: string[] = [];
      let recommendTotal = 0;
      let recommendDone = 0;
      const allRecItems: Array<{ text: string; done: boolean }> = [];

      for (const d of dates) {
        const ds = toDateStr(d);
        const h = healthLogs.find((l: { date: string }) => l.date === ds);
        sleepByDay.push(h?.sleep_hours ?? null);
        coffeeByDay.push(h?.coffee ?? null);
        if (h?.exercise) {
          exerciseCount++;
          exerciseList.push(`${dayLabelsFull[d.getDay()]} — ${h.exercise}`);
        }

        const j = journals.find((l: { date: string }) => l.date === ds);
        if (j?.emotion) emotions.push(j.emotion);

        const r = recLogs.find((l: { date: string }) => l.date === ds);
        if (r) {
          recommendTotal += r.total;
          recommendDone += r.done;
          if (r.items && Array.isArray(r.items)) {
            for (const item of r.items) {
              allRecItems.push(item as { text: string; done: boolean });
            }
          }
        }

        days.push({
          date: ds,
          dayLabel: dayLabelsFull[d.getDay()],
          sleep: h?.sleep_hours ?? null,
          condition: h?.condition ?? null,
          exercise: h?.exercise ?? null,
          emotion: j?.emotion ?? null,
        });
      }

      const validSleep = sleepByDay.filter((s): s is number => s !== null);
      const validCoffee = coffeeByDay.filter((c): c is number => c !== null);
      const validCondition = days.map((d) => d.condition).filter((c): c is number => c !== null);

      const todosDone = todos.filter((t: { done: boolean }) => t.done).length;
      const todosTotal = todos.length;

      setWeekData({
        sleepByDay,
        coffeeByDay,
        days,
        emotions,
        exerciseCount,
        exerciseList,
        recommendTotal,
        recommendDone,
        recommendItems: allRecItems,
        avgSleep: validSleep.length > 0 ? Math.round((validSleep.reduce((a, b) => a + b, 0) / validSleep.length) * 10) / 10 : 0,
        avgCondition: validCondition.length > 0 ? Math.round((validCondition.reduce((a, b) => a + b, 0) / validCondition.length) * 10) / 10 : 0,
        avgCoffee: validCoffee.length > 0 ? Math.round((validCoffee.reduce((a, b) => a + b, 0) / validCoffee.length) * 10) / 10 : 0,
        todosDone,
        todosTotal,
        report: "", // 아래에서 생성
      });

      // 주간 리포트 문장 생성
      const avgS = validSleep.length > 0 ? Math.round((validSleep.reduce((a, b) => a + b, 0) / validSleep.length) * 10) / 10 : 0;
      const avgC = validCondition.length > 0 ? Math.round((validCondition.reduce((a, b) => a + b, 0) / validCondition.length) * 10) / 10 : 0;
      const recordedDays = days.filter((d) => d.sleep !== null || d.condition !== null || d.exercise || d.emotion).length;
      const sleepOver7 = validSleep.filter((s) => s >= 7).length;
      const minSleep = validSleep.length > 0 ? Math.min(...validSleep) : 0;
      const minSleepDay = minSleep > 0 ? days.find((d) => d.sleep === minSleep)?.dayLabel ?? "" : "";
      const topEmotion = emotions.length > 0 ? emotions.sort((a, b) => emotions.filter((e) => e === b).length - emotions.filter((e) => e === a).length)[0] : "";
      const recR = recommendTotal > 0 ? Math.round((recommendDone / recommendTotal) * 100) : 0;

      const report: string[] = [];
      report.push(`이번 주는 7일 중 ${recordedDays}일을 기록하셨어요.`);

      if (avgS > 0) {
        report.push(`수면은 평균 ${avgS}시간으로, 7시간 이상 주무신 날이 ${sleepOver7}일이었어요.${minSleep < 5 ? ` 특히 ${minSleepDay}은 ${minSleep}시간으로 가장 짧았습니다.` : ""}`);
      }
      if (avgC > 0) {
        report.push(`컨디션은 평균 ${avgC}/5${avgC < 3.5 ? "로 좀 힘든 한 주였네요." : avgC >= 4 ? "로 좋은 상태를 유지하셨어요." : "로 보통 정도였습니다."}`);
      }
      const avgCof = validCoffee.length > 0 ? Math.round((validCoffee.reduce((a, b) => a + b, 0) / validCoffee.length) * 10) / 10 : 0;
      if (avgCof > 0) {
        const totalCof = validCoffee.reduce((a, b) => a + b, 0);
        report.push(`커피는 총 ${totalCof}잔, 하루 평균 ${avgCof}잔이었어요.${avgCof >= 4 ? " 조금 줄여보는 건 어떨까요?" : ""}`);
      }
      if (exerciseCount > 0) {
        report.push(`운동은 이번 주 ${exerciseCount}회 — ${exerciseList.map((e) => e.split(" — ")[1]).join(", ")}을 하셨습니다.`);
      } else {
        report.push("이번 주는 운동 기록이 없었어요. 다음 주에는 가벼운 활동이라도 해보는 건 어떨까요?");
      }
      if (topEmotion) {
        report.push(`감정적으로는 '${topEmotion}'을 가장 많이 느끼셨어요.`);
      }
      if (recR > 0) {
        report.push(`Recommendation 달성률은 ${recR}%였습니다.`);
      }

      setWeekData((prev) => prev ? { ...prev, report: report.join(" ") } : null);
    });
  }, [start, end, weekOffset]);

  if (!weekData) return <div style={{ padding: "40px 28px", fontSize: "0.84rem", color: "#6B7280" }}>불러오는 중...</div>;

  const recRate = weekData.recommendTotal > 0 ? Math.round((weekData.recommendDone / weekData.recommendTotal) * 100) : 0;
  const todoRate = weekData.todosTotal > 0 ? Math.round((weekData.todosDone / weekData.todosTotal) * 100) : 0;
  const maxSleep = 10;

  return (
    <div style={{ padding: "0 28px 24px" }}>

      {/* 주간 타이틀 + 네비게이션 */}
      <div style={{ textAlign: "center", marginTop: "16px", marginBottom: "2px" }}>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "#000" }}>
          {dates[0].getMonth() + 1}월 {Math.ceil(dates[0].getDate() / 7)}번째 주
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "4px" }}>
        <button
          onClick={() => setWeekOffset((prev) => prev - 1)}
          style={{ background: "none", border: "none", fontSize: "1.1rem", cursor: "pointer", padding: "4px 8px", color: "#6B7280" }}
        >
          ←
        </button>
        <span style={{ fontSize: "0.8rem", color: "#6B7280" }}>{weekLabel}</span>
        <button
          onClick={() => setWeekOffset((prev) => prev + 1)}
          style={{ background: "none", border: "none", fontSize: "1.1rem", cursor: "pointer", padding: "4px 8px", color: "#6B7280" }}
        >
          →
        </button>
      </div>

      {/* 달성률 카드 */}
      <div style={{ marginTop: "20px", display: "flex", gap: "8px", marginBottom: "20px" }}>
        <div style={{ flex: 1, padding: "14px", background: "#fafafa", borderRadius: "10px", textAlign: "center" }}>
          <div className="font-heading" style={{ fontSize: "1.6rem", fontWeight: 700, color: "#60A5FA" }}>{recRate}%</div>
          <div style={{ fontSize: "0.7rem", color: "#808080", marginTop: "2px" }}>Recommendation</div>
          <div style={{ fontSize: "0.7rem", color: "#6B7280" }}>{weekData.recommendDone}/{weekData.recommendTotal}</div>
        </div>
        <div style={{ flex: 1, padding: "14px", background: "#fafafa", borderRadius: "10px", textAlign: "center" }}>
          <div className="font-heading" style={{ fontSize: "1.6rem", fontWeight: 700, color: "#60A5FA" }}>{todoRate}%</div>
          <div style={{ fontSize: "0.7rem", color: "#808080", marginTop: "2px" }}>Todo</div>
          <div style={{ fontSize: "0.7rem", color: "#6B7280" }}>{weekData.todosDone}/{weekData.todosTotal}</div>
        </div>
      </div>

      {/* 수면 바 차트 */}
      <SectionLabel label="Sleep" />
      <div style={{ position: "relative" }}>
        {/* 7시간 기준선 */}
        <div style={{
          position: "absolute",
          bottom: `${(7 / maxSleep) * 100}%`,
          left: 0,
          right: 0,
          borderTop: "1.5px dashed #d1d5db",
          zIndex: 1,
          pointerEvents: "none",
        }}>
          <span style={{ position: "absolute", right: "-28px", top: "-8px", fontSize: "0.6rem", color: "#9CA3AF" }}>7h</span>
        </div>
        <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "80px", marginBottom: "4px", paddingRight: "28px" }}>
          {weekData.sleepByDay.map((sleep, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
              {sleep !== null ? (
                <div style={{
                  width: "100%",
                  height: `${(sleep / maxSleep) * 100}%`,
                  background: sleep >= 7 ? "#60A5FA" : "#E6E6E6",
                  borderRadius: "4px 4px 0 0",
                  minHeight: "4px",
                  position: "relative",
                }}>
                  <span style={{ position: "absolute", top: "-16px", left: "50%", transform: "translateX(-50%)", fontSize: "0.7rem", color: "#808080" }}>
                    {sleep}
                  </span>
                </div>
              ) : (
                <div style={{ width: "100%", height: "4px", background: "#e6e6e6", borderRadius: "2px" }} />
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
        {dates.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", fontSize: "0.5rem", color: "#6B7280" }}>{dayLabels[d.getDay()]}</div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "0.7rem", color: "#6B7280" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#60A5FA" }} />7h+
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "0.7rem", color: "#6B7280" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#E6E6E6" }} />미달
        </span>
      </div>

      {/* 커피 바 차트 */}
      <SectionLabel label="Coffee" />
      {weekData.coffeeByDay.some((c) => c !== null && c > 0) ? (
        <>
          <div style={{ position: "relative" }}>
            {/* 2잔 기준선 */}
            <div style={{
              position: "absolute",
              bottom: `${(2 / 6) * 100}%`,
              left: 0,
              right: 0,
              borderTop: "1.5px dashed #d1d5db",
              zIndex: 1,
              pointerEvents: "none",
            }}>
              <span style={{ position: "absolute", right: "-28px", top: "-8px", fontSize: "0.6rem", color: "#9CA3AF" }}>2잔</span>
            </div>
            <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "60px", marginBottom: "4px", paddingRight: "28px" }}>
              {weekData.coffeeByDay.map((coffee, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                  {coffee !== null && coffee > 0 ? (
                    <div style={{
                      width: "100%",
                      height: `${(coffee / 6) * 100}%`,
                      background: coffee >= 4 ? "#F59E0B" : "#A78BFA",
                      borderRadius: "4px 4px 0 0",
                      minHeight: "4px",
                      position: "relative",
                    }}>
                      <span style={{ position: "absolute", top: "-16px", left: "50%", transform: "translateX(-50%)", fontSize: "0.7rem", color: "#808080" }}>
                        {coffee}
                      </span>
                    </div>
                  ) : (
                    <div style={{ width: "100%", height: "4px", background: "#e6e6e6", borderRadius: "2px" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
            {dates.map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center", fontSize: "0.5rem", color: "#6B7280" }}>{dayLabels[d.getDay()]}</div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "0.7rem", color: "#6B7280" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#A78BFA" }} />3잔 이하
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "0.7rem", color: "#6B7280" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F59E0B" }} />4잔+
            </span>
            <span style={{ fontSize: "0.7rem", color: "#6B7280" }}>평균 {weekData.avgCoffee}잔</span>
          </div>
        </>
      ) : (
        <div style={{ fontSize: "0.78rem", color: "#6B7280" }}>기록 없음</div>
      )}

      {/* 감정 흐름 */}
      <SectionLabel label="Emotion" />
      {weekData.emotions.length > 0 ? (
        <>
          {/* 컬러 비율 바 (Option C) */}
          <div style={{ display: "flex", height: "12px", borderRadius: "6px", overflow: "hidden", marginBottom: "8px" }}>
            {(() => {
              const counts: Record<string, number> = {};
              weekData.emotions.forEach((e) => { counts[e] = (counts[e] ?? 0) + 1; });
              const total = weekData.emotions.length;
              return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([emotion, count]) => (
                <div key={emotion} style={{ width: `${(count / total) * 100}%`, background: getEmotionColor(emotion), minWidth: "4px" }} />
              ));
            })()}
          </div>
          {/* 범례 */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {(() => {
              const counts: Record<string, number> = {};
              weekData.emotions.forEach((e) => { counts[e] = (counts[e] ?? 0) + 1; });
              const total = weekData.emotions.length;
              return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([emotion, count]) => (
                <span key={emotion} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.68rem", color: "#333" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: getEmotionColor(emotion), flexShrink: 0 }} />
                  {emotion} {Math.round((count / total) * 100)}%
                </span>
              ));
            })()}
          </div>
        </>
      ) : (
        <div style={{ fontSize: "0.78rem", color: "#6B7280" }}>기록 없음</div>
      )}

      {/* 주간 요약 카드 */}
      <div style={{ marginTop: "24px", padding: "16px", background: "#fafafa", borderRadius: "10px", marginBottom: "8px" }}>
        <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "10px" }}>이번 주 요약</div>
        <div style={{ fontSize: "0.78rem", color: "#333", lineHeight: 1.7 }}>
          평균 수면 <strong>{weekData.avgSleep || "—"}시간</strong> · 평균 컨디션 <strong>{weekData.avgCondition || "—"}/5</strong> · 운동 <strong>{weekData.exerciseCount}회</strong>
        </div>
      </div>

      {/* 일별 상세 */}
      <SectionLabel label="Daily Details" />
      {weekData.days.map((day) => {
        const hasData = day.sleep !== null || day.condition !== null || day.exercise || day.emotion;
        if (!hasData) return null;
        return (
          <div key={day.date} style={{ marginBottom: "8px", padding: "10px 12px", background: "#fafafa", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#000", marginBottom: "4px" }}>
              {day.dayLabel} ({day.date.slice(5)})
            </div>
            <div style={{ fontSize: "0.72rem", color: "#808080", lineHeight: 1.6 }}>
              {day.sleep !== null && <span>수면 {day.sleep}h · </span>}
              {day.condition !== null && <span>컨디션 {day.condition}/5 · </span>}
              {day.exercise && <span>{day.exercise} · </span>}
              {day.emotion && <span>감정: {day.emotion}</span>}
            </div>
          </div>
        );
      })}

      {/* 운동 목록 */}
      {weekData.exerciseList.length > 0 && (
        <>
          <SectionLabel label="Exercise Log" />
          {weekData.exerciseList.map((ex, i) => (
            <div key={i} style={{ fontSize: "0.78rem", color: "#333", padding: "3px 0", lineHeight: 1.5 }}>• {ex}</div>
          ))}
        </>
      )}

      {/* Recommendation 세부 */}
      {weekData.recommendItems.length > 0 && (
        <>
          <SectionLabel label="Recommendation Details" />
          {weekData.recommendItems.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "3px 0" }}>
              <span style={{
                marginTop: "3px", width: "12px", height: "12px", borderRadius: "50%", flexShrink: 0,
                background: item.done ? "#60A5FA" : "transparent",
                border: item.done ? "none" : "1.5px solid #E6E6E6",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {item.done && <svg width="6" height="5" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </span>
              <span style={{
                fontSize: "0.75rem",
                color: item.done ? "#6B7280" : "#333",
                textDecoration: item.done ? "line-through" : "none",
                lineHeight: 1.5,
              }}>{item.text}</span>
            </div>
          ))}
        </>
      )}

      {/* Todo 상태 */}
      <SectionLabel label="Todo" />
      <div style={{ fontSize: "0.78rem", color: "#333", lineHeight: 1.6 }}>
        전체 {weekData.todosTotal}건 중 <strong>{weekData.todosDone}건 완료</strong> ({todoRate}%)
      </div>

      {/* 주간 리포트 */}
      <SectionLabel label="Weekly Report" />
      <div style={{ padding: "14px", background: "#fafafa", borderRadius: "10px", fontSize: "0.82rem", color: "#333", lineHeight: 1.8, marginBottom: "20px" }}>
        {weekData.report}
      </div>

      {/* 주간 회고 */}
      <SectionLabel label="Weekly Retrospective" />
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "0.72rem", color: "#808080", marginBottom: "4px" }}>다음 주 다짐</div>
        <input type="text" value={nextWeek} onChange={(e) => setNextWeek(e.target.value)}
          placeholder="다음 주에는..."
          style={{ width: "100%", fontSize: "16px", color: "#333", background: "#f8f8f8", border: "1px solid #e6e6e6", borderRadius: "6px", padding: "8px 10px", outline: "none", fontFamily: "inherit" }} />
      </div>
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "0.72rem", color: "#808080", marginBottom: "4px" }}>한줄 소감</div>
        <input type="text" value={oneLine} onChange={(e) => setOneLine(e.target.value)}
          placeholder="이번 주를 한 마디로..."
          style={{ width: "100%", fontSize: "16px", color: "#333", background: "#f8f8f8", border: "1px solid #e6e6e6", borderRadius: "6px", padding: "8px 10px", outline: "none", fontFamily: "inherit" }} />
      </div>
      <button
        onClick={async () => {
          await upsertWeeklyReview(yearWeek, { next_week: nextWeek, one_line: oneLine });
          setReviewSaved(true);
          setTimeout(() => setReviewSaved(false), 2000);
        }}
        style={{ width: "100%", padding: "12px", fontSize: "0.85rem", fontWeight: 600, color: "#fff", background: reviewSaved ? "#60A5FA" : "#000", border: "none", borderRadius: "10px", cursor: "pointer", transition: "background 0.3s" }}
      >
        {reviewSaved ? "저장 완료" : "회고 저장"}
      </button>
    </div>
  );
}
