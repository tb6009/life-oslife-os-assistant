"use client";

import { useState, useEffect } from "react";
import { getTodos, addTodo, toggleTodo as toggleTodoApi, deleteTodo, progressTodo } from "@/lib/supabase/api";
import TagText from "@/components/TagText";

interface Todo {
  id: number;
  text: string;
  done: boolean;
  source: "manual" | "calendar";
  created_at?: string;
  completed_at?: string | null;
  last_progressed_at?: string | null;
  progress_count?: number;
}

interface TodoListProps {
  accentColor: string;
}

function formatTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const mon = d.getMonth() + 1;
  const day = d.getDate();
  return `${mon}/${day} ${h}:${m}`;
}

function daysSince(iso?: string | null): number {
  if (!iso) return 0;
  const start = new Date(iso); start.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.max(1, Math.floor((today.getTime() - start.getTime()) / 86400000) + 1);
}

function isToday(iso?: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso); d.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return d.getTime() === today.getTime();
}

// 진행일수 배지 스타일 (Done 소요일 색상 규칙과 통일)
function streakStyle(days: number, hasProgress: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    fontSize: "0.68rem", fontWeight: 600, fontFamily: "var(--font-heading, inherit)",
    padding: "3px 7px", borderRadius: "10px", minWidth: "44px",
    textAlign: "center", whiteSpace: "nowrap", lineHeight: 1.3,
  };
  if (!hasProgress) return { ...base, color: "#9CA3AF", background: "transparent", padding: "3px 0", minWidth: "24px" };
  if (days >= 7) return { ...base, color: "#B91C1C", background: "#FEE2E2" };
  if (days >= 3) return { ...base, color: "#b45309", background: "#FEF3C7" };
  return { ...base, color: "#6B7280", background: "#f3f4f6" };
}

export default function TodoList({ accentColor }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTodos().then((data) => {
      setTodos(data as Todo[]);
      setLoading(false);
    });
  }, []);

  async function handleComplete(id: number, currentDone: boolean) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !currentDone, completed_at: !currentDone ? new Date().toISOString() : null } : t))
    );
    await toggleTodoApi(id, !currentDone);
  }

  async function handleProgress(id: number) {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    const alreadyToday = isToday(todo.last_progressed_at);
    setTodos((prev) => prev.map((t) => t.id === id ? {
      ...t,
      last_progressed_at: alreadyToday ? null : new Date().toISOString(),
      progress_count: alreadyToday ? Math.max(0, (t.progress_count ?? 0) - 1) : (t.progress_count ?? 0) + 1,
    } : t));
    await progressTodo(id);
  }

  async function handleDelete(id: number) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await deleteTodo(id);
  }

  async function handleAdd() {
    const text = input.trim();
    if (!text) return;
    const newTodo = await addTodo(text);
    if (newTodo) {
      setTodos((prev) => [...prev, newTodo as Todo]);
    }
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  }

  const sevenDaysAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();
  const pending = todos.filter((t) => !t.done);
  const done = todos.filter((t) => {
    if (!t.done || !t.completed_at) return false;
    return new Date(t.completed_at).getTime() >= sevenDaysAgo;
  });

  if (loading) {
    return (
      <div className="mb-6">
        <div className="font-heading text-[0.7rem] font-medium uppercase tracking-[0.1em]" style={{ color: "#6B7280", marginTop: "24px", marginBottom: "4px" }}>
          Todo
        </div>
        <div style={{ fontSize: "0.84rem", color: "#6B7280" }}>불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="font-heading text-[0.7rem] font-medium uppercase tracking-[0.1em]" style={{ color: "#6B7280", marginTop: "24px", marginBottom: "4px" }}>
        Todo
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "16px" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="할 일 추가... (#태그 가능, Shift+Enter 줄바꿈)"
          rows={2}
          style={{
            flex: 1, fontSize: "16px", color: "#333",
            background: "#f8f8f8", border: "1px solid #e6e6e6",
            borderRadius: "8px", padding: "10px 14px", outline: "none",
            fontFamily: "inherit", resize: "vertical", lineHeight: 1.5,
          }}
        />
        <button
          onClick={handleAdd}
          style={{
            fontSize: "0.78rem", fontWeight: 600, color: accentColor,
            padding: "10px 16px", background: "transparent",
            border: `1px solid ${accentColor}`, borderRadius: "8px", cursor: "pointer",
          }}
        >
          추가
        </button>
      </div>

      {/* Pending — 두 버튼 + 진행일수 */}
      {pending.map((todo) => {
        const hasProgress = (todo.progress_count ?? 0) > 0 || !!todo.last_progressed_at;
        const days = todo.created_at ? daysSince(todo.created_at) : 0;
        const todayPressed = isToday(todo.last_progressed_at);
        const streakLabel = !hasProgress ? "—" : `${days}일째`;

        return (
          <div
            key={todo.id}
            style={{
              display: "flex", alignItems: "flex-start", gap: "15px",
              padding: "10px 0", minHeight: "44px",
              borderBottom: "1px solid #f5f5f5",
            }}
          >
            <div style={{ flex: 1, paddingTop: "2px" }}>
              <div style={{ fontSize: "0.88rem", color: "#111", lineHeight: 1.4 }}>
                <TagText text={todo.text} />
                {todo.source === "calendar" && (
                  <span style={{ fontSize: "0.7rem", color: "#6B7280", marginLeft: "6px", background: "#f2f2f2", padding: "1px 5px", borderRadius: "3px" }}>
                    Cal
                  </span>
                )}
              </div>
              {todo.created_at && (
                <span style={{ fontSize: "0.66rem", color: "#9CA3AF", display: "block", marginTop: "3px" }}>
                  {formatTime(todo.created_at)}
                  {todo.last_progressed_at && !todayPressed && (
                    <span> · 마지막 {formatTime(todo.last_progressed_at)}</span>
                  )}
                  {todayPressed && <span> · 오늘 진행</span>}
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "11px", flexShrink: 0, marginTop: "2px" }}>
              {/* 진행일수 배지 */}
              <span style={streakStyle(days, hasProgress)}>{streakLabel}</span>

              {/* 오늘 버튼 */}
              <button
                onClick={() => handleProgress(todo.id)}
                style={{
                  fontSize: "0.62rem", fontWeight: 600,
                  padding: "5px 10px", borderRadius: "5px", cursor: "pointer",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                  fontFamily: "var(--font-heading, inherit)",
                  border: todayPressed ? "1px solid #BFDBFE" : "1px solid #e5e7eb",
                  background: todayPressed ? "#EFF6FF" : "#fff",
                  color: todayPressed ? accentColor : "#6B7280",
                }}
              >
                오늘
              </button>

              {/* 완료 버튼 */}
              <button
                onClick={() => handleComplete(todo.id, todo.done)}
                style={{
                  fontSize: "0.62rem", fontWeight: 600,
                  padding: "5px 10px", borderRadius: "5px", cursor: "pointer",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                  fontFamily: "var(--font-heading, inherit)",
                  border: `1px solid ${accentColor}`,
                  background: "#fff", color: accentColor,
                }}
              >
                완료
              </button>

              {/* 삭제 */}
              <button
                onClick={() => handleDelete(todo.id)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", color: "#D1D5DB", fontSize: "0.85rem" }}
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}

      {/* Done (기존 그대로) */}
      {done.length > 0 && (
        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e6e6e6" }}>
          {done.map((todo) => (
            <div
              key={todo.id}
              style={{ display: "flex", alignItems: "flex-start", gap: "10px", minHeight: "36px", padding: "3px 0" }}
            >
              <button
                onClick={() => handleComplete(todo.id, todo.done)}
                style={{ display: "flex", alignItems: "flex-start", gap: "10px", flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
              >
                <span
                  style={{ marginTop: "3px", width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0, background: accentColor, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span style={{ fontSize: "0.84rem", color: "#6B7280", textDecoration: "line-through", lineHeight: 1.6, flex: 1 }}>
                  <TagText text={todo.text} />
                  {todo.completed_at && (
                    <span style={{ display: "block", fontSize: "0.65rem", color: "#9CA3AF", textDecoration: "none" }}>
                      {formatTime(todo.completed_at)} 완료
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => handleDelete(todo.id)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", color: "#D1D5DB", fontSize: "0.85rem", flexShrink: 0, marginTop: "2px" }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {pending.length === 0 && done.length === 0 && (
        <div style={{ fontSize: "0.84rem", color: "#6B7280", padding: "12px 0" }}>
          아직 할 일이 없습니다
        </div>
      )}
    </div>
  );
}
