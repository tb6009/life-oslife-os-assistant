"use client";

import { useState, type ReactNode } from "react";

const TABS = ["Daily", "Activity", "Done"] as const;
type Tab = typeof TABS[number];

interface HomeTabsProps {
  daily: ReactNode;
  activity: ReactNode;
  done: ReactNode;
  dailyCount?: number;
  doneCount?: number;
}

export default function HomeTabs({ daily, activity, done, dailyCount, doneCount }: HomeTabsProps) {
  const [active, setActive] = useState<Tab>("Daily");

  return (
    <div style={{ marginTop: "24px" }}>
      {/* Tab Bar */}
      <div style={{ display: "flex", borderBottom: "1px solid #ececec" }}>
        {TABS.map((t) => {
          const isActive = active === t;
          const count = t === "Daily" ? dailyCount : t === "Done" ? doneCount : undefined;
          return (
            <button
              key={t}
              onClick={() => setActive(t)}
              className="font-heading"
              style={{
                flex: 1,
                textAlign: "center",
                padding: "10px 0",
                fontSize: "0.74rem",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#111" : "#9CA3AF",
                background: "none",
                border: "none",
                cursor: "pointer",
                position: "relative",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {t}
              {typeof count === "number" && (
                <span style={{ marginLeft: "4px", fontSize: "0.6rem", color: isActive ? "#111" : "#9CA3AF" }}>
                  {count}
                </span>
              )}
              {isActive && (
                <div style={{
                  position: "absolute",
                  bottom: "-1px",
                  left: "25%",
                  right: "25%",
                  height: "2px",
                  background: "#111",
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Active panel */}
      <div style={{ paddingTop: "8px" }}>
        {active === "Daily" && daily}
        {active === "Activity" && activity}
        {active === "Done" && done}
      </div>
    </div>
  );
}
