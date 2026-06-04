"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function CalendarConnect({ accentColor }: { accentColor: string }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div style={{ fontSize: "0.75rem", color: "#6B7280", padding: "8px 0" }}>로딩 중...</div>;
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn("google")}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "16px",
          color: accentColor,
          background: "transparent",
          border: `1px solid ${accentColor}`,
          borderRadius: "8px",
          cursor: "pointer",
          marginBottom: "16px",
        }}
      >
        Google Calendar 연결
      </button>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
      <span style={{ fontSize: "0.72rem", color: "#808080" }}>
        {session.user?.email} 연결됨
      </span>
      <button
        onClick={() => signOut()}
        style={{
          fontSize: "0.7rem",
          color: "#6B7280",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        연결 해제
      </button>
    </div>
  );
}
