"use client";

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState("");

  useEffect(() => {
    const key = localStorage.getItem("openai_api_key") ?? "";
    setApiKey(key);
  }, []);

  function handleSave() {
    if (apiKey.trim()) {
      localStorage.setItem("openai_api_key", apiKey.trim());
    } else {
      localStorage.removeItem("openai_api_key");
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const isConnected = apiKey.length > 10;

  return (
    <div style={{ width: "100%", padding: "18px 28px" }}>
      <div className="font-heading" style={{ fontSize: "1.3rem", fontWeight: 700, color: "#000", marginBottom: "24px" }}>
        Settings
      </div>

      {/* API Key */}
      <div style={{ marginBottom: "24px" }}>
        <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
          ChatGPT API Key
        </div>
        <div style={{ fontSize: "0.75rem", color: "#808080", marginBottom: "12px", lineHeight: 1.5 }}>
          친구들(모미/마음) AI 대화에 사용됩니다.
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: isConnected ? "#059669" : "#DC2626",
          }} />
          <span style={{ fontSize: "0.75rem", color: isConnected ? "#059669" : "#DC2626" }}>
            {isConnected ? "연결됨" : "미연결"}
          </span>
        </div>

        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          style={{
            width: "100%",
            fontSize: "16px",
            color: "#333",
            background: "#f8f8f8",
            border: "1px solid #e6e6e6",
            borderRadius: "8px",
            padding: "10px 14px",
            outline: "none",
            fontFamily: "monospace",
            marginBottom: "10px",
          }}
        />

        <button
          onClick={handleSave}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "#fff",
            background: saved ? "#059669" : "#000",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "background 0.3s",
          }}
        >
          {saved ? "저장 완료" : "저장"}
        </button>
      </div>

      {/* Google Calendar */}
      <div style={{ marginBottom: "24px", borderTop: "1px solid #e6e6e6", paddingTop: "20px" }}>
        <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
          Google Calendar
        </div>

        {session ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#059669" }} />
              <span style={{ fontSize: "0.75rem", color: "#059669" }}>
                {session.user?.email} 연결됨
              </span>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={async () => {
                  setSyncing(true);
                  setSyncResult("");
                  try {
                    const res = await fetch("/api/calendar");
                    const data = await res.json();
                    if (data.error) {
                      setSyncResult("동기화 실패: " + data.error);
                    } else {
                      setSyncResult(`동기화 완료 — ${data.synced ?? 0}건 저장`);
                    }
                  } catch {
                    setSyncResult("동기화 실패");
                  }
                  setSyncing(false);
                }}
                disabled={syncing}
                style={{
                  flex: 1,
                  padding: "10px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#fff",
                  background: syncing ? "#6B7280" : "#000",
                  border: "none",
                  borderRadius: "10px",
                  cursor: syncing ? "not-allowed" : "pointer",
                }}
              >
                {syncing ? "동기화 중..." : "지금 동기화"}
              </button>
              <button
                onClick={() => signOut()}
                style={{
                  padding: "10px 16px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#6B7280",
                  background: "transparent",
                  border: "1px solid #e6e6e6",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
              >
                해제
              </button>
            </div>
            {syncResult && (
              <div style={{ fontSize: "0.72rem", color: syncResult.includes("실패") ? "#DC2626" : "#059669", marginTop: "8px" }}>
                {syncResult}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: "0.75rem", color: "#808080", marginBottom: "12px", lineHeight: 1.5 }}>
              Google Calendar을 연결하면 일정이 자동으로 동기화됩니다.
            </div>
            <button
              onClick={() => signIn("google")}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#60A5FA",
                background: "transparent",
                border: "1px solid #60A5FA",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              Google Calendar 연결
            </button>
          </>
        )}
      </div>

      {/* Info */}
      <div style={{ borderTop: "1px solid #e6e6e6", paddingTop: "20px" }}>
        <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
          About
        </div>
        <div style={{ fontSize: "0.75rem", color: "#808080", lineHeight: 1.7 }}>
          Life OS — Stage 8<br />
          진 · 모미 · 마음 → 하루<br />
          <span style={{ color: "#6B7280" }}>API 키는 이 기기에만 저장됩니다</span>
        </div>
      </div>

      {/* Version */}
      <div style={{ borderTop: "1px solid #e6e6e6", marginTop: "20px", paddingTop: "16px" }}>
        <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
          Version
        </div>
        <div style={{ fontSize: "0.72rem", color: "#6B7280", lineHeight: 1.8, fontFamily: "'Inter', monospace" }}>
          <div style={{ fontWeight: 600, color: "#333" }}>v0.9.4</div>
          <div style={{ color: "#9CA3AF" }}>Build: {process.env.NEXT_PUBLIC_BUILD_ID || "dev"}</div>
          <div style={{ color: "#9CA3AF" }}>Deployed: {process.env.NEXT_PUBLIC_DEPLOY_TIME || "local"}</div>
        </div>

        <div style={{ marginTop: "16px", fontSize: "0.7rem", color: "#6B7280", lineHeight: 1.7 }}>
          <div style={{ fontWeight: 600, color: "#333", marginBottom: "4px" }}>v0.9.4 — 2026-05-13</div>
          <div>· BottomNav 순서 변경: 홈/기록/하루/설정</div>
          <div>· Design History: v2.0 KILLED + v0.9.4 기록</div>

          <div style={{ fontWeight: 600, color: "#333", marginTop: "12px", marginBottom: "4px" }}>v0.9.3 — 2026-05-13</div>
          <div>· 하루 메모리 시스템 (프로필 + 주간 요약 + 맞춤 인사)</div>
          <div>· 홈 스케줄 체크 버튼 + Rec 삭제 버튼</div>
          <div>· Week 주간 네비게이션 + 타이틀 + 차트 기준선</div>
          <div>· Daily Review 완료/못한 것 분리</div>
          <div>· Google Calendar OAuth + 시간 KST 수정</div>

          <div style={{ fontWeight: 600, color: "#333", marginTop: "12px", marginBottom: "4px" }}>v0.9.0 — 2026-05-09</div>
          <div>· 커피 잔수 트래킹 (스테퍼 + Week/Month 차트)</div>
          <div>· Google Calendar → Supabase 자동 동기화</div>
          <div>· Todo 삭제(✕) 버튼 + 생성/완료 시간 표시</div>
          <div>· Google Calendar 설정 UI + OAuth 연결</div>

          <div style={{ fontWeight: 600, color: "#333", marginTop: "12px", marginBottom: "4px" }}>v0.8.0 — 2026-05-07</div>
          <div>· 텍스트 대비 #b3b3b3→#6B7280 (4.6:1)</div>
          <div>· 최소 폰트 0.7rem 상향</div>
          <div>· Tomorrow/Upcoming 접힘 가능 섹션</div>
          <div>· 하루 채팅 헤더 최소화, "하루" 이름 제거</div>
          <div>· 수면 차트 범례 추가</div>

          <div style={{ fontWeight: 600, color: "#333", marginTop: "12px", marginBottom: "4px" }}>v0.7.0 — 2026-05-03~05</div>
          <div>· 루틴 시스템 (연속 일수 + 🔥)</div>
          <div>· 주간/월간 리포트 + 회고</div>
          <div>· 하루 MI 공감 대화 스타일</div>
          <div>· 감정 컬러 10색 + 폰트 Inter/DM Sans</div>

          <div style={{ fontWeight: 600, color: "#333", marginTop: "12px", marginBottom: "4px" }}>v0.6.0 — 2026-05-03</div>
          <div>· 하루 캐릭터 통합 비서</div>
          <div>· 기록 Week/Month 대시보드</div>
          <div>· Daily Insight + Recommendation</div>

          <div style={{ fontWeight: 600, color: "#333", marginTop: "12px", marginBottom: "4px" }}>v0.5.0 — 2026-05-03</div>
          <div>· Diary 시안 + Nav A vs B → 4탭 결정</div>

          <div style={{ fontWeight: 600, color: "#333", marginTop: "12px", marginBottom: "4px" }}>v0.4.0 — 2026-05-02</div>
          <div>· Next.js 앱 + Supabase + ChatGPT API</div>
          <div>· Vercel 배포</div>

          <div style={{ fontWeight: 600, color: "#333", marginTop: "12px", marginBottom: "4px" }}>v0.1~0.3 — 2026-05-02</div>
          <div>· 무드보드 → 흰 배경 전환 → 프로토타입</div>
        </div>
      </div>
    </div>
  );
}
