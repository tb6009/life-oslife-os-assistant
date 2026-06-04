"use client";

import { skyGradients, getSkyDark } from "@/lib/theme/timeColor";
import type { TimeOfDay, ColorOption } from "@/lib/theme/timeColor";

interface WeatherHeroProps {
  timeOfDay: TimeOfDay;
  colorOption: ColorOption;
  temperature: string;
  condition: string;
  range: string;
}

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export default function WeatherHero({
  timeOfDay,
  colorOption,
  temperature,
  condition,
  range,
}: WeatherHeroProps) {
  const gradientKey = `${timeOfDay}-${colorOption}`;
  const gradient = skyGradients[gradientKey];
  const isDark = getSkyDark(timeOfDay, colorOption);
  const textColor = isDark ? "#FFFFFF" : "#000000";
  const subColor = isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.65)";
  const muteColor = isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)";

  const now = new Date();
  const day = DAYS[now.getDay()];
  const date = `${MONTHS[now.getMonth()]} ${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div className="px-7 pt-5">
      <div
        className="rounded-[20px] p-5 transition-all duration-800"
        style={{ background: gradient }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div
              className="font-heading"
              style={{ fontSize: "0.65rem", fontWeight: 500, color: muteColor, letterSpacing: "0.08em", marginBottom: "6px" }}
            >
              진&apos;s LifeOS
            </div>
            <div
              className="font-heading font-light leading-none"
              style={{ fontSize: "3rem", letterSpacing: "-0.03em", color: textColor }}
            >
              {temperature}
            </div>
            <div className="flex items-baseline gap-3 mt-2">
              <span style={{ fontSize: "0.9rem", fontWeight: 500, color: textColor }}>{condition}</span>
              <span style={{ fontSize: "0.78rem", color: subColor }}>{range}</span>
            </div>
          </div>
          <div className="text-right font-heading">
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: textColor, letterSpacing: "0.08em" }}>{day}</div>
            <div style={{ fontSize: "0.78rem", color: subColor, letterSpacing: "0.06em", marginTop: "2px" }}>{date}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
