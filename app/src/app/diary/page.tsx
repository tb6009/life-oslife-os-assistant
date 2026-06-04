"use client";

import { useState } from "react";
import TodayTab from "./TodayTab";
import WeekTab from "./WeekTab";
import MonthTab from "./MonthTab";
import WorkTab from "./WorkTab";
import ThesisTab from "./ThesisTab";

const tabs = ["Today", "Week", "Month", "Work", "Thesis"] as const;
type Tab = typeof tabs[number];

export default function DiaryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Today");

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div style={{ padding: "18px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div className="font-heading" style={{ fontSize: "1.3rem", fontWeight: 700, color: "#000" }}>Diary</div>
      </div>

      {/* Sub tabs */}
      <div style={{ display: "flex", padding: "12px 28px 0", gap: "0", borderBottom: "1px solid #e6e6e6" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="font-heading"
            style={{
              flex: 1,
              textAlign: "center",
              padding: "8px 0",
              fontSize: "0.75rem",
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? "#000" : "#6B7280",
              background: "none",
              border: "none",
              cursor: "pointer",
              position: "relative",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {tab}
            {activeTab === tab && (
              <div style={{
                position: "absolute",
                bottom: "-1px",
                left: "20%",
                right: "20%",
                height: "2px",
                background: "#60A5FA",
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Today" && <TodayTab />}
      {activeTab === "Week" && <WeekTab />}
      {activeTab === "Month" && <MonthTab />}
      {activeTab === "Work" && <WorkTab />}
      {activeTab === "Thesis" && <ThesisTab />}
    </div>
  );
}
