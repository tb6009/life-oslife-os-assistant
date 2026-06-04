"use client";

import { useState, useRef, useEffect } from "react";
import { getChatMessages, saveChatMessage } from "@/lib/supabase/api";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface ChatInputProps {
  characterId: "momi" | "maeum";
  characterName: string;
  accentColor: string;
  initialGreeting: string;
  fallbackReply: (text: string) => string;
  onUserMessage?: (text: string) => void;
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ChatInput({
  characterId,
  characterName,
  accentColor,
  initialGreeting,
  fallbackReply,
  onUserMessage,
}: ChatInputProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: initialGreeting },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load today's chat history from Supabase
  useEffect(() => {
    const today = getToday();
    getChatMessages(characterId, today).then((data) => {
      if (data.length > 0) {
        const saved: Message[] = data.map((d: { role: string; message: string }) => ({
          role: d.role as "user" | "assistant",
          text: d.message,
        }));
        setMessages([{ role: "assistant", text: initialGreeting }, ...saved]);
      }
      setLoaded(true);
    });
  }, [characterId, initialGreeting]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const today = getToday();

    // Add user message
    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    await saveChatMessage(characterId, "user", text, today);

    // 사용자 메시지에서 데이터 감지 (모미: 운동/수면/컨디션)
    if (onUserMessage) {
      onUserMessage(text);
    }

    // Call AI API
    try {
      const apiKey = localStorage.getItem("openai_api_key") ?? "";

      if (!apiKey) {
        // API 키 없으면 안내 메시지
        const replyText = `⚙️ AI가 연결되지 않았습니다.\n\n오른쪽 상단 설정(톱니바퀴) → Claude API Key를 입력하면 ${characterName}와 진짜 대화할 수 있어요.\n\n지금은 간단한 응답만 가능합니다:\n${fallbackReply(text)}`;
        const assistantMsg: Message = { role: "assistant", text: replyText };
        setMessages((prev) => [...prev, assistantMsg]);
        await saveChatMessage(characterId, "assistant", replyText, today);
        setLoading(false);
        return;
      }

      const chatHistory = [...messages.filter((_, i) => i > 0), userMsg]; // exclude initial greeting
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: characterId,
          messages: chatHistory,
          apiKey,
        }),
      });

      let replyText: string;
      if (res.ok) {
        const data = await res.json();
        replyText = data.text;
      } else {
        const errData = await res.json().catch(() => ({}));
        replyText = `⚠️ AI 응답 오류: ${errData.error ?? "알 수 없는 오류"}\n\n${fallbackReply(text)}`;
      }

      const assistantMsg: Message = { role: "assistant", text: replyText };
      setMessages((prev) => [...prev, assistantMsg]);
      await saveChatMessage(characterId, "assistant", replyText, today);
    } catch {
      const replyText = fallbackReply(text);
      const assistantMsg: Message = { role: "assistant", text: replyText };
      setMessages((prev) => [...prev, assistantMsg]);
      await saveChatMessage(characterId, "assistant", replyText, today);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!loaded) {
    return <div style={{ fontSize: "0.84rem", color: "#6B7280", padding: "12px 0" }}>대화 불러오는 중...</div>;
  }

  return (
    <div style={{ overflow: "hidden", width: "100%" }}>
      {/* Messages */}
      <div style={{ maxHeight: "300px", overflowY: "auto", overflowX: "hidden", marginBottom: "16px" }}>
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
                maxWidth: "80%",
                padding: "10px 14px",
                wordBreak: "break-word" as const,
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.role === "user" ? "#f2f2f2" : "transparent",
                border: msg.role === "user" ? "none" : "1px solid #e6e6e6",
                fontSize: "0.84rem",
                color: "#333",
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.role === "assistant" && (
                <span style={{ fontSize: "0.7rem", color: accentColor, fontWeight: 600, display: "block", marginBottom: "4px" }}>
                  {characterName}
                </span>
              )}
              {msg.text}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div style={{ marginBottom: "12px", display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              padding: "10px 14px",
              borderRadius: "16px 16px 16px 4px",
              border: "1px solid #e6e6e6",
              fontSize: "0.84rem",
              color: "#6B7280",
            }}>
              <span style={{ fontSize: "0.7rem", color: accentColor, fontWeight: 600, display: "block", marginBottom: "4px" }}>
                {characterName}
              </span>
              생각하는 중...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", width: "100%" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`${characterName}에게 메시지...`}
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
            background: loading ? "#6B7280" : accentColor,
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
