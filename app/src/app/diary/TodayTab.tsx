"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getHealthLog, getJournalEntry, getSchedules, getChatMessages, upsertHealthLog, upsertJournalEntry, getRoutines, getRoutineLogsForDate, getRoutineStreak } from "@/lib/supabase/api";

const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];
const dayLabelsFull = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
import { emotionsByCategory, getEmotionColor, energyLabels, getEnergyColor, formatHour, type EmotionCategory } from "@/lib/theme/emotions";

type CoffeeEntry = { hour: number };
type EmotionEntry = { hour: number; energy: number; emotions: string[]; custom?: string };

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const ITEM_WIDTH = 52;
const TOTAL_DAYS = 61;
const CENTER_INDEX = 30;

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px", marginTop: "24px" }}>
      {label}
    </div>
  );
}

export default function TodayTab() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [centeredIndex, setCenteredIndex] = useState(CENTER_INDEX);
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  // Health input
  const [sleepH, setSleepH] = useState("");
  const [sleepM, setSleepM] = useState("");
  const [conditionVal, setConditionVal] = useState<number | null>(null);
  const [coffeeVal, setCoffeeVal] = useState<number>(0);
  const [coffeeLog, setCoffeeLog] = useState<CoffeeEntry[]>([]);
  const [exerciseVal, setExerciseVal] = useState("");
  const [emotionVal, setEmotionVal] = useState<string | null>(null);
  const [emotionLog, setEmotionLog] = useState<EmotionEntry[]>([]);

  // 새 감정 입력 폼 상태
  const [energyDraft, setEnergyDraft] = useState<number>(0);
  const [emotionsDraft, setEmotionsDraft] = useState<string[]>([]);
  const [customDraft, setCustomDraft] = useState<string>("");
  const [emotionTab, setEmotionTab] = useState<EmotionCategory>("positive");

  // Memo & Daily Review
  const [saved, setSaved] = useState(false);
  const [memoVal, setMemoVal] = useState("");
  const [gratefulVal, setGratefulVal] = useState("");
  const [doneTodayVal, setDoneTodayVal] = useState("");
  const [notDoneTodayVal, setNotDoneTodayVal] = useState("");
  const [wantTomorrowVal, setWantTomorrowVal] = useState("");
  const [noteToSelfVal, setNoteToSelfVal] = useState("");

  // Conversation
  const [chatTopics, setChatTopics] = useState<string[]>([]);
  const [chatCount, setChatCount] = useState(0);

  // Routine
  const [routineItems, setRoutineItems] = useState<Array<{ title: string; done: boolean; streak: number }>>([]);

  // Data
  const [health, setHealth] = useState<{ sleep_hours?: number; condition?: number; exercise?: string; coffee?: number } | null>(null);
  const [schedules, setSchedules] = useState<Array<{ title: string; time: string | null }>>([]);
  const [tomorrowSchedules, setTomorrowSchedules] = useState<Array<{ title: string; time: string | null }>>([]);
  const [dayAfterSchedules, setDayAfterSchedules] = useState<Array<{ title: string; time: string | null }>>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  // 상수는 컴포넌트 밖으로 이동됨

  // 61일 날짜 배열 생성 (오늘 기준 -30 ~ +30)
  const [allDates] = useState(() => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = -30; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  });

  // 초기 스크롤 위치 (오늘을 가운데로)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = CENTER_INDEX * ITEM_WIDTH;
    }
  }, []);

  // 스크롤 중 + 멈추면 가운데 날짜 선택
  const scrollTimer = useRef<NodeJS.Timeout | null>(null);
  function handleScroll() {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const index = Math.round(scrollLeft / ITEM_WIDTH);
    const clampedIndex = Math.max(0, Math.min(TOTAL_DAYS - 1, index));

    // 즉시 시각적 반영 (흰색 텍스트)
    setCenteredIndex(clampedIndex);

    // 스크롤 멈추면 데이터 로드
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      if (allDates[clampedIndex]) {
        setSelectedDate(new Date(allDates[clampedIndex]));
        loadData(allDates[clampedIndex]);
      }
    }, 150);
  }

  function scrollToDate(date: Date) {
    const idx = allDates.findIndex((d) => toDateStr(d) === toDateStr(date));
    if (idx >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ left: idx * ITEM_WIDTH, behavior: "smooth" });
      setCenteredIndex(idx);
    }
    setSelectedDate(date);
  }

  // 데이터 로드
  const loadData = useCallback((date: Date) => {
    const dateStr = toDateStr(date);
    const tomorrow = new Date(date); tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(date); dayAfter.setDate(dayAfter.getDate() + 2);

    getHealthLog(dateStr).then((d) => {
      setHealth(d);
      if (d) {
        if (d.sleep_hours) {
          setSleepH(String(Math.floor(d.sleep_hours)));
          const m = Math.round((d.sleep_hours % 1) * 60);
          setSleepM(m > 0 ? String(m) : "");
        } else { setSleepH(""); setSleepM(""); }
        setConditionVal(d.condition ?? null);
        setCoffeeVal(d.coffee ?? 0);
        setCoffeeLog(Array.isArray(d.coffee_log) ? d.coffee_log : []);
        setExerciseVal(d.exercise ?? "");
      } else {
        setSleepH(""); setSleepM(""); setConditionVal(null); setCoffeeVal(0); setCoffeeLog([]); setExerciseVal("");
      }
    });
    getJournalEntry(dateStr).then((d) => {
      setEmotionVal(d?.emotion ?? null);
      setEmotionLog(Array.isArray(d?.emotion_log) ? d.emotion_log : []);
      setMemoVal(d?.memo ?? "");
      setGratefulVal(d?.grateful ?? "");
      setDoneTodayVal(d?.done_today ?? "");
      setNotDoneTodayVal(d?.not_done_today ?? "");
      setWantTomorrowVal(d?.want_tomorrow ?? "");
      setNoteToSelfVal(d?.note_to_self ?? "");
    });
    getSchedules(dateStr).then((d) => setSchedules(d));

    // 루틴 상태 로드
    Promise.all([getRoutines(), getRoutineLogsForDate(dateStr)]).then(async ([routines, logs]) => {
      const items: Array<{ title: string; done: boolean; streak: number }> = [];
      for (const r of routines) {
        const log = logs.find((l: { routine_id: number }) => l.routine_id === r.id);
        const done = log?.done ?? false;
        const streak = await getRoutineStreak(r.id, dateStr);
        items.push({ title: r.title, done, streak });
      }
      setRoutineItems(items);
    });
    // 하루 대화 — 대화 블록을 분석하여 주제별 요약
    getChatMessages("momi", dateStr).then((chats) => {
      const userMsgs = chats.filter((m: { role: string }) => m.role === "user");
      setChatCount(userMsgs.length);

      const skipWords = ["응", "네", "해줘", "정리해줘", "그래", "오키", "오케이", "좋아", "ㅇㅇ", "ㅇㅋ", "감사", "고마워", "알겠어", "맞아", "그렇지", "해봐", "알려줘"];
      const allMsgs = chats as Array<{ role: string; message: string }>;

      // 주제 키워드 맵
      const topicMap: Record<string, string> = {
        "출판": "출판", "책": "출판", "글": "글쓰기", "원고": "글쓰기",
        "논문": "연구", "연구": "연구", "데이터": "연구", "질적": "연구",
        "수업": "수업", "강의": "수업", "아고라": "수업", "세미나": "수업",
        "피곤": "컨디션", "수면": "수면", "잠": "수면", "잤": "수면",
        "운동": "운동", "조깅": "운동", "인라인": "운동", "스트레칭": "운동",
        "막막": "감정", "힘들": "감정", "불안": "감정", "기분": "감정",
        "일정": "일정", "스케줄": "일정", "미팅": "일정", "회의": "일정",
        "비즈니스": "비즈니스", "전략": "비즈니스", "마케팅": "비즈니스",
        "코칭": "코칭", "프로젝트": "프로젝트", "앱": "프로젝트",
      };

      // 대화 전체에서 주제별로 묶기
      const topicBlocks: Record<string, { userTexts: string[]; assistantTexts: string[] }> = {};

      let lastTopic = "기타";
      for (const msg of allMsgs) {
        const text = msg.message.trim().replace(/\*\*/g, "").replace(/【.*?】/g, "").replace(/\(.*?\)/g, "");

        // 주제 감지
        for (const [keyword, topic] of Object.entries(topicMap)) {
          if (text.includes(keyword)) { lastTopic = topic; break; }
        }

        if (!topicBlocks[lastTopic]) {
          topicBlocks[lastTopic] = { userTexts: [], assistantTexts: [] };
        }

        if (msg.role === "user") {
          const clean = text.trim();
          if (clean.length >= 8 && !skipWords.some((w) => clean === w || clean === w + "요")) {
            topicBlocks[lastTopic].userTexts.push(clean);
          }
        } else {
          topicBlocks[lastTopic].assistantTexts.push(text);
        }
      }

      // 각 주제를 한 문장으로 요약
      const summaries: string[] = [];
      for (const [topic, block] of Object.entries(topicBlocks)) {
        if (block.userTexts.length === 0) continue;

        // 하루 답변에서 실질적 내용 추출 (상투어 제외)
        const skipPhrases = ["듣고 있어요", "편하게", "궁금해요", "말씀해주세요", "어떠세요", "어때요"];
        let actionTaken = "";
        for (const aText of block.assistantTexts) {
          const sentences = aText.split(/[.\n!?]/).map((s) => s.trim()).filter((s) => s.length > 10);
          for (const sentence of sentences) {
            if (skipPhrases.some((p) => sentence.includes(p))) continue;
            if (sentence.length > 10) {
              actionTaken = sentence.length > 40 ? sentence.slice(0, 40) + "..." : sentence;
              break;
            }
          }
          if (actionTaken) break;
        }

        const userContext = block.userTexts[0].length > 25 ? block.userTexts[0].slice(0, 25) + "..." : block.userTexts[0];

        if (actionTaken) {
          summaries.push(`${topic}에 대해 이야기함 — ${actionTaken}`);
        } else {
          summaries.push(`${topic}에 대해 이야기함 — ${userContext}`);
        }
      }

      setChatTopics(summaries.slice(0, 5));
    });
  }, []);

  useEffect(() => { loadData(selectedDate); }, [selectedDate, loadData]);

  function navigateMonth(dir: number) {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + dir);
    scrollToDate(d);
  }

  // 저장 함수들
  async function saveSleep() {
    const h = parseInt(sleepH) || 0;
    const m = parseInt(sleepM) || 0;
    if (h === 0 && m === 0) return;
    const total = Math.round((h + m / 60) * 10) / 10;
    await upsertHealthLog(toDateStr(selectedDate), { sleep_hours: total });
    setHealth((prev) => ({ ...prev, sleep_hours: total }));
  }

  async function saveCondition(val: number) {
    setConditionVal(val);
    await upsertHealthLog(toDateStr(selectedDate), { condition: val });
    setHealth((prev) => ({ ...prev, condition: val }));
  }

  async function saveExercise() {
    if (!exerciseVal.trim()) return;
    await upsertHealthLog(toDateStr(selectedDate), { exercise: exerciseVal.trim() });
    setHealth((prev) => ({ ...prev, exercise: exerciseVal.trim() }));
  }

  const isToday = toDateStr(selectedDate) === toDateStr(new Date());
  const monthLabel = `${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월`;
  const tomorrow = new Date(selectedDate); tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(selectedDate); dayAfter.setDate(dayAfter.getDate() + 2);

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div style={{ padding: "18px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div className="font-heading" style={{ fontSize: "1.3rem", fontWeight: 700, color: "#000" }}>Diary</div>
        <button onClick={() => scrollToDate(new Date())} className="font-heading" style={{ fontSize: "0.7rem", color: isToday ? "#6B7280" : "#60A5FA", fontWeight: 500, background: "none", border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Today
        </button>
      </div>

      {/* Month nav */}
      <div style={{ padding: "10px 28px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => navigateMonth(-1)} style={{ color: "#6B7280", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: "4px 8px" }}>&larr;</button>
        <div className="font-heading" style={{ fontSize: "0.78rem", fontWeight: 500, color: "#808080" }}>{monthLabel}</div>
        <button onClick={() => navigateMonth(1)} style={{ color: "#6B7280", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: "4px 8px" }}>&rarr;</button>
      </div>

      {/* Calendar strip — 가운데 날짜에 직접 검은 배경 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: "flex",
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          padding: "4px 0 16px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div style={{ minWidth: `calc(50% - ${ITEM_WIDTH / 2}px)`, flexShrink: 0 }} />

        {allDates.map((d, i) => {
          const isCentered = i === centeredIndex;
          const isTodayDate = toDateStr(d) === toDateStr(new Date());
          return (
            <button
              key={toDateStr(d)}
              onClick={() => scrollToDate(d)}
              style={{
                width: `${ITEM_WIDTH}px`,
                minWidth: `${ITEM_WIDTH}px`,
                textAlign: "center",
                padding: "8px 0",
                background: isCentered ? "#000" : "transparent",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                scrollSnapAlign: "center",
              }}
            >
              <div className="font-heading" style={{
                fontSize: "0.5rem",
                color: isCentered ? "#fff" : "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                marginBottom: "4px",
              }}>
                {dayLabels[d.getDay()]}
              </div>
              <div className="font-heading" style={{
                fontSize: "0.85rem",
                fontWeight: isCentered || isTodayDate ? 700 : 500,
                color: isCentered ? "#fff" : isTodayDate ? "#60A5FA" : "#333",
              }}>
                {d.getDate()}
              </div>
              {isTodayDate && !isCentered && (
                <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#60A5FA", margin: "3px auto 0" }} />
              )}
            </button>
          );
        })}

        <div style={{ minWidth: `calc(50% - ${ITEM_WIDTH / 2}px)`, flexShrink: 0 }} />
      </div>

      <style>{`div[style*="scroll-snap-type"]::-webkit-scrollbar { display: none; }`}</style>

      <div style={{ height: "1px", background: "#e6e6e6", margin: "0 28px" }} />

      {/* Content */}
      <div style={{ padding: "0 28px 24px" }}>

        {/* === Schedule 3일 (최상단) === */}
        <SectionLabel label="Schedule" />

        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "1rem", color: "#000", fontWeight: 700, marginBottom: "4px" }}>
            {isToday ? "오늘 " : ""}{selectedDate.getMonth() + 1}/{selectedDate.getDate()} ({dayLabelsFull[selectedDate.getDay()]})
          </div>
          {schedules.length > 0 ? schedules.map((s, i) => (
            <div key={i} style={{ fontSize: "0.82rem", color: "#333", padding: "3px 0", lineHeight: 1.5 }}>
              {s.time && <span className="font-heading" style={{ fontSize: "0.72rem", color: "#6B7280", marginRight: "6px" }}>{s.time}</span>}
              {s.title}
            </div>
          )) : <div style={{ fontSize: "0.78rem", color: "#6B7280" }}>일정 없음</div>}
        </div>

        {/* === Routine === */}
        <SectionLabel label="Routine" />
        {routineItems.length > 0 ? (
          <>
            {routineItems.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0" }}>
                <span style={{
                  width: "14px", height: "14px", borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: r.done ? "#60A5FA" : "transparent",
                  border: r.done ? "none" : "1.5px solid #E6E6E6",
                }}>
                  {r.done && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </span>
                <span style={{ flex: 1, fontSize: "0.78rem", color: r.done ? "#6B7280" : "#333", textDecoration: r.done ? "line-through" : "none" }}>
                  {r.title}
                </span>
                <span style={{ fontSize: "0.7rem", color: r.streak > 0 ? "#60A5FA" : "#6B7280", flexShrink: 0 }}>
                  {r.streak > 0 ? `${r.streak}일째` : ""}
                </span>
              </div>
            ))}

            {/* 연속 기록 요약 */}
            <div style={{ marginTop: "10px", padding: "10px", background: "#fafafa", borderRadius: "8px", fontSize: "0.75rem", color: "#333", lineHeight: 1.6 }}>
              {routineItems.filter((r) => r.streak > 0).map((r, i) => (
                <div key={i}>
                  {r.streak >= 3 ? "🔥 " : ""}<strong>{r.title}</strong> — {r.streak}일째 하고 계십니다
                </div>
              ))}
              {routineItems.filter((r) => !r.done && r.streak === 0).map((r, i) => (
                <div key={i} style={{ color: "#808080" }}>
                  {r.title} — 잊지 않으셨죠?
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ fontSize: "0.78rem", color: "#6B7280" }}>루틴 없음</div>
        )}

        {/* === Health === */}
        <SectionLabel label="Health" />

        {/* 수면 */}
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "0.68rem", color: "#808080", marginBottom: "4px" }}>수면</div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <input type="number" value={sleepH} onChange={(e) => setSleepH(e.target.value)} placeholder="0"
              style={{ width: "44px", fontSize: "16px", color: "#333", background: "#f8f8f8", border: "1px solid #e6e6e6", borderRadius: "6px", padding: "6px 4px", outline: "none", textAlign: "center", fontFamily: "inherit" }} />
            <span style={{ fontSize: "0.72rem", color: "#808080" }}>h</span>
            <input type="number" value={sleepM} onChange={(e) => setSleepM(e.target.value)} placeholder="0"
              style={{ width: "44px", fontSize: "16px", color: "#333", background: "#f8f8f8", border: "1px solid #e6e6e6", borderRadius: "6px", padding: "6px 4px", outline: "none", textAlign: "center", fontFamily: "inherit" }} />
            <span style={{ fontSize: "0.72rem", color: "#808080" }}>m</span>
            <button onClick={saveSleep}
              style={{ fontSize: "0.7rem", fontWeight: 600, color: "#fff", background: "#60A5FA", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", marginLeft: "auto" }}>
              {health?.sleep_hours ? "수정" : "OK"}
            </button>
          </div>
        </div>

        {/* 컨디션 */}
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "0.68rem", color: "#808080", marginBottom: "4px" }}>컨디션</div>
          <div style={{ display: "flex", gap: "6px" }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => saveCondition(n)}
                style={{
                  width: "34px", height: "34px", borderRadius: "8px",
                  border: conditionVal === n ? "2px solid #60A5FA" : "1px solid #e6e6e6",
                  background: conditionVal === n ? "rgba(96,165,250,0.08)" : "#f8f8f8",
                  color: conditionVal === n ? "#60A5FA" : "#808080",
                  fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* 커피 — 잔수 + 시간별 로그 */}
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "0.68rem", color: "#808080", marginBottom: "4px" }}>커피</div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={async () => {
                if (coffeeLog.length === 0) return;
                const nextLog = coffeeLog.slice(0, -1);
                const next = nextLog.length;
                setCoffeeLog(nextLog); setCoffeeVal(next);
                await upsertHealthLog(toDateStr(selectedDate), { coffee: next, coffee_log: nextLog });
              }}
              style={{
                width: "34px", height: "34px", borderRadius: "50%",
                border: "1px solid #e6e6e6", background: "#f8f8f8",
                fontSize: "1rem", color: "#6B7280", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >−</button>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.1rem", fontWeight: 600, color: "#333", minWidth: "32px", textAlign: "center" }}>
              {coffeeVal}잔
            </span>
            <button
              onClick={async () => {
                const isTodayDate = toDateStr(selectedDate) === toDateStr(new Date());
                const hour = isTodayDate ? new Date().getHours() : 12;
                const nextLog = [...coffeeLog, { hour }];
                const next = nextLog.length;
                setCoffeeLog(nextLog); setCoffeeVal(next);
                await upsertHealthLog(toDateStr(selectedDate), { coffee: next, coffee_log: nextLog });
              }}
              style={{
                width: "34px", height: "34px", borderRadius: "50%",
                border: "1px solid #60A5FA", background: "rgba(96,165,250,0.08)",
                fontSize: "1rem", color: "#60A5FA", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >+</button>
          </div>
          {coffeeLog.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
              {coffeeLog.map((c, i) => (
                <span key={i} className="font-heading" style={{
                  fontSize: "0.68rem", color: "#6B7280",
                  background: "#f8f8f8", border: "1px solid #e6e6e6",
                  borderRadius: "10px", padding: "2px 8px",
                }}>
                  {formatHour(c.hour)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 운동 */}
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "0.68rem", color: "#808080", marginBottom: "4px" }}>운동</div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <input type="text" value={exerciseVal} onChange={(e) => setExerciseVal(e.target.value)} placeholder="예: 조깅 30분"
              style={{ flex: 1, minWidth: 0, fontSize: "16px", color: "#333", background: "#f8f8f8", border: "1px solid #e6e6e6", borderRadius: "6px", padding: "6px 8px", outline: "none", fontFamily: "inherit" }} />
            <button onClick={saveExercise}
              style={{ fontSize: "0.7rem", fontWeight: 600, color: "#fff", background: "#60A5FA", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", marginLeft: "auto" }}>
              {health?.exercise ? "수정" : "기록"}
            </button>
          </div>
        </div>

        {/* === Emotion === 에너지 슬라이더 + 감정 토글 + 시간별 누적 */}
        <SectionLabel label="Emotion" />

        {/* 에너지 슬라이더 (7단계, -3 ~ +3) */}
        <div style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.68rem", color: "#808080" }}>에너지</span>
            <span className="font-heading" style={{ fontSize: "0.72rem", color: getEnergyColor(energyDraft), fontWeight: 600 }}>
              {energyLabels[energyDraft]}
            </span>
          </div>
          <input
            type="range" min={-3} max={3} step={1} value={energyDraft}
            onChange={(e) => setEnergyDraft(parseInt(e.target.value))}
            style={{
              width: "100%", appearance: "none", WebkitAppearance: "none",
              height: "6px", borderRadius: "3px",
              background: "linear-gradient(to right, #3B82F6 0%, #93C5FD 33%, #F3F4F6 50%, #FCA5A5 67%, #EF4444 100%)",
              outline: "none",
            }}
          />
          <style>{`
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none; appearance: none;
              width: 18px; height: 18px; border-radius: 50%;
              background: #fff; border: 2px solid #333; cursor: pointer;
            }
            input[type="range"]::-moz-range-thumb {
              width: 18px; height: 18px; border-radius: 50%;
              background: #fff; border: 2px solid #333; cursor: pointer;
            }
          `}</style>
        </div>

        {/* 카테고리 탭 */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
          {(["positive", "neutral", "negative"] as EmotionCategory[]).map((cat) => {
            const label = cat === "positive" ? "긍정" : cat === "neutral" ? "중립" : "부정";
            const active = emotionTab === cat;
            return (
              <button key={cat} onClick={() => setEmotionTab(cat)}
                style={{
                  flex: 1, fontSize: "0.72rem", fontWeight: active ? 600 : 500,
                  color: active ? "#fff" : "#6B7280",
                  background: active ? "#000" : "#f8f8f8",
                  border: "1px solid " + (active ? "#000" : "#e6e6e6"),
                  borderRadius: "6px", padding: "6px 0", cursor: "pointer",
                }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* 감정 칩 (다중선택) */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
          {emotionsByCategory[emotionTab].map((em) => {
            const selected = emotionsDraft.includes(em);
            return (
              <button key={em}
                onClick={() => setEmotionsDraft((prev) => prev.includes(em) ? prev.filter((x) => x !== em) : [...prev, em])}
                style={{
                  fontSize: "0.75rem",
                  color: selected ? "#fff" : getEmotionColor(em),
                  background: selected ? getEmotionColor(em) : "#fff",
                  border: `2px solid ${getEmotionColor(em)}`,
                  borderRadius: "20px", padding: "4px 12px", cursor: "pointer",
                }}>
                {em}
              </button>
            );
          })}
        </div>

        {/* 기타 자유 입력 */}
        <input type="text" value={customDraft} onChange={(e) => setCustomDraft(e.target.value)}
          placeholder="기타 (직접 입력)"
          style={{ width: "100%", fontSize: "16px", color: "#333", background: "#f8f8f8", border: "1px solid #e6e6e6", borderRadius: "6px", padding: "8px 10px", outline: "none", fontFamily: "inherit", marginBottom: "8px" }} />

        {/* 기록 버튼 */}
        <button
          onClick={async () => {
            if (emotionsDraft.length === 0 && !customDraft.trim()) return;
            const isTodayDate = toDateStr(selectedDate) === toDateStr(new Date());
            const hour = isTodayDate ? new Date().getHours() : 12;
            const entry: EmotionEntry = {
              hour, energy: energyDraft,
              emotions: [...emotionsDraft],
              ...(customDraft.trim() ? { custom: customDraft.trim() } : {}),
            };
            const nextLog = [...emotionLog, entry];
            setEmotionLog(nextLog);
            setEmotionsDraft([]); setCustomDraft(""); setEnergyDraft(0);
            await upsertJournalEntry(toDateStr(selectedDate), { emotion_log: nextLog });
          }}
          style={{
            width: "100%", padding: "10px", fontSize: "0.78rem", fontWeight: 600,
            color: "#fff", background: "#000", border: "none", borderRadius: "8px",
            cursor: "pointer", marginBottom: "10px",
          }}>
          감정 기록
        </button>

        {/* 누적 기록 */}
        {emotionLog.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {emotionLog.slice().sort((a, b) => a.hour - b.hour).map((entry, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", background: "#fafafa", borderRadius: "8px", fontSize: "0.75rem" }}>
                <span className="font-heading" style={{ fontSize: "0.68rem", color: "#6B7280", minWidth: "52px" }}>
                  {formatHour(entry.hour)}
                </span>
                <span style={{
                  fontSize: "0.65rem", fontWeight: 600, color: getEnergyColor(entry.energy),
                  minWidth: "48px",
                }}>
                  {energyLabels[entry.energy]}
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", flex: 1 }}>
                  {entry.emotions.map((em, j) => (
                    <span key={j} style={{
                      fontSize: "0.68rem", color: getEmotionColor(em),
                      background: "#fff", border: `1px solid ${getEmotionColor(em)}`,
                      borderRadius: "10px", padding: "1px 7px",
                    }}>{em}</span>
                  ))}
                  {entry.custom && (
                    <span style={{ fontSize: "0.68rem", color: "#6B7280", fontStyle: "italic" }}>
                      {entry.custom}
                    </span>
                  )}
                </div>
                <button
                  onClick={async () => {
                    const nextLog = emotionLog.filter((_, idx) => idx !== emotionLog.indexOf(entry));
                    setEmotionLog(nextLog);
                    await upsertJournalEntry(toDateStr(selectedDate), { emotion_log: nextLog });
                  }}
                  style={{ fontSize: "0.7rem", color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* legacy: 기존 단일 emotion 표시 (있을 때만) */}
        {emotionVal && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", padding: "6px 10px", background: "#fafafa", borderRadius: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: getEmotionColor(emotionVal), flexShrink: 0 }} />
            <span style={{ fontSize: "0.72rem", color: "#6B7280" }}>이전 기록: {emotionVal}</span>
            <button onClick={async () => { setEmotionVal(null); await upsertJournalEntry(toDateStr(selectedDate), { emotion: "" }); }}
              style={{ fontSize: "0.68rem", color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", marginLeft: "auto" }}>지우기</button>
          </div>
        )}

        {/* === Memo === */}
        <SectionLabel label="Memo" />
        <textarea
          value={memoVal}
          onChange={(e) => setMemoVal(e.target.value)}
                    placeholder="오늘의 메모..."
          rows={3}
          style={{
            width: "100%", fontSize: "16px", color: "#333",
            background: "#f8f8f8", border: "1px solid #e6e6e6", borderRadius: "8px",
            padding: "10px 12px", outline: "none", resize: "none",
            lineHeight: 1.6, fontFamily: "inherit",
          }}
        />

        {/* === Daily Review === */}
        <SectionLabel label="Daily Review" />

        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "0.72rem", color: "#808080", marginBottom: "4px" }}>오늘 감사한 것 한 가지는?</div>
          <input type="text" value={gratefulVal} onChange={(e) => setGratefulVal(e.target.value)}
            placeholder="감사한 것..."
            style={{ width: "100%", fontSize: "16px", color: "#333", background: "#f8f8f8", border: "1px solid #e6e6e6", borderRadius: "6px", padding: "8px 10px", outline: "none", fontFamily: "inherit" }} />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "0.72rem", color: "#808080", marginBottom: "4px" }}>오늘 완료한 것은?</div>
          <input type="text" value={doneTodayVal} onChange={(e) => setDoneTodayVal(e.target.value)}
            placeholder="오늘 완료한 것..."
            style={{ width: "100%", fontSize: "16px", color: "#333", background: "#f8f8f8", border: "1px solid #e6e6e6", borderRadius: "6px", padding: "8px 10px", outline: "none", fontFamily: "inherit", marginBottom: "8px" }} />
          <div style={{ fontSize: "0.72rem", color: "#808080", marginBottom: "4px" }}>오늘 못한 것은?</div>
          <input type="text" value={notDoneTodayVal} onChange={(e) => setNotDoneTodayVal(e.target.value)}
            placeholder="오늘 못한 것..."
            style={{ width: "100%", fontSize: "16px", color: "#333", background: "#f8f8f8", border: "1px solid #e6e6e6", borderRadius: "6px", padding: "8px 10px", outline: "none", fontFamily: "inherit" }} />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "0.72rem", color: "#808080", marginBottom: "4px" }}>내일 꼭 하고 싶은 한 가지는?</div>
          <input type="text" value={wantTomorrowVal} onChange={(e) => setWantTomorrowVal(e.target.value)}
            placeholder="내일 하고 싶은 것..."
            style={{ width: "100%", fontSize: "16px", color: "#333", background: "#f8f8f8", border: "1px solid #e6e6e6", borderRadius: "6px", padding: "8px 10px", outline: "none", fontFamily: "inherit" }} />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "0.72rem", color: "#808080", marginBottom: "4px" }}>오늘의 나에게 한 마디?</div>
          <input type="text" value={noteToSelfVal} onChange={(e) => setNoteToSelfVal(e.target.value)}
            placeholder="나에게 한 마디..."
            style={{ width: "100%", fontSize: "16px", color: "#333", background: "#f8f8f8", border: "1px solid #e6e6e6", borderRadius: "6px", padding: "8px 10px", outline: "none", fontFamily: "inherit" }} />
        </div>

        {/* === 하루와의 대화 === */}
        {chatCount > 0 && (
          <>
            <SectionLabel label="하루와의 대화" />
            <div style={{ fontSize: "0.68rem", color: "#60A5FA", fontWeight: 600, marginBottom: "6px" }}>
              하루 — {chatCount}건의 대화
            </div>
            {chatTopics.map((topic, i) => (
              <div key={i} style={{ fontSize: "0.75rem", color: "#333", lineHeight: 1.5, padding: "2px 0", paddingLeft: "8px" }}>
                • {topic}
              </div>
            ))}
          </>
        )}

        {/* === 저장 버튼 === */}
        <button
          onClick={async () => {
            const dateStr = toDateStr(selectedDate);
            await upsertJournalEntry(dateStr, {
              memo: memoVal,
              grateful: gratefulVal,
              done_today: doneTodayVal,
              not_done_today: notDoneTodayVal,
              want_tomorrow: wantTomorrowVal,
              note_to_self: noteToSelfVal,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "#fff",
            background: saved ? "#60A5FA" : "#000",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            marginTop: "20px",
            transition: "background 0.3s",
          }}
        >
          {saved ? "저장 완료" : "저장"}
        </button>
      </div>
    </div>
  );
}
