"use client";

import { useState, useEffect } from "react";
import ChatInput from "./ChatInput";
import { getHealthLog, upsertHealthLog } from "@/lib/supabase/api";

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const momiResponses: Record<string, string> = {
  수면: "(◉ ᴗ ◉) 수면이요? 몇 시간 주무셨어요?",
  운동: "(◉ ◡ ◉) 오늘 운동 하셨군요! 어떤 운동을 얼마나 하셨어요?",
  피곤: "(◉ _ ◉) 피곤하시구나... 최근 수면 패턴이 어떠셨어요?",
  식사: "(◉ ◡ ◉) 오늘 아침·점심·저녁 어떻게 드셨어요?",
  컨디션: "(◉ ᴗ ◉) 오늘 컨디션 어떠세요? 1~5점으로 말씀해주세요.",
  두통: "(◉ _ ◉) 두통이요... 자주 반복되면 내과에 한 번 가보시는 게 안전해요.",
  스트레칭: "(◉ ◡ ◉)b 스트레칭 좋죠! 목·어깨·허리 중 어디가 뻣뻣하세요?",
};

function getMomiReply(text: string): string {
  for (const [keyword, response] of Object.entries(momiResponses)) {
    if (text.includes(keyword)) return response;
  }
  return "(◉ ◡ ◉) 네, 들었어요. 수면·운동·식사·컨디션 중 기록하고 싶은 게 있으면 말씀해주세요.";
}

interface HealthData {
  sleep_hours: number | null;
  exercise: string | null;
  condition: number | null;
}

export default function MomiView({ accentColor }: { accentColor: string }) {
  const [health, setHealth] = useState<HealthData>({ sleep_hours: null, exercise: null, condition: null });
  const [sleepHour, setSleepHour] = useState("");
  const [sleepMin, setSleepMin] = useState("");
  const [exerciseInput, setExerciseInput] = useState("");
  const [conditionInput, setConditionInput] = useState<number | null>(null);

  useEffect(() => {
    getHealthLog(getToday()).then((data) => {
      if (data) {
        setHealth({
          sleep_hours: data.sleep_hours,
          exercise: data.exercise,
          condition: data.condition,
        });
        if (data.sleep_hours) {
          const h = Math.floor(data.sleep_hours);
          const m = Math.round((data.sleep_hours - h) * 60);
          setSleepHour(String(h));
          setSleepMin(m > 0 ? String(m) : "");
        }
        if (data.exercise) setExerciseInput(data.exercise);
        if (data.condition) setConditionInput(data.condition);
      }
    });
  }, []);

  async function saveSleep() {
    const h = parseInt(sleepHour) || 0;
    const m = parseInt(sleepMin) || 0;
    if (h === 0 && m === 0) return;
    const total = h + m / 60;
    await upsertHealthLog(getToday(), { sleep_hours: Math.round(total * 10) / 10 });
    setHealth((prev) => ({ ...prev, sleep_hours: Math.round(total * 10) / 10 }));
  }

  async function saveExercise() {
    if (!exerciseInput.trim()) return;
    await upsertHealthLog(getToday(), { exercise: exerciseInput.trim() });
    setHealth((prev) => ({ ...prev, exercise: exerciseInput.trim() }));
  }

  async function saveCondition(val: number) {
    setConditionInput(val);
    await upsertHealthLog(getToday(), { condition: val });
    setHealth((prev) => ({ ...prev, condition: val }));
  }

  return (
    <div className="py-4" style={{ overflow: "hidden", width: "100%" }}>
      {/* Health Status — DB 연동 */}
      <div className="mb-5">
        <div className="font-heading text-[0.7rem] font-medium uppercase tracking-[0.1em] mb-3" style={{ color: "#6B7280" }}>
          Health Status
        </div>

        {/* 수면 */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "0.72rem", color: "#808080", marginBottom: "6px" }}>수면</div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <input
              type="number"
              value={sleepHour}
              onChange={(e) => setSleepHour(e.target.value)}
              placeholder="0"
              style={{
                width: "48px", fontSize: "16px", color: "#333",
                background: "#f8f8f8", border: "1px solid #e6e6e6", borderRadius: "6px",
                padding: "6px 4px", outline: "none", textAlign: "center", fontFamily: "inherit",
              }}
            />
            <span style={{ fontSize: "0.78rem", color: "#808080" }}>시간</span>
            <input
              type="number"
              value={sleepMin}
              onChange={(e) => setSleepMin(e.target.value)}
              placeholder="0"
              style={{
                width: "48px", fontSize: "16px", color: "#333",
                background: "#f8f8f8", border: "1px solid #e6e6e6", borderRadius: "6px",
                padding: "6px 4px", outline: "none", textAlign: "center", fontFamily: "inherit",
              }}
            />
            <span style={{ fontSize: "0.78rem", color: "#808080" }}>분</span>
            <button
              onClick={saveSleep}
              style={{
                fontSize: "0.75rem", fontWeight: 600, color: "#fff",
                background: accentColor, border: "none", borderRadius: "6px",
                padding: "6px 14px", cursor: "pointer", marginLeft: "auto",
              }}
            >
              {health.sleep_hours ? "수정" : "OK"}
            </button>
          </div>
        </div>

        {/* 컨디션 (운동과 위치 교체) */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "0.72rem", color: "#808080", marginBottom: "6px" }}>컨디션</div>
          <div style={{ display: "flex", gap: "6px" }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => saveCondition(n)}
                style={{
                  width: "36px", height: "36px", borderRadius: "8px",
                  border: conditionInput === n ? `2px solid ${accentColor}` : "1px solid #e6e6e6",
                  background: conditionInput === n ? `${accentColor}15` : "#f8f8f8",
                  color: conditionInput === n ? accentColor : "#808080",
                  fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* 운동 */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "0.72rem", color: "#808080", marginBottom: "6px" }}>운동</div>
          <input
            type="text"
            value={exerciseInput}
            onChange={(e) => setExerciseInput(e.target.value)}
            placeholder="예: 조깅 30분"
            style={{
              width: "100%", fontSize: "16px", color: "#333",
              background: "#f8f8f8", border: "1px solid #e6e6e6", borderRadius: "6px",
              padding: "8px 10px", outline: "none", fontFamily: "inherit",
              marginBottom: "6px",
            }}
          />
          <button
            onClick={saveExercise}
            style={{
              width: "100%", fontSize: "0.8rem", fontWeight: 600, color: "#fff",
              background: accentColor, border: "none", borderRadius: "6px",
              padding: "8px", cursor: "pointer",
            }}
          >
            {health.exercise ? `운동 수정 (현재: ${health.exercise})` : "운동 기록 저장"}
          </button>
        </div>

      </div>

      {/* Chat */}
      <ChatInput
        characterId="momi"
        characterName="모미"
        accentColor={accentColor}
        initialGreeting={"(◉ ◡ ◉) 안녕하세요, 오늘 몸 상태는 어떠세요?\n\n위에서 수면·운동·컨디션을 직접 기록하거나, 저한테 편하게 말씀해주세요."}
        fallbackReply={getMomiReply}
        onUserMessage={async (text) => {
          // 대화에서 운동 관련 내용 감지 → DB 저장
          const exerciseKeywords = ["조깅", "달리기", "걷기", "산책", "수영", "헬스", "웨이트", "요가", "필라테스", "스트레칭", "자전거", "등산", "인라인", "축구", "농구", "테니스", "배드민턴", "골프"];
          const found = exerciseKeywords.find((k) => text.includes(k));
          if (found) {
            await upsertHealthLog(getToday(), { exercise: text });
            setHealth((prev) => ({ ...prev, exercise: text }));
            setExerciseInput(text);
          }

          // 수면 시간 감지 (예: "7시간 잤어", "6시간 30분")
          const sleepMatch = text.match(/(\d+)\s*시간\s*(?:(\d+)\s*분)?/);
          if (sleepMatch && (text.includes("잤") || text.includes("수면") || text.includes("잠"))) {
            const h = parseInt(sleepMatch[1]);
            const m = parseInt(sleepMatch[2] ?? "0");
            const total = Math.round((h + m / 60) * 10) / 10;
            await upsertHealthLog(getToday(), { sleep_hours: total });
            setHealth((prev) => ({ ...prev, sleep_hours: total }));
            setSleepHour(String(h));
            setSleepMin(m > 0 ? String(m) : "");
          }

          // 컨디션 감지 (예: "컨디션 3", "컨디션 4점")
          const condMatch = text.match(/컨디션\s*(\d)/);
          if (condMatch) {
            const val = parseInt(condMatch[1]);
            if (val >= 1 && val <= 5) {
              await upsertHealthLog(getToday(), { condition: val });
              setHealth((prev) => ({ ...prev, condition: val }));
              setConditionInput(val);
            }
          }
        }}
      />
    </div>
  );
}
