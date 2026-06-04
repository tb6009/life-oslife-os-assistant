"use client";

import { useState, useEffect, useCallback } from "react";
import { getHealthLog, getJournalEntry, getSchedules } from "@/lib/supabase/api";

interface DailyInsightProps {
  weather: { condition: string; temperature: string };
  accentColor: string;
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 20) return "evening";
  return "night";
}

function buildSuggestion(
  time: string,
  health: { sleep_hours?: number; condition?: number; exercise?: string } | null,
  emotion: string | null,
  todaySchedules: Array<{ title: string }>,
  tomorrowSchedules: Array<{ title: string }>
): string {
  const parts: string[] = [];

  // 건강 기반
  if (health?.sleep_hours && health.sleep_hours < 6) {
    parts.push("수면이 부족합니다. 오늘은 무리하지 마세요.");
  } else if (health?.sleep_hours && health.sleep_hours >= 7) {
    parts.push("수면 충분합니다.");
  }

  if (health?.condition && health.condition <= 2) {
    parts.push("컨디션이 좋지 않네요. 쉬는 시간을 확보하세요.");
  }

  if (health?.exercise) {
    parts.push(`${health.exercise} 운동 기록이 있어요.`);
  }

  // 감정 기반
  if (emotion === "피곤" || emotion === "무기력") {
    parts.push("좀 지치셨군요. 잠깐이라도 쉬어가세요.");
  } else if (emotion === "불안" || emotion === "막막") {
    parts.push("한 가지만 집중해보세요. 작은 것부터 시작하면 돼요.");
  } else if (emotion === "기쁨" || emotion === "감사" || emotion === "설렘") {
    parts.push("좋은 에너지네요. 이 기분을 유지하세요.");
  }

  // 스케줄 기반
  if (todaySchedules.length > 0) {
    const titles = todaySchedules.map((s) => s.title).join(", ");
    parts.push(`오늘 일정: ${titles}.`);
  } else {
    parts.push("오늘은 일정이 없어요. 여유롭게 보내세요.");
  }

  // 시간대별
  if (time === "morning" && tomorrowSchedules.length > 0) {
    parts.push(`내일은 ${tomorrowSchedules.map((s) => s.title).join(", ")}이 있어요.`);
  } else if (time === "evening" || time === "night") {
    if (tomorrowSchedules.length > 0) {
      parts.push(`내일 ${tomorrowSchedules.map((s) => s.title).join(", ")}을 위해 일찍 쉬세요.`);
    } else {
      parts.push("내일은 여유로우니 푹 쉬세요.");
    }
  }

  if (parts.length === 0) {
    return "오늘 하루도 잘 보내세요. 하루에게 편하게 말씀해주세요.";
  }

  return parts.join(" ");
}

export default function DailyInsight({
  weather,
  accentColor,
}: DailyInsightProps) {
  const [bodyStatus, setBodyStatus] = useState<string | null>(null);
  const [mindStatus, setMindStatus] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState("불러오는 중...");

  const loadStatus = useCallback(() => {
    const today = getToday();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
    const time = getTimeGreeting();

    Promise.all([
      getHealthLog(today),
      getJournalEntry(today),
      getSchedules(today),
      getSchedules(tomorrowStr),
    ]).then(([health, journal, todayS, tomorrowS]) => {
      // 상태 태그 업데이트
      if (health) {
        const parts: string[] = [];
        if (health.sleep_hours) parts.push(`수면 ${health.sleep_hours}시간`);
        if (health.condition) parts.push(`컨디션 ${health.condition}/5`);
        if (health.exercise) parts.push(health.exercise);
        if (parts.length > 0) setBodyStatus(parts.join(", "));
        else setBodyStatus(null);
      } else {
        setBodyStatus(null);
      }

      const emotion = journal?.emotion ?? null;
      setMindStatus(emotion);

      // 동적 제안 생성
      setSuggestion(buildSuggestion(time, health, emotion, todayS, tomorrowS));
    });
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  // 30분마다 DB 확인
  useEffect(() => {
    const interval = setInterval(loadStatus, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  return (
    <div style={{ marginBottom: "28px" }}>
      {/* Status pills */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
        <span style={{
          fontSize: "0.72rem", color: "#808080",
          background: "#f2f2f2", padding: "4px 10px", borderRadius: "20px",
        }}>
          {weather.condition} {weather.temperature}
        </span>

        <span style={{
          fontSize: "0.72rem",
          color: bodyStatus ? accentColor : "#6B7280",
          background: bodyStatus ? `${accentColor}10` : "#fafafa",
          border: bodyStatus ? `1px solid ${accentColor}30` : "none",
          padding: "4px 10px", borderRadius: "20px",
        }}>
          {bodyStatus ? `몸 ${bodyStatus}` : "몸 기록 없음"}
        </span>

        <span style={{
          fontSize: "0.72rem",
          color: mindStatus ? accentColor : "#6B7280",
          background: mindStatus ? `${accentColor}10` : "#fafafa",
          border: mindStatus ? `1px solid ${accentColor}30` : "none",
          padding: "4px 10px", borderRadius: "20px",
        }}>
          {mindStatus ? `마음 ${mindStatus}` : "마음 기록 없음"}
        </span>
      </div>

      {/* 동적 제안 */}
      <div
        style={{
          fontSize: "0.85rem", color: "#000", lineHeight: 1.7,
          paddingLeft: "14px", borderLeft: `2px solid ${accentColor}`,
        }}
      >
        {suggestion}
      </div>
    </div>
  );
}
