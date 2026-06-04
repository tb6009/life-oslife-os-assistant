"use client";

import { useState, useEffect, useCallback } from "react";
import { getHealthLogs, getJournalEntries, getRecommendationLogs, getRoutines, getRoutineLogsByRange, getMonthlyReview, upsertMonthlyReview } from "@/lib/supabase/api";
import { getEmotionColor } from "@/lib/theme/emotions";

const weekDayHeaders = ["일", "월", "화", "수", "목", "금", "토"];

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function MonthTab() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

  const days = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0=일
  const start = toDateStr(viewYear, viewMonth, 1);
  const end = toDateStr(viewYear, viewMonth, days);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1;

  const [sleepData, setSleepData] = useState<(number | null)[]>([]);
  const [coffeeData, setCoffeeData] = useState<(number | null)[]>([]);
  const [conditionData, setConditionData] = useState<(number | null)[]>([]);
  const [emotionCounts, setEmotionCounts] = useState<Record<string, number>>({});
  const [exerciseCount, setExerciseCount] = useState(0);
  const [recRates, setRecRates] = useState<(number | null)[]>([]);
  const [recordedDays, setRecordedDays] = useState<Set<number>>(new Set());
  const [avgSleep, setAvgSleep] = useState(0);
  const [avgCondition, setAvgCondition] = useState(0);
  const [routineStats, setRoutineStats] = useState<Array<{ title: string; doneDays: number; totalDays: number }>>([]);
  const [emotionByDay, setEmotionByDay] = useState<(string | null)[]>([]);
  const [monthReport, setMonthReport] = useState("");
  const [memorable, setMemorable] = useState("");
  const [nextGoal, setNextGoal] = useState("");
  const [noteToSelf, setNoteToSelf] = useState("");
  const [reviewSaved, setReviewSaved] = useState(false);
  const [topEmotion, setTopEmotion] = useState("—");

  const loadData = useCallback(() => {
    Promise.all([
      getHealthLogs(start, end),
      getJournalEntries(start, end),
      getRecommendationLogs(start, end),
      getRoutines(),
      getRoutineLogsByRange(start, end),
    ]).then(([healthLogs, journals, recLogs, routines, routineLogs]) => {
      const sleep: (number | null)[] = [];
      const coffee: (number | null)[] = [];
      const condition: (number | null)[] = [];
      const rates: (number | null)[] = [];
      const emotions: Record<string, number> = {};
      const emotionsDaily: (string | null)[] = [];
      const recorded = new Set<number>();
      let exCount = 0;

      for (let d = 1; d <= days; d++) {
        const ds = toDateStr(viewYear, viewMonth, d);
        const h = healthLogs.find((l: { date: string }) => l.date === ds);
        sleep.push(h?.sleep_hours ?? null);
        coffee.push(h?.coffee ?? null);
        condition.push(h?.condition ?? null);
        if (h?.exercise) exCount++;
        if (h) recorded.add(d);

        const j = journals.find((l: { date: string }) => l.date === ds);
        emotionsDaily.push(j?.emotion ?? null);
        if (j?.emotion) {
          emotions[j.emotion] = (emotions[j.emotion] ?? 0) + 1;
          recorded.add(d);
        }

        const r = recLogs.find((l: { date: string }) => l.date === ds);
        rates.push(r && r.total > 0 ? Math.round((r.done / r.total) * 100) : null);
      }

      setSleepData(sleep);
      setCoffeeData(coffee);
      setEmotionByDay(emotionsDaily);
      setConditionData(condition);
      setEmotionCounts(emotions);
      setExerciseCount(exCount);
      setRecRates(rates);
      setRecordedDays(recorded);

      const validSleep = sleep.filter((s): s is number => s !== null);
      const validCond = condition.filter((c): c is number => c !== null);
      setAvgSleep(validSleep.length > 0 ? Math.round((validSleep.reduce((a, b) => a + b, 0) / validSleep.length) * 10) / 10 : 0);
      setAvgCondition(validCond.length > 0 ? Math.round((validCond.reduce((a, b) => a + b, 0) / validCond.length) * 10) / 10 : 0);

      const sorted = Object.entries(emotions).sort((a, b) => b[1] - a[1]);
      setTopEmotion(sorted.length > 0 ? sorted[0][0] : "—");

      // 루틴 통계
      const rStats: Array<{ title: string; doneDays: number; totalDays: number }> = [];
      for (const r of routines) {
        const logs = routineLogs.filter((l: { routine_id: number }) => l.routine_id === r.id);
        const doneDays = logs.filter((l: { done: boolean }) => l.done).length;
        rStats.push({ title: r.title, doneDays, totalDays: isCurrentMonth ? now.getDate() : days });
      }
      setRoutineStats(rStats);

      // 월간 리포트 생성
      const reportParts: string[] = [];
      const totalRecorded = recorded.size;
      const activeDays = isCurrentMonth ? now.getDate() : days;

      reportParts.push(`${viewMonth}월은 ${activeDays}일 중 ${totalRecorded}일을 기록하셨어요.`);

      if (validSleep.length > 0) {
        const aS = Math.round((validSleep.reduce((a, b) => a + b, 0) / validSleep.length) * 10) / 10;
        const over7 = validSleep.filter((s) => s >= 7).length;
        reportParts.push(`건강 면에서 평균 수면 ${aS}시간, 7시간 이상 주무신 날이 ${over7}일이었어요.`);
      }
      if (validCond.length > 0) {
        const aC = Math.round((validCond.reduce((a, b) => a + b, 0) / validCond.length) * 10) / 10;
        reportParts.push(`컨디션은 평균 ${aC}/5${aC >= 4 ? "로 좋은 상태를 유지하셨어요." : aC < 3 ? "로 좀 힘든 한 달이었네요." : "였습니다."}`);
      }
      reportParts.push(`운동은 총 ${exCount}회${exCount > 0 ? "를 하셨습니다." : "로, 다음 달에는 조금 더 움직여보는 건 어떨까요?"}`);

      if (sorted.length > 0) {
        const top3 = sorted.slice(0, 3).map(([e, c]) => `'${e}'(${c}일)`).join(", ");
        reportParts.push(`감정적으로는 ${top3} 순이었습니다.`);
      }

      if (rStats.length > 0) {
        const best = rStats.sort((a, b) => (b.doneDays / b.totalDays) - (a.doneDays / a.totalDays))[0];
        const worst = rStats.sort((a, b) => (a.doneDays / a.totalDays) - (b.doneDays / b.totalDays))[0];
        const bestRate = Math.round((best.doneDays / best.totalDays) * 100);
        const worstRate = Math.round((worst.doneDays / worst.totalDays) * 100);
        reportParts.push(`루틴에서는 ${best.title}이 ${bestRate}%로 가장 잘 지키셨고, ${worst.title}은 ${worstRate}%로 가장 아쉬웠습니다.`);
      }

      setMonthReport(reportParts.join(" "));

      // 회고 로드
      const ym = `${viewYear}-${String(viewMonth).padStart(2, "0")}`;
      getMonthlyReview(ym).then((d) => {
        if (d) {
          setMemorable(d.memorable ?? "");
          setNextGoal(d.next_goal ?? "");
          setNoteToSelf(d.note_to_self ?? "");
        } else {
          setMemorable(""); setNextGoal(""); setNoteToSelf("");
        }
      });
    });
  }, [start, end, days, viewYear, viewMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  function navigateMonth(dir: number) {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setViewYear(y);
    setViewMonth(m);
  }

  const [selectedBar, setSelectedBar] = useState<{ type: string; index: number } | null>(null);

  const maxSleep = 10;
  const maxCondition = 5;

  return (
    <div style={{ padding: "0 28px 24px" }}>

      {/* 월 네비게이션 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", marginBottom: "12px" }}>
        <button onClick={() => navigateMonth(-1)} style={{ color: "#6B7280", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: "4px 8px" }}>&larr;</button>
        <div className="font-heading" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#000" }}>
          {viewYear}년 {viewMonth}월
        </div>
        <button onClick={() => navigateMonth(1)} style={{ color: "#6B7280", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: "4px 8px" }}>&rarr;</button>
      </div>

      {/* 요일 헤더 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "2px" }}>
        {weekDayHeaders.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: "0.72rem", color: "#6B7280", fontWeight: 500, padding: "4px 0" }}>
            {d}
          </div>
        ))}
      </div>

      {/* 히트맵 캘린더 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "20px" }}>
        {/* 빈 칸 (1일 시작 요일까지) */}
        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: days }, (_, i) => {
          const day = i + 1;
          const ds = toDateStr(viewYear, viewMonth, day);
          const isRecorded = recordedDays.has(day);
          const isToday = ds === todayStr;
          const isFuture = isCurrentMonth && day > now.getDate();
          return (
            <div
              key={day}
              style={{
                padding: "6px 0",
                borderRadius: "4px",
                background: isFuture ? "#fafafa" : isRecorded ? "#60A5FA" : "#f0f0f0",
                opacity: isFuture ? 0.3 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.82rem",
                fontWeight: isToday ? 700 : 400,
                color: isRecorded ? "#fff" : isToday ? "#60A5FA" : "#808080",
                border: isToday ? "2px solid #60A5FA" : "none",
              }}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* 수면 30일 바 차트 */}
      <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "24px", marginBottom: "4px" }}>
        Sleep — {days} Days
      </div>
      {selectedBar?.type === "sleep" && sleepData[selectedBar.index] !== null && (
        <div style={{ fontSize: "0.72rem", color: "#60A5FA", marginBottom: "4px", fontWeight: 600 }}>
          {selectedBar.index + 1}일 — {sleepData[selectedBar.index]}시간
        </div>
      )}
      <div style={{ height: "60px", display: "flex", alignItems: "flex-end", gap: "1px", marginBottom: "20px" }}>
        {sleepData.map((s, i) => (
          <div key={i}
            onMouseEnter={() => s !== null ? setSelectedBar({ type: "sleep", index: i }) : null}
            onMouseLeave={() => setSelectedBar(null)}
            onTouchStart={() => s !== null ? setSelectedBar({ type: "sleep", index: i }) : null}
            style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-end", height: "100%", cursor: s !== null ? "pointer" : "default" }}>
            <div style={{
              width: "100%",
              height: s !== null ? `${(s / maxSleep) * 100}%` : "0%",
              background: s !== null ? (selectedBar?.type === "sleep" && selectedBar.index === i ? "#3B82F6" : (s >= 7 ? "#60A5FA" : "#E6E6E6")) : "transparent",
              borderRadius: "2px 2px 0 0",
              minHeight: s !== null ? "2px" : "0",
              transition: "background 0.15s",
            }} />
          </div>
        ))}
      </div>

      {/* 컨디션 30일 */}
      <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "24px", marginBottom: "4px" }}>
        Condition — {days} Days
      </div>
      {selectedBar?.type === "condition" && conditionData[selectedBar.index] !== null && (
        <div style={{ fontSize: "0.72rem", color: "#60A5FA", marginBottom: "4px", fontWeight: 600 }}>
          {selectedBar.index + 1}일 — {conditionData[selectedBar.index]}/5
        </div>
      )}
      <div style={{ height: "40px", display: "flex", alignItems: "flex-end", gap: "1px", marginBottom: "20px" }}>
        {conditionData.map((c, i) => (
          <div key={i}
            onMouseEnter={() => c !== null ? setSelectedBar({ type: "condition", index: i }) : null}
            onMouseLeave={() => setSelectedBar(null)}
            onTouchStart={() => c !== null ? setSelectedBar({ type: "condition", index: i }) : null}
            style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-end", height: "100%", cursor: c !== null ? "pointer" : "default" }}>
            <div style={{
              width: "100%",
              height: c !== null ? `${(c / maxCondition) * 100}%` : "0%",
              background: c !== null ? (selectedBar?.type === "condition" && selectedBar.index === i ? "#3B82F6" : (c >= 4 ? "#60A5FA" : "#E6E6E6")) : "transparent",
              borderRadius: "2px 2px 0 0",
              minHeight: c !== null ? "2px" : "0",
              transition: "background 0.15s",
            }} />
          </div>
        ))}
      </div>

      {/* 커피 30일 */}
      <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "24px", marginBottom: "4px" }}>
        Coffee — {days} Days
      </div>
      {selectedBar?.type === "coffee" && coffeeData[selectedBar.index] !== null && (
        <div style={{ fontSize: "0.72rem", color: "#A78BFA", marginBottom: "4px", fontWeight: 600 }}>
          {selectedBar.index + 1}일 — {coffeeData[selectedBar.index]}잔
        </div>
      )}
      <div style={{ height: "40px", display: "flex", alignItems: "flex-end", gap: "1px", marginBottom: "4px" }}>
        {coffeeData.map((c, i) => (
          <div key={i}
            onMouseEnter={() => c !== null && c > 0 ? setSelectedBar({ type: "coffee", index: i }) : null}
            onMouseLeave={() => setSelectedBar(null)}
            onTouchStart={() => c !== null && c > 0 ? setSelectedBar({ type: "coffee", index: i }) : null}
            style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-end", height: "100%", cursor: c !== null && c > 0 ? "pointer" : "default" }}>
            <div style={{
              width: "100%",
              height: c !== null && c > 0 ? `${(c / 6) * 100}%` : "0%",
              background: c !== null && c > 0 ? (selectedBar?.type === "coffee" && selectedBar.index === i ? "#7C3AED" : (c >= 4 ? "#F59E0B" : "#A78BFA")) : "transparent",
              borderRadius: "2px 2px 0 0",
              minHeight: c !== null && c > 0 ? "2px" : "0",
              transition: "background 0.15s",
            }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "0.7rem", color: "#6B7280" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#A78BFA" }} />3잔 이하
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "0.7rem", color: "#6B7280" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F59E0B" }} />4잔+
        </span>
      </div>

      {/* 달성률 추세 */}
      <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "24px", marginBottom: "4px" }}>
        Recommendation — {days} Days
      </div>
      {selectedBar?.type === "rec" && recRates[selectedBar.index] !== null && (
        <div style={{ fontSize: "0.72rem", color: "#60A5FA", marginBottom: "4px", fontWeight: 600 }}>
          {selectedBar.index + 1}일 — {recRates[selectedBar.index]}%
        </div>
      )}
      <div style={{ height: "40px", display: "flex", alignItems: "flex-end", gap: "1px", marginBottom: "20px" }}>
        {recRates.map((r, i) => (
          <div key={i}
            onMouseEnter={() => r !== null ? setSelectedBar({ type: "rec", index: i }) : null}
            onMouseLeave={() => setSelectedBar(null)}
            onTouchStart={() => r !== null ? setSelectedBar({ type: "rec", index: i }) : null}
            style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-end", height: "100%", cursor: r !== null ? "pointer" : "default" }}>
            <div style={{
              width: "100%",
              height: r !== null ? `${r}%` : "0%",
              background: r !== null ? (selectedBar?.type === "rec" && selectedBar.index === i ? "#3B82F6" : `rgba(96,165,250,${Math.max(0.2, r / 100)})`) : "transparent",
              borderRadius: "2px 2px 0 0",
              minHeight: r !== null ? "2px" : "0",
              transition: "background 0.15s",
            }} />
          </div>
        ))}
      </div>

      {/* 감정 흐름 — 컬러 스트립 (Option A) */}
      <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "24px", marginBottom: "4px" }}>
        Emotion Flow — {days} Days
      </div>
      {emotionByDay.some((e) => e !== null) ? (
        <>
          <div style={{ display: "flex", height: "14px", borderRadius: "7px", overflow: "hidden", marginBottom: "8px", gap: "1px" }}>
            {emotionByDay.map((emotion, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: emotion ? getEmotionColor(emotion) : "#f0f0f0",
                  minWidth: "2px",
                }}
                title={emotion ? `${i + 1}일: ${emotion}` : `${i + 1}일: 기록 없음`}
              />
            ))}
          </div>
          {/* 범례 */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
            {Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).map(([emotion, count]) => (
              <span key={emotion} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.7rem", color: "#333" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: getEmotionColor(emotion), flexShrink: 0 }} />
                {emotion} ({count})
              </span>
            ))}
          </div>
        </>
      ) : (
        <div style={{ fontSize: "0.78rem", color: "#6B7280", marginBottom: "20px" }}>기록 없음</div>
      )}

      {/* 루틴 달성률 */}
      {routineStats.length > 0 && (
        <>
          <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "24px", marginBottom: "4px" }}>
            Routine
          </div>
          {routineStats.map((r, i) => {
            const rate = r.totalDays > 0 ? Math.round((r.doneDays / r.totalDays) * 100) : 0;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ flex: 1, fontSize: "0.75rem", color: "#333" }}>{r.title}</span>
                <span style={{ fontSize: "0.68rem", color: "#60A5FA", fontWeight: 600 }}>{r.doneDays}/{r.totalDays}일</span>
                <div style={{ width: "50px", height: "4px", background: "#E6E6E6", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ width: `${rate}%`, height: "100%", background: "#60A5FA", borderRadius: "2px" }} />
                </div>
              </div>
            );
          })}
          <div style={{ height: "20px" }} />
        </>
      )}

      {/* 월간 요약 */}
      <div style={{
        padding: "16px",
        background: "#fafafa",
        borderRadius: "10px",
        fontSize: "0.82rem",
        color: "#333",
        lineHeight: 1.8,
      }}>
        <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "10px" }}>{viewMonth}월 요약</div>

        <div style={{ marginBottom: "8px" }}>
          <strong>건강</strong><br />
          평균 수면 {avgSleep || "—"}시간 · 평균 컨디션 {avgCondition || "—"}/5 · 운동 {exerciseCount}회 · 커피 평균 {(() => { const valid = coffeeData.filter((c): c is number => c !== null); return valid.length > 0 ? (Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10) : "—"; })()}잔
        </div>

        <div style={{ marginBottom: "8px" }}>
          <strong>감정</strong><br />
          가장 많은 감정: {topEmotion} · 기록한 날: {recordedDays.size}일
        </div>

        {routineStats.length > 0 && (
          <div style={{ marginBottom: "8px" }}>
            <strong>루틴</strong><br />
            {routineStats.map((r, i) => {
              const rate = r.totalDays > 0 ? Math.round((r.doneDays / r.totalDays) * 100) : 0;
              return <span key={i}>{r.title} {rate}%{i < routineStats.length - 1 ? " · " : ""}</span>;
            })}
          </div>
        )}

        <div>
          <strong>활동</strong><br />
          기록 {recordedDays.size}일 / {isCurrentMonth ? now.getDate() : days}일
        </div>
      </div>

      {/* 월간 리포트 */}
      <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "24px", marginBottom: "4px" }}>
        Monthly Report
      </div>
      <div style={{ padding: "14px", background: "#fafafa", borderRadius: "10px", fontSize: "0.82rem", color: "#333", lineHeight: 1.8, marginBottom: "20px" }}>
        {monthReport || "데이터가 쌓이면 리포트가 생성됩니다."}
      </div>

      {/* 월간 회고 */}
      <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "24px", marginBottom: "4px" }}>
        Monthly Retrospective
      </div>
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "0.72rem", color: "#808080", marginBottom: "4px" }}>가장 기억에 남는 순간</div>
        <input type="text" value={memorable} onChange={(e) => setMemorable(e.target.value)} placeholder="이번 달 가장 인상 깊었던..."
          style={{ width: "100%", fontSize: "16px", color: "#333", background: "#f8f8f8", border: "1px solid #e6e6e6", borderRadius: "6px", padding: "8px 10px", outline: "none", fontFamily: "inherit" }} />
      </div>
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "0.72rem", color: "#808080", marginBottom: "4px" }}>다음 달 목표</div>
        <input type="text" value={nextGoal} onChange={(e) => setNextGoal(e.target.value)} placeholder="다음 달에는..."
          style={{ width: "100%", fontSize: "16px", color: "#333", background: "#f8f8f8", border: "1px solid #e6e6e6", borderRadius: "6px", padding: "8px 10px", outline: "none", fontFamily: "inherit" }} />
      </div>
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "0.72rem", color: "#808080", marginBottom: "4px" }}>나에게 한 마디</div>
        <input type="text" value={noteToSelf} onChange={(e) => setNoteToSelf(e.target.value)} placeholder="이번 달의 나에게..."
          style={{ width: "100%", fontSize: "16px", color: "#333", background: "#f8f8f8", border: "1px solid #e6e6e6", borderRadius: "6px", padding: "8px 10px", outline: "none", fontFamily: "inherit" }} />
      </div>
      <button
        onClick={async () => {
          const ym = `${viewYear}-${String(viewMonth).padStart(2, "0")}`;
          await upsertMonthlyReview(ym, { memorable, next_goal: nextGoal, note_to_self: noteToSelf });
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
