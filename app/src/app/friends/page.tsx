"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getChatMessages, saveChatMessage, getHealthLog, getJournalEntry, upsertHealthLog, upsertJournalEntry } from "@/lib/supabase/api";

interface Message {
  role: "user" | "assistant";
  character?: "momi" | "maeum";
  text: string;
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 키워드로 어떤 캐릭터가 응답할지 결정
const momiKeywords = ["수면", "잤", "잠", "운동", "조깅", "달리기", "걷기", "산책", "수영", "헬스", "요가", "필라테스", "스트레칭", "자전거", "등산", "인라인", "피곤", "두통", "소화", "식사", "밥", "컨디션", "아파", "아프"];
const maeumKeywords = ["힘들", "막막", "불안", "짜증", "외롭", "슬프", "우울", "고민", "걱정", "기쁘", "좋아", "감사", "기분", "마음", "스트레스", "화나", "일기", "감정"];

function detectCharacter(text: string): "momi" | "maeum" {
  const momiScore = momiKeywords.filter((k) => text.includes(k)).length;
  const maeumScore = maeumKeywords.filter((k) => text.includes(k)).length;
  if (momiScore > maeumScore) return "momi";
  if (maeumScore > momiScore) return "maeum";
  // 동점이거나 매칭 없으면 번갈아
  return "maeum"; // 기본은 마음
}

// 폴백 응답
function getFallback(character: "momi" | "maeum", text: string): string {
  if (character === "momi") {
    if (text.includes("피곤")) return "(◉ _ ◉) 피곤하시구나... 수면은 충분히 주무셨어요?";
    if (text.includes("운동") || text.includes("인라인") || text.includes("조깅")) return "(◉ ◡ ◉)b 운동하셨군요! 기록해둘게요.";
    return "(◉ ◡ ◉) 네, 들었어요. 몸 상태에 대해 더 얘기해주세요.";
  }
  if (text.includes("힘들") || text.includes("막막")) return "【⊡ _ ⊡】 그렇구나... 어떤 부분이 가장 무거워요?";
  if (text.includes("좋") || text.includes("기쁘")) return "【⊡ ◡ ⊡】 오, 좋은 거네요! 더 들려주세요.";
  return "【⊡ ◡ ⊡】 네, 듣고 있어요. 더 얘기해봐요.";
}

// 대화에서 건강/감정 데이터 자동 저장
async function autoSaveFromChat(text: string) {
  const today = getToday();

  // 운동 감지
  const exerciseKeywords = ["조깅", "달리기", "걷기", "산책", "수영", "헬스", "웨이트", "요가", "필라테스", "스트레칭", "자전거", "등산", "인라인", "축구", "농구", "테니스"];
  const found = exerciseKeywords.find((k) => text.includes(k));
  if (found) await upsertHealthLog(today, { exercise: text });

  // 수면 감지
  const sleepMatch = text.match(/(\d+)\s*시간\s*(?:(\d+)\s*분)?/);
  if (sleepMatch && (text.includes("잤") || text.includes("수면") || text.includes("잠"))) {
    const h = parseInt(sleepMatch[1]);
    const m = parseInt(sleepMatch[2] ?? "0");
    await upsertHealthLog(today, { sleep_hours: Math.round((h + m / 60) * 10) / 10 });
  }

  // 컨디션 감지
  const condMatch = text.match(/컨디션\s*(\d)/);
  if (condMatch) {
    const val = parseInt(condMatch[1]);
    if (val >= 1 && val <= 5) await upsertHealthLog(today, { condition: val });
  }

  // 감정 감지
  const emotions: Record<string, string> = { "기쁘": "기쁨", "좋아": "기쁨", "좋은": "기쁨", "감사": "감사", "평온": "평온", "설레": "설렘", "무기력": "무기력", "불안": "불안", "짜증": "짜증", "슬프": "슬픔", "피곤": "피곤", "외롭": "외로움", "막막": "막막", "우울": "우울" };
  for (const [keyword, emotion] of Object.entries(emotions)) {
    if (text.includes(keyword)) {
      await upsertJournalEntry(today, { emotion });
      break;
    }
  }
}

export default function FriendsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [healthStatus, setHealthStatus] = useState("");
  const [emotionStatus, setEmotionStatus] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadStatus = useCallback(() => {
    const today = getToday();
    getHealthLog(today).then((d) => {
      if (d) {
        const p: string[] = [];
        if (d.sleep_hours) p.push(`수면 ${d.sleep_hours}시간`);
        if (d.condition) p.push(`컨디션 ${d.condition}/5`);
        if (d.exercise) p.push(d.exercise);
        setHealthStatus(p.join(", "));
      }
    });
    getJournalEntry(today).then((d) => {
      if (d?.emotion) setEmotionStatus(d.emotion);
    });
  }, []);

  // 오늘 대화 기록 로드
  useEffect(() => {
    const today = getToday();
    Promise.all([
      getChatMessages("momi", today),
      getChatMessages("maeum", today),
    ]).then(([momiMsgs, maeumMsgs]) => {
      const all = [
        ...momiMsgs.map((m: { role: string; message: string; created_at: string }) => ({
          role: m.role as "user" | "assistant",
          character: "momi" as const,
          text: m.message,
          time: m.created_at,
        })),
        ...maeumMsgs.map((m: { role: string; message: string; created_at: string }) => ({
          role: m.role as "user" | "assistant",
          character: "maeum" as const,
          text: m.message,
          time: m.created_at,
        })),
      ].sort((a, b) => a.time.localeCompare(b.time));

      if (all.length > 0) {
        setMessages(all);
      } else {
        // 초기 인사
        setMessages([
          { role: "assistant", character: "momi", text: "(◉ ◡ ◉) 안녕하세요! 오늘 몸 상태는 어떠세요?" },
          { role: "assistant", character: "maeum", text: "【⊡ ◡ ⊡】 기분은 어때요? 편하게 얘기해봐요." },
        ]);
      }
      setLoaded(true);
    });
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const today = getToday();
    const character = detectCharacter(text);

    // 유저 메시지
    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    await saveChatMessage(character, "user", text, today);
    await autoSaveFromChat(text);

    // AI 호출
    try {
      const apiKey = localStorage.getItem("openai_api_key") ?? "";

      if (!apiKey) {
        const reply = getFallback(character, text);
        const assistantMsg: Message = { role: "assistant", character, text: reply };
        setMessages((prev) => [...prev, assistantMsg]);
        await saveChatMessage(character, "assistant", reply, today);
        setLoading(false);
        loadStatus();
        return;
      }

      const recentMessages = messages.slice(-10).map((m) => ({
        role: m.role,
        text: m.role === "assistant" && m.character ? `[${m.character === "momi" ? "모미" : "마음"}] ${m.text}` : m.text,
      }));
      recentMessages.push({ role: "user", text });

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character, messages: recentMessages, apiKey }),
      });

      let replyText: string;
      if (res.ok) {
        const data = await res.json();
        replyText = data.text;
      } else {
        replyText = getFallback(character, text);
      }

      const assistantMsg: Message = { role: "assistant", character, text: replyText };
      setMessages((prev) => [...prev, assistantMsg]);
      await saveChatMessage(character, "assistant", replyText, today);
    } catch {
      const reply = getFallback(character, text);
      const assistantMsg: Message = { role: "assistant", character, text: reply };
      setMessages((prev) => [...prev, assistantMsg]);
      await saveChatMessage(character, "assistant", reply, today);
    } finally {
      setLoading(false);
      loadStatus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!loaded) {
    return <div style={{ padding: "40px 28px", fontSize: "0.84rem", color: "#6B7280" }}>대화 불러오는 중...</div>;
  }

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", minHeight: "calc(100dvh - 70px)" }}>
      {/* Header */}
      <div style={{ padding: "18px 28px 0" }}>
        <div className="font-heading" style={{ fontSize: "1.3rem", fontWeight: 700, color: "#000" }}>
          Friends
        </div>
      </div>

      {/* Status */}
      <div style={{ padding: "8px 28px 12px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {healthStatus ? (
          <span style={{ fontSize: "0.7rem", color: "#059669", background: "rgba(5,150,105,0.08)", padding: "3px 8px", borderRadius: "12px" }}>
            {healthStatus}
          </span>
        ) : (
          <span style={{ fontSize: "0.7rem", color: "#6B7280", background: "#fafafa", padding: "3px 8px", borderRadius: "12px" }}>
            몸 기록 없음
          </span>
        )}
        {emotionStatus ? (
          <span style={{ fontSize: "0.7rem", color: "#8B5CF6", background: "rgba(139,92,246,0.08)", padding: "3px 8px", borderRadius: "12px" }}>
            {emotionStatus}
          </span>
        ) : (
          <span style={{ fontSize: "0.7rem", color: "#6B7280", background: "#fafafa", padding: "3px 8px", borderRadius: "12px" }}>
            마음 기록 없음
          </span>
        )}
      </div>

      <div style={{ height: "1px", background: "#e6e6e6" }} />

      {/* Chat area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 28px", overflowX: "hidden" }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: "12px",
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "82%",
                padding: "10px 14px",
                fontSize: "0.82rem",
                color: "#333",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.role === "user" ? "#f2f2f2" : "transparent",
                border: msg.role === "user" ? "none" : "1px solid #e6e6e6",
              }}
            >
              {msg.role === "assistant" && msg.character && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "3px",
                    color: msg.character === "momi" ? "#059669" : "#8B5CF6",
                  }}
                >
                  {msg.character === "momi" ? "모미" : "마음"}
                </span>
              )}
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ marginBottom: "12px", display: "flex" }}>
            <div style={{ padding: "10px 14px", border: "1px solid #e6e6e6", borderRadius: "16px 16px 16px 4px", fontSize: "0.82rem", color: "#6B7280" }}>
              생각하는 중...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "8px 28px 12px", borderTop: "1px solid #e6e6e6", display: "flex", gap: "8px", alignItems: "flex-end" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          rows={1}
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: "16px",
            color: "#333",
            background: "#f8f8f8",
            border: "1px solid #e6e6e6",
            borderRadius: "12px",
            padding: "10px 14px",
            outline: "none",
            resize: "none",
            lineHeight: 1.5,
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: loading ? "#6B7280" : "#60A5FA",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 2L7 9M14 2L9.5 14L7 9M14 2L2 6.5L7 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
