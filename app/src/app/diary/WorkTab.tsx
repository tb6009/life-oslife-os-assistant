"use client";

import { useState, useEffect, useRef } from "react";
import { getProjectComments, addProjectComment, deleteProjectComment, getProjectCommentsByProject } from "@/lib/supabase/api";
import TagText from "@/components/TagText";

// 프로젝트 타입별 색상 — 063 대시보드 tokens.css 기반
const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  product:    { bg: "rgba(138,168,201,0.15)", text: "#5A86B0" },   // blue
  system:     { bg: "rgba(164,147,194,0.15)", text: "#7E6BA8" },   // violet
  design:     { bg: "rgba(196,147,172,0.15)", text: "#A8728A" },   // pink
  research:   { bg: "rgba(139,184,154,0.15)", text: "#5E9972" },   // green
  data:       { bg: "rgba(196,160,122,0.15)", text: "#A07C50" },   // orange
  education:  { bg: "rgba(191,172,126,0.15)", text: "#9A8A55" },   // amber
  publishing: { bg: "rgba(201,145,142,0.15)", text: "#A86B68" },   // red
};

const RECENT_PROJECTS = [
  { id: "061", name: "LifeOS",      type: "product" },
  { id: "063", name: "대시보드",     type: "product" },
  { id: "091", name: "출판기획",     type: "publishing" },
  { id: "10",  name: "마음 챗봇",    type: "product" },
  { id: "03",  name: "디자인실무",   type: "design" },
  { id: "065", name: "인터뷰",      type: "data" },
  { id: "062", name: "논문리더",     type: "product" },
  { id: "32",  name: "강연시리즈",   type: "education" },
  { id: "05",  name: "DSAPG",       type: "research" },
  { id: "064", name: "프로젝트매뉴얼", type: "education" },
  { id: "MA",  name: "Master",      type: "research" },
  { id: "09",  name: "수업",        type: "education" },
];

function getProjectColor(projId: string): { bg: string; text: string } {
  const proj = RECENT_PROJECTS.find((p) => p.id === projId);
  return TYPE_COLORS[proj?.type ?? ""] ?? { bg: "rgba(96,165,250,0.1)", text: "#60A5FA" };
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

interface Comment {
  id: number;
  project_id: string;
  project_name: string;
  comment: string;
  date: string;
  created_at: string;
}

type ViewMode = "date" | "project";

export default function WorkTab() {
  const [selectedProject, setSelectedProject] = useState(RECENT_PROJECTS[0]);
  const [customMode, setCustomMode] = useState(false);
  const [customId, setCustomId] = useState("");
  const [customName, setCustomName] = useState("");
  const [input, setInput] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [projectComments, setProjectComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("date");
  const [viewProject, setViewProject] = useState<{ id: string; name: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 최근 7일 코멘트 로드
  useEffect(() => {
    const end = toDateStr(new Date());
    const start = toDateStr(new Date(Date.now() - 6 * 86400000));
    getProjectComments(start, end).then((data) => {
      setComments(data as Comment[]);
      setLoading(false);
    });
  }, []);

  // 프로젝트별 보기 로드
  async function loadProjectView(projId: string, projName: string) {
    setViewMode("project");
    setViewProject({ id: projId, name: projName });
    const data = await getProjectCommentsByProject(projId, 50);
    setProjectComments(data as Comment[]);
  }

  async function handleAdd() {
    const text = input.trim();
    if (!text) return;
    const projId = customMode ? customId.trim() : selectedProject.id;
    const projName = customMode ? customName.trim() : selectedProject.name;
    if (!projId) return;
    const today = toDateStr(new Date());
    await addProjectComment(projId, projName || projId, text, today);
    setInput("");
    if (customMode) { setCustomId(""); setCustomName(""); setCustomMode(false); }
    // 양쪽 새로고침
    const end = today;
    const start = toDateStr(new Date(Date.now() - 6 * 86400000));
    const data = await getProjectComments(start, end);
    setComments(data as Comment[]);
    if (viewMode === "project" && viewProject?.id === projId) {
      const pData = await getProjectCommentsByProject(projId, 50);
      setProjectComments(pData as Comment[]);
    }
  }

  async function handleDelete(id: number) {
    setComments((prev) => prev.filter((c) => c.id !== id));
    setProjectComments((prev) => prev.filter((c) => c.id !== id));
    await deleteProjectComment(id);
  }

  // 날짜별 그룹
  const grouped: Record<string, Comment[]> = {};
  for (const c of comments) {
    if (!grouped[c.date]) grouped[c.date] = [];
    grouped[c.date].push(c);
  }
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div style={{ padding: "0 28px 24px" }}>
      <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "16px", marginBottom: "8px" }}>
        Work Log
      </div>

      {/* 프로젝트 선택 칩 */}
      <div ref={scrollRef} style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
        {RECENT_PROJECTS.map((p) => (
          <button
            key={p.id}
            onClick={() => { setSelectedProject(p); setCustomMode(false); }}
            onDoubleClick={() => loadProjectView(p.id, p.name)}
            style={{
              fontSize: "0.72rem",
              padding: "4px 10px",
              borderRadius: "14px",
              border: "none",
              cursor: "pointer",
              background: !customMode && selectedProject.id === p.id ? getProjectColor(p.id).text : getProjectColor(p.id).bg,
              color: !customMode && selectedProject.id === p.id ? "#fff" : getProjectColor(p.id).text,
              fontWeight: !customMode && selectedProject.id === p.id ? 600 : 400,
            }}
          >
            {p.name}
          </button>
        ))}
        <button
          onClick={() => setCustomMode(true)}
          style={{
            fontSize: "0.72rem",
            padding: "4px 10px",
            borderRadius: "14px",
            border: customMode ? "none" : "1px dashed #d1d5db",
            cursor: "pointer",
            background: customMode ? "#60A5FA" : "transparent",
            color: customMode ? "#fff" : "#6B7280",
          }}
        >
          + 직접입력
        </button>
      </div>

      {/* 직접입력 모드 */}
      {customMode && (
        <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
          <input value={customId} onChange={(e) => setCustomId(e.target.value)} placeholder="프로젝트 ID"
            style={{ width: "80px", fontSize: "16px", padding: "6px 8px", border: "1px solid #e6e6e6", borderRadius: "6px", background: "#f8f8f8", outline: "none", fontFamily: "inherit" }} />
          <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="프로젝트 이름"
            style={{ flex: 1, fontSize: "16px", padding: "6px 8px", border: "1px solid #e6e6e6", borderRadius: "6px", background: "#f8f8f8", outline: "none", fontFamily: "inherit" }} />
        </div>
      )}

      {/* 코멘트 입력 */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", alignItems: "flex-start" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); } }}
          placeholder={`${selectedProject.name} 코멘트 입력... (#태그, Shift+Enter 줄바꿈)`}
          rows={2}
          style={{ flex: 1, fontSize: "16px", color: "#333", background: "#f8f8f8", border: "1px solid #e6e6e6", borderRadius: "8px", padding: "10px 14px", outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.5 }}
        />
        <button onClick={handleAdd}
          style={{ fontSize: "0.78rem", fontWeight: 600, color: "#60A5FA", padding: "10px 16px", background: "transparent", border: "1px solid #60A5FA", borderRadius: "8px", cursor: "pointer" }}>
          전송
        </button>
      </div>

      {/* 보기 모드 전환 */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button onClick={() => setViewMode("date")}
          style={{ fontSize: "0.72rem", fontWeight: viewMode === "date" ? 600 : 400, color: viewMode === "date" ? "#60A5FA" : "#6B7280", background: "none", border: "none", cursor: "pointer", padding: 0, borderBottom: viewMode === "date" ? "2px solid #60A5FA" : "none", paddingBottom: "2px" }}>
          날짜별
        </button>
        <button onClick={() => loadProjectView(selectedProject.id, selectedProject.name)}
          style={{ fontSize: "0.72rem", fontWeight: viewMode === "project" ? 600 : 400, color: viewMode === "project" ? "#60A5FA" : "#6B7280", background: "none", border: "none", cursor: "pointer", padding: 0, borderBottom: viewMode === "project" ? "2px solid #60A5FA" : "none", paddingBottom: "2px" }}>
          프로젝트별
        </button>
      </div>

      {/* ===== 날짜별 보기 ===== */}
      {viewMode === "date" && (
        loading ? (
          <div style={{ fontSize: "0.84rem", color: "#6B7280" }}>불러오는 중...</div>
        ) : sortedDates.length === 0 ? (
          <div style={{ fontSize: "0.84rem", color: "#6B7280", padding: "12px 0" }}>
            아직 작업 기록이 없습니다.
          </div>
        ) : (
          sortedDates.map((date) => {
            const byProject: Record<string, Comment[]> = {};
            for (const c of grouped[date]) {
              if (!byProject[c.project_id]) byProject[c.project_id] = [];
              byProject[c.project_id].push(c);
            }
            return (
              <div key={date} style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6B7280", marginBottom: "8px", paddingBottom: "4px", borderBottom: "1px solid #e6e6e6" }}>
                  {formatDateLabel(date)}
                </div>
                {Object.entries(byProject).map(([projId, projComments]) => (
                  <div key={projId} style={{ marginBottom: "12px" }}>
                    <div
                      onClick={() => loadProjectView(projId, projComments[0].project_name || projId)}
                      style={{ fontSize: "0.7rem", fontWeight: 600, color: getProjectColor(projId).text, background: getProjectColor(projId).bg, padding: "3px 8px", borderRadius: "4px", marginBottom: "4px", display: "inline-block", cursor: "pointer" }}>
                      {projComments[0].project_name || projId}
                    </div>
                    {projComments.map((c) => (
                      <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "3px 0 3px 8px", borderLeft: `2px solid ${getProjectColor(projId).text}33` }}>
                        <span style={{ fontSize: "0.82rem", color: "#333", lineHeight: 1.5, flex: 1 }}><TagText text={c.comment} /></span>
                        <button onClick={() => handleDelete(c.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", color: "#D1D5DB", fontSize: "0.85rem", flexShrink: 0 }}>✕</button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })
        )
      )}

      {/* ===== 프로젝트별 보기 ===== */}
      {viewMode === "project" && viewProject && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#333" }}>
              {viewProject.name}
            </div>
            <span style={{ fontSize: "0.68rem", color: "#6B7280", background: "#f5f5f5", padding: "2px 8px", borderRadius: "10px" }}>
              {projectComments.length}건
            </span>
          </div>

          {/* 프로젝트 칩 — 다른 프로젝트로 전환 */}
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "12px" }}>
            {RECENT_PROJECTS.map((p) => (
              <button key={p.id} onClick={() => loadProjectView(p.id, p.name)}
                style={{
                  fontSize: "0.68rem", padding: "3px 8px", borderRadius: "12px", border: "none", cursor: "pointer",
                  background: viewProject.id === p.id ? getProjectColor(p.id).text : getProjectColor(p.id).bg,
                  color: viewProject.id === p.id ? "#fff" : getProjectColor(p.id).text,
                  fontWeight: viewProject.id === p.id ? 600 : 400,
                }}>
                {p.name}
              </button>
            ))}
          </div>

          {projectComments.length === 0 ? (
            <div style={{ fontSize: "0.84rem", color: "#6B7280", padding: "12px 0" }}>
              이 프로젝트에 아직 기록이 없습니다.
            </div>
          ) : (
            projectComments.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "6px 0 6px 8px", borderLeft: `2px solid ${getProjectColor(viewProject.id).text}33`, marginBottom: "2px" }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "0.82rem", color: "#333", lineHeight: 1.5 }}><TagText text={c.comment} /></span>
                  <div style={{ fontSize: "0.65rem", color: "#9CA3AF", marginTop: "1px" }}>{formatDateLabel(c.date)}</div>
                </div>
                <button onClick={() => handleDelete(c.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", color: "#D1D5DB", fontSize: "0.85rem", flexShrink: 0 }}>✕</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
