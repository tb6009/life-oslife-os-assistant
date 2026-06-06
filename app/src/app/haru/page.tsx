"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getChatMessages, saveChatMessage, getHealthLog, getJournalEntry, getSchedules, upsertHealthLog, upsertJournalEntry, saveRecommendationLog, addRoutineByChat, removeRoutineByChat } from "@/lib/supabase/api";
import { getTagColor } from "@/lib/tags";

// 간단한 마크다운 → HTML 변환
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')      // **볼드**
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')                    // *이탤릭*
    .replace(/`([^`]+)`/g, '<code style="background:#f2f2f2;padding:1px 4px;border-radius:3px;font-size:0.78rem;">$1</code>') // `코드`
    .replace(/#([\w가-힣]+)/g, (_, tag) => {                  // #태그 → 칩
      const c = getTagColor(tag);
      return `<span style="display:inline-block;font-size:0.72rem;font-weight:500;padding:1px 7px;border-radius:10px;background:${c.bg};color:${c.text};margin:0 1px;vertical-align:1px;">#${tag}</span>`;
    })
    .replace(/\n/g, '<br>');                                    // 줄바꿈
}

interface Message {
  role: "user" | "assistant";
  text: string;
  actionItems?: string[]; // 체크 가능한 항목
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 대화에서 건강/감정 데이터 자동 저장
async function autoSaveFromChat(text: string) {
  const today = getToday();

  // 운동 감지
  const exerciseKeywords = ["조깅", "달리기", "걷기", "산책", "수영", "헬스", "웨이트", "요가", "필라테스", "스트레칭", "자전거", "등산", "인라인", "축구", "농구", "테니스", "배드민턴", "골프"];
  const found = exerciseKeywords.find((k) => text.includes(k));
  if (found) {
    // 운동 이름 + 시간만 추출 (전체 문장 대신)
    const timeMatch = text.match(/(\d+)\s*분/);
    const exercise = timeMatch ? `${found} ${timeMatch[1]}분` : found;
    await upsertHealthLog(today, { exercise });
  }

  // 수면 감지
  const sleepMatch = text.match(/(\d+)\s*시간\s*(?:(\d+)\s*분)?/);
  if (sleepMatch && (text.includes("잤") || text.includes("수면") || text.includes("잠"))) {
    const h = parseInt(sleepMatch[1]);
    const m = parseInt(sleepMatch[2] ?? "0");
    await upsertHealthLog(today, { sleep_hours: Math.round((h + m / 60) * 10) / 10 });
  }

  // 커피 감지
  const coffeeMatch = text.match(/커피\s*(\d+)\s*잔/);
  if (coffeeMatch) {
    const val = parseInt(coffeeMatch[1]);
    if (val >= 0 && val <= 20) await upsertHealthLog(today, { coffee: val });
  }

  // 컨디션 감지
  const condMatch = text.match(/컨디션\s*(\d)/);
  if (condMatch) {
    const val = parseInt(condMatch[1]);
    if (val >= 1 && val <= 5) await upsertHealthLog(today, { condition: val });
  }

  // 감정 감지
  const emotions: Record<string, string> = {
    "기쁘": "기쁨", "좋아": "기쁨", "좋은": "기쁨", "감사": "감사", "평온": "평온",
    "설레": "설렘", "무기력": "무기력", "불안": "불안", "짜증": "짜증", "슬프": "슬픔",
    "피곤": "피곤", "외롭": "외로움", "막막": "막막", "우울": "우울"
  };
  for (const [keyword, emotion] of Object.entries(emotions)) {
    if (text.includes(keyword)) {
      await upsertJournalEntry(today, { emotion });
      break;
    }
  }
}

// 맞춤 첫 인사 생성 (하드코딩, AI 호출 없음)
async function generateGreeting(): Promise<string> {
  const today = getToday();
  const hour = new Date().getHours();

  // 시간대별 인사
  let timeGreeting: string;
  if (hour < 12) timeGreeting = "좋은 아침이에요!";
  else if (hour < 18) timeGreeting = "좋은 오후예요!";
  else timeGreeting = "좋은 저녁이에요!";

  // 오늘 데이터 조회
  const [health, journal, schedules] = await Promise.all([
    getHealthLog(today),
    getJournalEntry(today),
    getSchedules(today),
  ]);

  const contextParts: string[] = [];

  // 스케줄 정보
  if (schedules && schedules.length > 0) {
    const upcoming = schedules
      .filter((s: { done?: boolean }) => !s.done)
      .slice(0, 3);
    if (upcoming.length > 0) {
      const scheduleTexts = upcoming.map((s: { time?: string; title: string }) => {
        const time = s.time ? s.time.slice(0, 5) : "";
        return time ? `${s.title}(${time})` : s.title;
      });
      contextParts.push(`오늘 일정으로 ${scheduleTexts.join(", ")}이 있어요.`);
    }
  }

  // 건강 정보
  if (health) {
    if (health.sleep_hours) {
      if (health.sleep_hours < 6) {
        contextParts.push(`수면이 ${health.sleep_hours}시간이시네요. 오늘은 무리하지 마세요.`);
      } else if (health.sleep_hours >= 7) {
        contextParts.push(`수면 ${health.sleep_hours}시간, 잘 주무셨네요!`);
      } else {
        contextParts.push(`수면 ${health.sleep_hours}시간이시네요.`);
      }
    }
    if (health.coffee && health.coffee >= 3) {
      contextParts.push(`커피를 벌써 ${health.coffee}잔 드셨네요. 오늘은 물로 바꿔보는 건 어때요?`);
    }
  }

  // 감정 정보
  if (journal?.emotion) {
    contextParts.push(`기분이 "${journal.emotion}"이시군요.`);
  }

  // 조합
  if (contextParts.length > 0) {
    return `${timeGreeting} ${contextParts.join(" ")}`;
  }

  // 스케줄도 없고 건강 기록도 없을 때
  if (!schedules || schedules.length === 0) {
    return `${timeGreeting} 오늘은 등록된 일정이 없어서 여유로운 하루예요. 어떻게 보내실 계획이에요?`;
  }

  return `${timeGreeting} 오늘 하루도 함께할게요. 건강, 기분, 일정 — 뭐든 편하게 말씀해주세요.`;
}

// 특수 명령 체크 (API 상태 등)
function checkSpecialCommand(text: string): string | null {
  const lower = text.toLowerCase();

  // API 연결 상태 확인
  if (lower.includes("api") || lower.includes("연결") && (lower.includes("확인") || lower.includes("상태") || lower.includes("됐") || lower.includes("돼"))) {
    const apiKey = localStorage.getItem("openai_api_key") ?? "";
    if (apiKey && apiKey.length > 10) {
      return `API가 연결되어 있어요! (ChatGPT)\n\n지금 저와 자유롭게 대화할 수 있어요. 건강, 감정, 일정, 고민, 아이디어 — 뭐든 괜찮아요.`;
    } else {
      return `API가 아직 연결되지 않았어요.\n\n하단 "설정" 탭에서 ChatGPT API Key를 입력하면 저와 자유로운 대화가 가능해요.\n\n지금은 간단한 응답만 가능합니다.`;
    }
  }

  // 루틴 추가
  if ((lower.includes("루틴") || lower.includes("습관")) && (lower.includes("추가") || lower.includes("넣어") || lower.includes("만들어") || lower.includes("시작"))) {
    const cleaned = text.replace(/루틴|습관|추가|넣어|만들어|시작|해줘|해주세요|좀|매일/g, "").trim();
    if (cleaned.length >= 2) {
      addRoutineByChat(cleaned);
      return `"${cleaned}" 루틴을 추가했어요! 내일부터 홈에서 체크할 수 있어요.`;
    }
    return "어떤 루틴을 추가할까요? 예: '매일 아침 명상 10분 루틴 추가해줘'";
  }

  // 루틴 삭제
  if ((lower.includes("루틴") || lower.includes("습관")) && (lower.includes("삭제") || lower.includes("빼") || lower.includes("제거") || lower.includes("없애"))) {
    const cleaned = text.replace(/루틴|습관|삭제|빼줘|제거|없애|해줘|해주세요|좀/g, "").trim();
    if (cleaned.length >= 2) {
      removeRoutineByChat(cleaned);
      return `"${cleaned}" 관련 루틴을 삭제했어요.`;
    }
    return "어떤 루틴을 삭제할까요? 예: '물 8잔 루틴 빼줘'";
  }

  // 도움말
  if (lower.includes("도움") || lower.includes("뭐 할 수 있") || lower.includes("기능")) {
    return `저는 하루예요. 이런 것들을 도와드릴 수 있어요:\n\n• 건강 기록 — "7시간 잤어", "조깅 30분 했어"\n• 감정 대화 — "오늘 좀 힘들어", "기분 좋아"\n• 루틴 관리 — "명상 10분 루틴 추가해줘", "물 루틴 빼줘"\n• 일정 확인 — 홈 탭에서 Today/Tomorrow 확인\n• 하루 리뷰 — 기록 탭에서 메모, Daily Review 작성\n• 자유 대화 — 고민, 아이디어, 뭐든 편하게\n\nAPI 연결 상태도 "API 확인"으로 체크할 수 있어요.`;
  }

  return null;
}

// 폴백 응답
function getHaruFallback(text: string): string {
  if (text.includes("피곤") || text.includes("잠")) return "수면이 부족하셨나요? 몇 시간 주무셨는지 알려주시면 기록해둘게요.";
  if (text.includes("운동") || text.includes("조깅") || text.includes("인라인")) return "운동하셨군요! 기록해뒀어요. 어떤 운동을 얼마나 하셨어요?";
  if (text.includes("힘들") || text.includes("막막")) return "힘드셨구나... 어떤 부분이 가장 무거웠어요? 편하게 얘기해봐요.";
  if (text.includes("좋") || text.includes("기쁘")) return "좋은 하루네요! 뭐가 그렇게 좋았어요?";
  if (text.includes("고마") || text.includes("감사")) return "감사한 마음이 드셨군요. 그런 순간을 알아차리는 것 자체가 좋은 거예요.";
  if (text.includes("일정") || text.includes("스케줄")) return "일정을 확인하시려면 홈 탭에서 Today/Tomorrow를 보시거나, 기록 탭에서 날짜별로 확인할 수 있어요.";
  if (text.includes("안녕") || text.includes("하이")) return "안녕하세요! 오늘 하루는 어떠세요? 뭐든 편하게 말씀해주세요.";
  if (text.includes("날씨")) return "날씨는 홈 탭 상단에서 확인할 수 있어요. 오늘 뭔가 계획 있으세요?";
  if (text.includes("논문") || text.includes("연구") || text.includes("과제")) return "연구/과제 이야기군요. 어떤 부분에서 고민이세요? 같이 정리해봐요.";
  if (text.includes("회의") || text.includes("미팅")) return "회의가 있으시군요. 준비할 것이 있으면 같이 정리해드릴까요?";
  return "네, 듣고 있어요. 더 얘기해주세요. 건강, 기분, 일정, 고민, 아이디어 — 뭐든 괜찮아요.";
}

// 하루 응답에서 실행 가능한 항목만 추출
function extractRecommendItems(text: string): string[] {
  // 실행 가능한 팁/조언 패턴 감지
  const actionPatterns = ["하세요", "해보세요", "해보기", "하기", "마시", "먹", "챙기", "풀기", "쉬세요", "주무세요", "확인", "정리", "준비", "시작", "연습", "반복"];
  const hasActionContent = actionPatterns.some((p) => text.includes(p));
  if (!hasActionContent) return [];

  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const items: string[] = [];
  for (const line of lines) {
    if (/^[\d]+[.)]/.test(line) || /^[-•]/.test(line)) {
      const boldMatch = line.match(/\*\*([^*]+)\*\*/);
      if (boldMatch) {
        const afterColon = line.split(/[:\uff1a]/).slice(1).join(":").trim();
        items.push(afterColon && afterColon.length < 60 ? `${boldMatch[1]}: ${afterColon}` : boldMatch[1]);
      } else {
        const clean = line.replace(/^[\d]+[.)]\s*/, "").replace(/^[-•]\s*/, "");
        if (clean.length > 3 && clean.length < 80) items.push(clean);
      }
    }
  }
  // 최소 3개 이상의 실행 항목이 있을 때만 표시
  return items.length >= 3 ? items.slice(0, 5) : [];
}

export default function HaruPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [healthStatus, setHealthStatus] = useState("");
  const [emotionStatus, setEmotionStatus] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
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

  // 오늘 대화 기록 로드 (하루는 momi 채널 재활용)
  useEffect(() => {
    const today = getToday();
    getChatMessages("momi", today).then(async (data) => {
      if (data.length > 0) {
        const saved: Message[] = data.map((m: { role: string; message: string }) => ({
          role: m.role as "user" | "assistant",
          text: m.message,
        }));
        setMessages(saved);
      } else {
        // 오늘 첫 방문: 맞춤 인사 생성
        try {
          const greeting = await generateGreeting();
          setMessages([{ role: "assistant", text: greeting }]);
        } catch {
          setMessages([
            { role: "assistant", text: "안녕하세요! 저는 하루예요.\n\n건강, 기분, 일정 — 뭐든 편하게 말씀해주세요." },
          ]);
        }
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

    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    await saveChatMessage("momi", "user", text, today);
    await autoSaveFromChat(text);

    // 특수 명령 체크 (API 상태, 도움말 등)
    const specialReply = checkSpecialCommand(text);
    if (specialReply) {
      const assistantMsg: Message = { role: "assistant", text: specialReply };
      setMessages((prev) => [...prev, assistantMsg]);
      await saveChatMessage("momi", "assistant", specialReply, today);
      setLoading(false);
      return;
    }

    try {
      const apiKey = localStorage.getItem("openai_api_key") ?? "";

      if (!apiKey) {
        const reply = getHaruFallback(text);
        const assistantMsg: Message = { role: "assistant", text: reply };
        setMessages((prev) => [...prev, assistantMsg]);
        await saveChatMessage("momi", "assistant", reply, today);
        setLoading(false);
        loadStatus();
        return;
      }

      const recentMessages = messages.slice(-10).map((m) => ({
        role: m.role,
        text: m.text,
      }));
      recentMessages.push({ role: "user", text });

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character: "momi", messages: recentMessages, apiKey }),
      });

      let replyText: string;
      if (res.ok) {
        const data = await res.json();
        replyText = data.text;
      } else {
        replyText = getHaruFallback(text);
      }

      const items = extractRecommendItems(replyText);
      const assistantMsg: Message = { role: "assistant", text: replyText, actionItems: items.length >= 2 ? items : undefined };
      setMessages((prev) => [...prev, assistantMsg]);
      await saveChatMessage("momi", "assistant", replyText, today);
    } catch {
      const reply = getHaruFallback(text);
      const assistantMsg: Message = { role: "assistant", text: reply };
      setMessages((prev) => [...prev, assistantMsg]);
      await saveChatMessage("momi", "assistant", reply, today);
    } finally {
      setLoading(false);
      loadStatus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // 모바일에서는 Enter = 줄바꿈, 데스크탑에서만 Enter = 전송
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!loaded) {
    return <div style={{ padding: "40px 28px", fontSize: "0.84rem", color: "#6B7280" }}>불러오는 중...</div>;
  }

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", minHeight: "calc(100dvh - 70px)" }}>
      {/* Header — 상단 고정, 최소 높이 */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, background: "#fff" }}>
        <div style={{ padding: "3px 28px 3px", display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
        {healthStatus ? (
          <span style={{ fontSize: "0.7rem", color: "#059669", background: "rgba(5,150,105,0.08)", padding: "2px 8px", borderRadius: "12px" }}>
            {healthStatus}
          </span>
        ) : (
          <span style={{ fontSize: "0.7rem", color: "#6B7280", background: "#fafafa", padding: "2px 8px", borderRadius: "12px" }}>
            건강 기록 없음
          </span>
        )}
        {emotionStatus ? (
          <span style={{ fontSize: "0.7rem", color: "#8B5CF6", background: "rgba(139,92,246,0.08)", padding: "2px 8px", borderRadius: "12px" }}>
            {emotionStatus}
          </span>
        ) : (
          <span style={{ fontSize: "0.7rem", color: "#6B7280", background: "#fafafa", padding: "2px 8px", borderRadius: "12px" }}>
            감정 기록 없음
          </span>
        )}
        </div>
        <div style={{ height: "1px", background: "#e6e6e6" }} />
      </div>

      {/* Chat — 헤더 높이만큼 상단 여백 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 28px", paddingTop: "32px", overflowX: "hidden" }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: "10px",
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "82%",
                padding: "6px 10px",
                fontSize: "0.93rem",
                color: "#333",
                lineHeight: 1.35,
                letterSpacing: "0.05em",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                background: msg.role === "user" ? "#f2f2f2" : "transparent",
                border: msg.role === "user" ? "none" : "1px solid #e6e6e6",
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />

              {/* 체크 가능한 액션 항목 */}
              {msg.actionItems && msg.actionItems.length > 0 && (
                <div style={{ marginTop: "10px", borderTop: "1px solid #e6e6e6", paddingTop: "8px" }}>
                  {msg.actionItems.map((item, j) => {
                    const key = `${i}-${j}`;
                    const isChecked = checkedItems[key] ?? false;
                    return (
                      <button
                        key={j}
                        onClick={() => setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }))}
                        style={{ display: "flex", alignItems: "flex-start", gap: "8px", width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "3px 0" }}
                      >
                        <span style={{
                          marginTop: "2px", width: "14px", height: "14px", borderRadius: "3px", flexShrink: 0,
                          border: isChecked ? "none" : "1.5px solid #60A5FA",
                          background: isChecked ? "#60A5FA" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {isChecked && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: isChecked ? "#60A5FA" : "#333", lineHeight: 1.4 }}>{item}</span>
                      </button>
                    );
                  })}

                  {/* Recommendation / Todo 추가 버튼 */}
                  {Object.entries(checkedItems).some(([k, v]) => k.startsWith(`${i}-`) && v) && (
                    <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                      <button
                        onClick={async () => {
                          const selected = msg.actionItems!.filter((_, j) => checkedItems[`${i}-${j}`]);
                          const items = selected.map((text) => ({ text, done: false }));
                          await saveRecommendationLog(getToday(), items.length, 0, items);
                          // 체크 해제
                          const cleared = { ...checkedItems };
                          msg.actionItems!.forEach((_, j) => { delete cleared[`${i}-${j}`]; });
                          setCheckedItems(cleared);
                        }}
                        style={{ fontSize: "0.68rem", fontWeight: 600, color: "#fff", background: "#60A5FA", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer" }}
                      >
                        Rec 추가
                      </button>
                      <button
                        onClick={async () => {
                          const { addTodo } = await import("@/lib/supabase/api");
                          const selected = msg.actionItems!.filter((_, j) => checkedItems[`${i}-${j}`]);
                          for (const text of selected) { await addTodo(text); }
                          const cleared = { ...checkedItems };
                          msg.actionItems!.forEach((_, j) => { delete cleared[`${i}-${j}`]; });
                          setCheckedItems(cleared);
                        }}
                        style={{ fontSize: "0.68rem", fontWeight: 600, color: "#60A5FA", background: "transparent", border: "1px solid #60A5FA", borderRadius: "6px", padding: "5px 10px", cursor: "pointer" }}
                      >
                        Todo 추가
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ marginBottom: "10px", display: "flex" }}>
            <div style={{ padding: "6px 10px", border: "1px solid #e6e6e6", borderRadius: "14px 14px 14px 4px", fontSize: "0.8rem", color: "#6B7280" }}>
              생각하는 중...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input — 하단 고정 */}
      <div style={{ padding: "4px 28px 6px", borderTop: "1px solid #e6e6e6", display: "flex", gap: "8px", alignItems: "flex-end", flexShrink: 0 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="하루에게 메시지..."
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
