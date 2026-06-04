"use client";

import { useState, useEffect } from "react";
import { getThesisLogs, addThesisLog, deleteThesisLog } from "@/lib/supabase/api";
import { tokenize, getTagColor } from "@/lib/tags";

function renderWithTags(text: string) {
  return tokenize(text).map((tok, i) => {
    if (tok.kind === "text") return <span key={i}>{tok.value}</span>;
    const c = getTagColor(tok.value);
    return (
      <span key={i} style={{
        display: "inline-block", fontSize: "0.7rem", fontWeight: 500,
        padding: "1px 7px", borderRadius: "10px",
        background: c.bg, color: c.text,
        margin: "0 1px", verticalAlign: "1px",
      }}>#{tok.value}</span>
    );
  });
}

interface ThesisLog {
  id: number;
  worked: string;
  todo: string;
  created_at: string;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(dateStr: string): string {
  const today = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86400000));
  if (dateStr === today) return "오늘";
  if (dateStr === yesterday) return "어제";
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${h12}:${m}`;
}

export default function ThesisTab() {
  const [worked, setWorked] = useState("");
  const [todo, setTodo] = useState("");
  const [logs, setLogs] = useState<ThesisLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getThesisLogs().then((data) => {
      setLogs(data as ThesisLog[]);
      setLoading(false);
    });
  }, []);

  async function handleAdd() {
    const w = worked.trim();
    const t = todo.trim();
    if (!w && !t) return;
    await addThesisLog(w, t);
    setWorked("");
    setTodo("");
    const data = await getThesisLogs();
    setLogs(data as ThesisLog[]);
  }

  async function handleDelete(id: number) {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    await deleteThesisLog(id);
  }

  // 날짜별 그룹
  const grouped: Record<string, ThesisLog[]> = {};
  for (const l of logs) {
    const date = toDateStr(new Date(l.created_at));
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(l);
  }
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div style={{ padding: "0 28px 24px" }}>
      <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "16px", marginBottom: "8px" }}>
        Thesis Log
      </div>

      {/* 입력 영역 */}
      <div style={{ background: "#f8f8f8", border: "1px solid #e6e6e6", borderRadius: "10px", padding: "12px", marginBottom: "20px" }}>
        <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "4px" }}>
          Worked
        </label>
        <textarea
          value={worked}
          onChange={(e) => setWorked(e.target.value)}
          placeholder="오늘 어디까지 작업했나요?"
          rows={3}
          style={{ width: "100%", fontSize: "16px", color: "#333", background: "#fff", border: "1px solid #e6e6e6", borderRadius: "8px", padding: "10px 12px", outline: "none", fontFamily: "inherit", resize: "vertical", marginBottom: "10px", boxSizing: "border-box" }}
        />

        <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "4px" }}>
          Todo
        </label>
        <textarea
          value={todo}
          onChange={(e) => setTodo(e.target.value)}
          placeholder="다음에 무엇을 해야 하나요?"
          rows={3}
          style={{ width: "100%", fontSize: "16px", color: "#333", background: "#fff", border: "1px solid #e6e6e6", borderRadius: "8px", padding: "10px 12px", outline: "none", fontFamily: "inherit", resize: "vertical", marginBottom: "10px", boxSizing: "border-box" }}
        />

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={handleAdd}
            style={{ fontSize: "0.78rem", fontWeight: 600, color: "#60A5FA", padding: "8px 18px", background: "transparent", border: "1px solid #60A5FA", borderRadius: "8px", cursor: "pointer" }}>
            저장
          </button>
        </div>
      </div>

      {/* 기록 목록 */}
      {loading ? (
        <div style={{ fontSize: "0.84rem", color: "#6B7280" }}>불러오는 중...</div>
      ) : sortedDates.length === 0 ? (
        <div style={{ fontSize: "0.84rem", color: "#6B7280", padding: "12px 0" }}>
          아직 기록이 없습니다.
        </div>
      ) : (
        sortedDates.map((date) => (
          <div key={date} style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6B7280", marginBottom: "8px", paddingBottom: "4px", borderBottom: "1px solid #e6e6e6" }}>
              {formatDateLabel(date)}
            </div>
            {grouped[date].map((l) => (
              <div key={l.id} style={{ background: "#fafafa", border: "1px solid #ececec", borderRadius: "8px", padding: "10px 12px", marginBottom: "8px", position: "relative" }}>
                <div style={{ fontSize: "0.65rem", color: "#9CA3AF", marginBottom: "6px" }}>
                  {formatTime(l.created_at)}
                </div>
                <button onClick={() => handleDelete(l.id)}
                  style={{ position: "absolute", top: "8px", right: "8px", background: "none", border: "none", cursor: "pointer", padding: "2px 4px", color: "#D1D5DB", fontSize: "0.85rem" }}>✕</button>

                {l.worked && (
                  <div style={{ marginBottom: l.todo ? "12px" : 0 }}>
                    <div style={{ display: "inline-block", fontSize: "0.62rem", fontWeight: 700, color: "#fff", background: "#5E9972", textTransform: "uppercase", letterSpacing: "0.1em", padding: "2px 8px", borderRadius: "4px", marginBottom: "6px" }}>
                      Worked
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#333", lineHeight: 1.55, whiteSpace: "pre-wrap", paddingLeft: "12px", borderLeft: "3px solid rgba(94,153,114,0.35)", marginLeft: "2px" }}>
                      {renderWithTags(l.worked)}
                    </div>
                  </div>
                )}

                {l.todo && (
                  <div>
                    <div style={{ display: "inline-block", fontSize: "0.62rem", fontWeight: 700, color: "#fff", background: "#A07C50", textTransform: "uppercase", letterSpacing: "0.1em", padding: "2px 8px", borderRadius: "4px", marginBottom: "6px" }}>
                      Todo
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#333", lineHeight: 1.55, whiteSpace: "pre-wrap", paddingLeft: "12px", borderLeft: "3px solid rgba(160,124,80,0.35)", marginLeft: "2px" }}>
                      {renderWithTags(l.todo)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
