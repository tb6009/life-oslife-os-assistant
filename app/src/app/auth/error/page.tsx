"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "서버 설정 오류 — GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET 환경변수를 확인하세요.",
    AccessDenied: "접근 거부 — Google 계정 권한이 거부되었습니다.",
    Verification: "인증 토큰 오류 — 다시 시도하세요.",
    OAuthSignin: "OAuth 로그인 시작 실패 — Google Client ID를 확인하세요.",
    OAuthCallback: "OAuth 콜백 오류 — 리디렉션 URI가 Google Console과 일치하는지 확인하세요.",
    OAuthCreateAccount: "계정 생성 실패",
    EmailCreateAccount: "이메일 계정 생성 실패",
    Callback: "콜백 처리 오류",
    OAuthAccountNotLinked: "다른 로그인 방식으로 이미 가입된 이메일입니다.",
    Default: "알 수 없는 오류가 발생했습니다.",
  };

  return (
    <div style={{ padding: "40px 28px", maxWidth: "400px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "16px" }}>로그인 오류</h1>
      <div style={{ padding: "16px", background: "#FEF2F2", borderRadius: "8px", marginBottom: "16px" }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#DC2626", marginBottom: "8px" }}>
          Error: {error || "unknown"}
        </div>
        <div style={{ fontSize: "0.78rem", color: "#333", lineHeight: 1.6 }}>
          {errorMessages[error ?? ""] || errorMessages.Default}
        </div>
      </div>
      <a href="/settings" style={{ fontSize: "0.85rem", color: "#60A5FA" }}>← 설정으로 돌아가기</a>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px 28px" }}>로딩 중...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
