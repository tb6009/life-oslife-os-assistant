"use client";

import { useState, useEffect, useCallback } from "react";
import { getRoutines, getRoutineLogsForDate, toggleRoutineLog, getRoutineStreak, addRoutineByChat, deactivateRoutine } from "@/lib/supabase/api";
import TagText from "@/components/TagText";

interface RoutineItem {
  id: number;
  title: string;
  done: boolean;
  streak: number;
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function RoutineList({ accentColor }: { accentColor: string }) {
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");

  const loadRoutines = useCallback(async () => {
    const today = getToday();
    const [allRoutines, todayLogs] = await Promise.all([
      getRoutines(),
      getRoutineLogsForDate(today),
    ]);

    const items: RoutineItem[] = [];
    for (const r of allRoutines) {
      const log = todayLogs.find((l: { routine_id: number }) => l.routine_id === r.id);
      const done = log?.done ?? false;
      const streak = await getRoutineStreak(r.id, today);
      items.push({ id: r.id, title: r.title, done, streak: done ? streak : streak });
    }

    setRoutines(items);
    setLoading(false);
  }, []);

  useEffect(() => { loadRoutines(); }, [loadRoutines]);

  async function handleToggle(routineId: number, currentDone: boolean) {
    const today = getToday();
    const newDone = !currentDone;
    setRoutines((prev) => prev.map((r) => r.id === routineId ? { ...r, done: newDone } : r));
    await toggleRoutineLog(routineId, today, newDone);
  }

  async function handleAdd() {
    const title = input.trim();
    if (!title) return;
    setInput("");
    await addRoutineByChat(title);
    await loadRoutines();
  }

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    await deactivateRoutine(id);
  }

  if (loading) {
    return (
      <div className="mb-6">
        <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px", marginTop: "24px" }}>
          Routine
        </div>
        <div style={{ fontSize: "0.78rem", color: "#6B7280" }}>불러오는 중...</div>
      </div>
    );
  }

  const doneCount = routines.filter((r) => r.done).length;
  const maxStreak = Math.max(...routines.map((r) => r.streak), 0);

  return (
    <div className="mb-6">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", marginTop: "24px" }}>
        <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Routine
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {maxStreak >= 3 && <span style={{ fontSize: "0.7rem" }}>🔥</span>}
          <span style={{ fontSize: "0.7rem", color: doneCount === routines.length ? accentColor : "#6B7280" }}>
            {doneCount}/{routines.length}
          </span>
        </div>
      </div>

      {/* 입력창 */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px", marginTop: "4px", alignItems: "flex-start" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); } }}
          placeholder="루틴 추가 (예: 아침 스트레칭 #운동, Shift+Enter 줄바꿈)"
          rows={2}
          style={{
            flex: 1, fontSize: "16px", color: "#333",
            background: "#f8f8f8", border: "1px solid #e6e6e6",
            borderRadius: "8px", padding: "8px 12px", outline: "none",
            fontFamily: "inherit", resize: "vertical", lineHeight: 1.5,
          }}
        />
        <button onClick={handleAdd}
          style={{
            fontSize: "0.78rem", fontWeight: 600, color: accentColor,
            padding: "8px 14px", background: "transparent",
            border: `1px solid ${accentColor}`, borderRadius: "8px",
            cursor: "pointer", flexShrink: 0,
          }}>
          추가
        </button>
      </div>

      {routines.map((routine) => (
        <button
          key={routine.id}
          onClick={() => handleToggle(routine.id, routine.done)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
            textAlign: "left",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px 0",
          }}
        >
          <span style={{
            width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: routine.done ? "none" : `1.5px solid ${accentColor}`,
            background: routine.done ? accentColor : "transparent",
          }}>
            {routine.done && (
              <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span style={{
            flex: 1,
            fontSize: "0.84rem",
            color: routine.done ? "#6B7280" : "#333",
            textDecoration: routine.done ? "line-through" : "none",
          }}>
            <TagText text={routine.title} />
          </span>
          <span style={{ fontSize: "0.7rem", color: routine.streak >= 3 ? accentColor : "#6B7280", flexShrink: 0 }}>
            {routine.done && routine.streak > 0 ? `${routine.streak}일째` : routine.streak === 0 && !routine.done ? "잊지 않으셨죠?" : ""}
          </span>
          <span
            onClick={(e) => handleDelete(e, routine.id)}
            style={{ fontSize: "0.78rem", color: "#b3b3b3", cursor: "pointer", padding: "4px 6px", flexShrink: 0 }}
          >
            ✕
          </span>
        </button>
      ))}
    </div>
  );
}
