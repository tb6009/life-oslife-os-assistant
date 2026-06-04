"use client";

import { useState, useEffect, useCallback } from "react";
import { getHealthLog, getJournalEntry, getSchedules, getChatMessages, saveRecommendationLog } from "@/lib/supabase/api";

interface DynamicRecommendProps {
  accentColor: string;
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 하루 응답에서 핵심 라인 추출 (번호 목록, 볼드, 핵심 문장)
function extractKeyLines(text: string): string[] {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const keyLines: string[] = [];

  for (const line of lines) {
    // 번호 목록 (1. 2. 3. 또는 - 또는 •)
    if (/^[\d]+[.)]/.test(line) || /^[-•]/.test(line)) {
      // **볼드** 부분만 추출
      const boldMatch = line.match(/\*\*([^*]+)\*\*/);
      if (boldMatch) {
        // 볼드 텍스트 + 뒤에 오는 설명 (콜론 이후)
        const afterColon = line.split(/[:\uff1a]/).slice(1).join(":").trim();
        if (afterColon && afterColon.length < 60) {
          keyLines.push(`• ${boldMatch[1]}: ${afterColon}`);
        } else {
          keyLines.push(`• ${boldMatch[1]}`);
        }
      } else {
        // 볼드 없으면 번호 제거하고 추가
        const clean = line.replace(/^[\d]+[.)]\s*/, "").replace(/^[-•]\s*/, "");
        if (clean.length > 3 && clean.length < 80) {
          keyLines.push(`• ${clean}`);
        }
      }
    }
  }

  return keyLines.slice(0, 5); // 최대 5줄
}

function buildContextSummary(
  health: { sleep_hours?: number; condition?: number; exercise?: string } | null,
  emotion: string | null,
  todaySchedules: Array<{ title: string }>,
  recentChats: Array<{ role: string; message: string }>
): string {
  const parts: string[] = [];

  // 건강 상태 기반
  if (health?.sleep_hours && health.sleep_hours < 6) {
    parts.push(`수면이 ${health.sleep_hours}시간으로 부족해요`);
  }
  if (health?.condition && health.condition <= 2) {
    parts.push("컨디션이 좋지 않은 상태예요");
  }

  // 일정 기반
  if (todaySchedules.length > 0) {
    const titles = todaySchedules.map((s) => s.title).join(", ");
    parts.push(`오늘 ${titles} 일정이 있어요`);
  }

  // 감정 기반
  if (emotion === "피곤" || emotion === "무기력") {
    parts.push("좀 지치신 것 같아요");
  } else if (emotion === "불안" || emotion === "막막") {
    parts.push("마음이 무거우신 것 같아요");
  }

  // 대화 기반 — 최근 주제 감지
  const userMsgs = recentChats.filter((c) => c.role === "user").map((c) => c.message).join(" ");
  if (userMsgs.includes("스트레칭") || userMsgs.includes("운동")) {
    parts.push("몸 관리에 관심을 가지고 계시네요");
  }
  if (userMsgs.includes("출판") || userMsgs.includes("비즈니스")) {
    parts.push("출판/비즈니스에 대해 고민하고 계시죠");
  }
  if (userMsgs.includes("논문") || userMsgs.includes("연구")) {
    parts.push("연구 작업이 진행 중이시네요");
  }

  if (parts.length === 0) {
    return "하루와 대화하면서 나온 제안들이에요.";
  }

  return parts.slice(0, 2).join(", ") + ". 이런 부분을 챙겨보세요:";
}

function buildRecommendation(
  hour: number,
  health: { sleep_hours?: number; condition?: number; exercise?: string } | null,
  emotion: string | null,
  todaySchedules: Array<{ title: string }>,
  recentChats: Array<{ role: string; message: string }>
): string[] {
  const result: string[] = [];

  // 1. 하루의 최근 응답에서 팁/조언 추출
  const assistantMessages = recentChats.filter((c) => c.role === "assistant");

  if (assistantMessages.length > 0) {
    // 가장 최근 2~3개의 어시스턴트 응답에서 핵심 추출
    const recentResponses = assistantMessages.slice(-3);

    for (const msg of recentResponses) {
      const keyLines = extractKeyLines(msg.message);
      if (keyLines.length > 0) {
        result.push(...keyLines);
      }
    }
  }

  // 핵심 라인이 추출되면 그것만 표시
  if (result.length > 0) {
    return result.slice(0, 5);
  }

  // 2. 대화는 있지만 구조화된 팁이 없는 경우 — 마지막 대화 요약
  const userMessages = recentChats.filter((c) => c.role === "user");
  if (userMessages.length > 0 && assistantMessages.length > 0) {
    const lastAssistant = assistantMessages[assistantMessages.length - 1].message;
    // 첫 문장만 (너무 길면 자름)
    const firstSentence = lastAssistant.split(/[.\n]/)[0].trim();
    if (firstSentence.length > 10) {
      const preview = firstSentence.length > 60 ? firstSentence.slice(0, 60) + "..." : firstSentence;
      result.push(preview);
    }
  }

  // 3. 대화가 없으면 시간대 + 상태 기반 기본 제안
  if (result.length === 0) {
    if (hour < 12) {
      if (health?.sleep_hours && health.sleep_hours < 6) {
        result.push("수면이 부족합니다. 오전에 무리하지 마세요.");
      }
      if (todaySchedules.length > 0) {
        result.push(`오늘 ${todaySchedules.map((s) => s.title).join(", ")} 일정이 있어요.`);
      } else {
        result.push("오늘은 일정이 없어요. 하고 싶은 일 한 가지를 정해보세요.");
      }
    } else if (hour < 17) {
      if (!health?.exercise) {
        result.push("오늘 운동 기록이 없어요. 저녁에 가벼운 활동이라도 해보세요.");
      }
      if (emotion === "피곤" || emotion === "무기력") {
        result.push("좀 쉬어가세요. 5분 휴식이 오후를 바꿔줄 거예요.");
      }
    } else {
      result.push("기록 탭에서 Daily Review를 작성하며 하루를 마무리해보세요.");
    }
  }

  if (result.length === 0) {
    result.push("하루에게 편하게 말씀해주세요. 대화 내용을 바탕으로 맞춤 제안을 드릴게요.");
  }

  return result;
}

export default function DynamicRecommend({ accentColor }: DynamicRecommendProps) {
  const [lines, setLines] = useState<string[]>(["불러오는 중..."]);
  const [contextSummary, setContextSummary] = useState("");
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const loadRecommendation = useCallback(() => {
    const today = getToday();
    const hour = new Date().getHours();

    // 체크 상태 로드
    const savedChecks = localStorage.getItem(`recommend_checked_${today}`);
    if (savedChecks) setChecked(JSON.parse(savedChecks));

    Promise.all([
      getHealthLog(today),
      getJournalEntry(today),
      getSchedules(today),
      getChatMessages("momi", today),
    ]).then(([health, journal, schedules, chats]) => {
      const emotion = journal?.emotion ?? null;
      setContextSummary(buildContextSummary(health, emotion, schedules, chats));
      setLines(buildRecommendation(hour, health, emotion, schedules, chats));
    });
  }, []);

  useEffect(() => { loadRecommendation(); }, [loadRecommendation]);

  // 1시간마다 자동 갱신
  useEffect(() => {
    const interval = setInterval(loadRecommendation, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadRecommendation]);

  // 탭 전환 시 즉시 갱신 (하루 탭에서 돌아올 때)
  useEffect(() => {
    function handleFocus() { loadRecommendation(); }
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") loadRecommendation();
    });
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadRecommendation]);

  function toggleCheck(index: number) {
    const today = getToday();
    const updated = { ...checked, [index]: !checked[index] };
    setChecked(updated);
    localStorage.setItem(`recommend_checked_${today}`, JSON.stringify(updated));

    // DB에도 저장
    const doneNow = Object.values(updated).filter(Boolean).length;
    const items = lines.map((text, i) => ({ text, done: updated[i] ?? false }));
    saveRecommendationLog(today, lines.length, doneNow, items);
  }

  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="mb-6">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", marginTop: "24px" }}>
        <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Recommendation
        </div>
        {lines.length > 1 && (
          <div style={{ fontSize: "0.7rem", color: doneCount === lines.length ? accentColor : "#6B7280" }}>
            {doneCount}/{lines.length}
          </div>
        )}
      </div>
      {/* 요약 설명 */}
      {contextSummary && (
        <div style={{ fontSize: "0.8rem", color: "#808080", lineHeight: 1.6, marginBottom: "12px" }}>
          {contextSummary}
        </div>
      )}

      <div style={{ paddingLeft: "4px" }}>
        {lines.map((line, i) => {
          const isDone = checked[i] ?? false;
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "5px 0" }}>
              <button
                onClick={() => toggleCheck(i)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  flex: 1,
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <span style={{
                  marginTop: "3px",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: isDone ? "none" : `1.5px solid ${accentColor}`,
                  background: isDone ? accentColor : "transparent",
                }}>
                  {isDone && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span style={{
                  fontSize: "0.84rem",
                  color: isDone ? "#6B7280" : "#333",
                  textDecoration: isDone ? "line-through" : "none",
                  lineHeight: 1.65,
                }}>
                  {line}
                </span>
              </button>
              <button
                onClick={() => {
                  setLines((prev) => prev.filter((_, j) => j !== i));
                  setChecked((prev) => {
                    const next: Record<number, boolean> = {};
                    Object.entries(prev).forEach(([k, v]) => {
                      const idx = Number(k);
                      if (idx < i) next[idx] = v;
                      else if (idx > i) next[idx - 1] = v;
                    });
                    return next;
                  });
                }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", color: "#D1D5DB", fontSize: "0.85rem", flexShrink: 0, marginTop: "2px" }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
