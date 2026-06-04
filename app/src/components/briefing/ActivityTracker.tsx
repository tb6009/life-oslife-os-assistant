"use client";

import { useEffect, useState } from "react";
import { getThesisLogs, getProjectComments, getTodos, getChatMessagesByRange, getRoutineLogsByRange } from "@/lib/supabase/api";
import { extractTags, getTagColor } from "@/lib/tags";

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface TagStat {
  tag: string;
  days: Set<string>;
  count: number;
  sources: Set<string>;
}

export default function ActivityTracker() {
  const [stats, setStats] = useState<TagStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const days7: string[] = [];
      for (let i = 6; i >= 0; i--) {
        days7.push(toDateStr(new Date(Date.now() - i * 86400000)));
      }
      const start = days7[0];
      const end = days7[6];

      const [theses, projComments, todos, chats, routineLogs] = await Promise.all([
        getThesisLogs(500),
        getProjectComments(start, end),
        getTodos(),
        getChatMessagesByRange(start, end),
        getRoutineLogsByRange(start, end),
      ]);

      const map: Record<string, TagStat> = {};
      const bump = (tag: string, date: string, source: string) => {
        if (date < start) return;
        if (!map[tag]) map[tag] = { tag, days: new Set(), count: 0, sources: new Set() };
        map[tag].days.add(date);
        map[tag].sources.add(source);
      };

      // Thesis
      for (const l of theses as Array<{ worked: string; todo: string; created_at: string }>) {
        const date = toDateStr(new Date(l.created_at));
        for (const t of extractTags(`${l.worked ?? ""} ${l.todo ?? ""}`)) bump(t, date, "thesis");
      }
      // Work (project_comments) — date column is the activity date
      for (const c of projComments as Array<{ comment: string; date: string }>) {
        for (const t of extractTags(c.comment ?? "")) bump(t, c.date, "work");
      }
      // Todos
      for (const t of todos as Array<{ text: string; created_at: string }>) {
        const date = toDateStr(new Date(t.created_at));
        for (const tag of extractTags(t.text ?? "")) bump(tag, date, "todo");
      }
      // Haru (user messages only)
      for (const m of chats as Array<{ message: string; date: string }>) {
        for (const t of extractTags(m.message ?? "")) bump(t, m.date, "haru");
      }
      // Routine (체크된 항목만, 루틴 제목의 #태그)
      for (const r of routineLogs as Array<{ done: boolean; date: string; routines: { title: string } | null }>) {
        if (!r.done || !r.routines?.title) continue;
        for (const t of extractTags(r.routines.title)) bump(t, r.date, "routine");
      }

      Object.values(map).forEach((s) => { s.count = s.days.size; });
      const arr = Object.values(map).sort((a, b) => b.count - a.count);
      setStats(arr);
      setLoading(false);
    })();
  }, []);

  const days7: string[] = [];
  for (let i = 6; i >= 0; i--) {
    days7.push(toDateStr(new Date(Date.now() - i * 86400000)));
  }

  return (
    <div style={{ marginTop: "8px", marginBottom: "18px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "10px" }}>
        <div className="font-heading" style={{ fontSize: "0.72rem", fontWeight: 600, color: "#111", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Activity
        </div>
        <div style={{ fontSize: "0.68rem", color: "#9CA3AF", fontFamily: "var(--font-heading, inherit)" }}>최근 7일 · 5개 소스</div>
      </div>

      {loading ? (
        <div style={{ fontSize: "0.78rem", color: "#9CA3AF" }}>불러오는 중...</div>
      ) : stats.length === 0 ? (
        <div style={{ fontSize: "0.78rem", color: "#9CA3AF", lineHeight: 1.5 }}>
          아직 #태그가 없어요. Thesis / Work / Todo / 하루 입력 본문에 <span style={{ background: "#fff", padding: "1px 6px", borderRadius: "4px", color: "#6B7280" }}>#논문읽기</span> 같이 적으면 여기에 집계됩니다.
        </div>
      ) : (
        stats.slice(0, 6).map(({ tag, days, count, sources }) => {
          const c = getTagColor(tag);
          return (
            <div key={tag} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "5px 0", fontSize: "0.8rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 500, padding: "2px 8px", borderRadius: "10px", flexShrink: 0, minWidth: "78px", background: c.bg, color: c.text }}>
                #{tag}
              </span>
              <div style={{ display: "flex", gap: "3px", flex: 1 }}>
                {days7.map((d) => (
                  <div key={d} style={{
                    width: "10px", height: "10px", borderRadius: "50%",
                    background: days.has(d) ? c.text : "#E5E7EB",
                    opacity: days.has(d) ? 0.85 : 1,
                  }} />
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, width: "60px" }}>
                <span style={{ fontSize: "0.7rem", color: "#6B7280", fontWeight: 500 }}>{count}일</span>
                <span style={{ fontSize: "0.58rem", color: "#9CA3AF" }}>{[...sources].join("·")}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
