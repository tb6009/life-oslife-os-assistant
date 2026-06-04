"use client";

import { useState, useEffect } from "react";
import { characters } from "@/lib/types/briefing";
import type { Character } from "@/lib/types/briefing";

interface CharacterTabsProps {
  active: Character;
  accentColor: string;
  onSelect: (character: Character) => void;
}

export default function CharacterTabs({
  active,
  accentColor,
  onSelect,
}: CharacterTabsProps) {
  const [apiConnected, setApiConnected] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem("openai_api_key");
    setApiConnected(!!key && key.length > 10);
  }, [active]); // 탭 전환 시마다 체크

  return (
    <div className="flex py-1.5">
      {characters.map((char) => {
        const isActive = char.id === active;
        const needsApi = char.id === "momi" || char.id === "maeum";
        const disconnected = needsApi && !apiConnected;

        return (
          <button
            key={char.id}
            className="flex-1 text-center py-1 relative cursor-pointer"
            onClick={() => onSelect(char.id)}
          >
            {/* Active indicator */}
            {isActive && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 transition-colors duration-600"
                style={{ background: disconnected ? "#DC2626" : accentColor }}
              />
            )}
            <span
              style={{
                display: "block",
                fontSize: "0.95rem",
                fontWeight: 700,
                transition: "color 0.3s",
                color: disconnected
                  ? "#DC2626"
                  : isActive
                  ? "#000"
                  : "#6B7280",
              }}
            >
              {char.name}
            </span>
            <span
              className="block font-heading text-[0.7rem] tracking-[0.05em] uppercase mt-px transition-colors duration-600"
              style={{
                color: disconnected
                  ? "#DC2626"
                  : isActive
                  ? accentColor
                  : "#6B7280",
              }}
            >
              {disconnected ? "API 미연결" : char.role}
            </span>
          </button>
        );
      })}
    </div>
  );
}
