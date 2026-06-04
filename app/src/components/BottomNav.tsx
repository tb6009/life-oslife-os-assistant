"use client";

import { usePathname, useRouter } from "next/navigation";

const tabs = [
  { path: "/", name: "홈", role: "Briefing" },
  { path: "/diary", name: "기록", role: "Diary" },
  { path: "/haru", name: "하루", role: "Assistant" },
  { path: "/settings", name: "설정", role: "Settings" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: "100%",
        width: "100%",
        background: "#fff",
        borderTop: "1px solid #e6e6e6",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        zIndex: 30,
      }}
    >
      <div style={{ display: "flex", padding: "6px 0 4px" }}>
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              style={{
                flex: 1,
                textAlign: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                position: "relative",
                padding: "4px 0",
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    top: "-7px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "20px",
                    height: "2px",
                    background: "#60A5FA",
                  }}
                />
              )}
              <span
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: isActive ? "#000" : "#b3b3b3",
                }}
              >
                {tab.name}
              </span>
              <span
                className="font-heading"
                style={{
                  display: "block",
                  fontSize: "0.48rem",
                  color: isActive ? "#60A5FA" : "#b3b3b3",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {tab.role}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
