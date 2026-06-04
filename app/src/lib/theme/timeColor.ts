export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type ColorOption = "blue" | "warm" | "ink";

export const accentColors: Record<ColorOption, Record<TimeOfDay, string>> = {
  blue: { morning: "#60A5FA", afternoon: "#3B82F6", evening: "#1D4ED8", night: "#1E3A5F" },
  warm: { morning: "#F59E0B", afternoon: "#D97706", evening: "#B45309", night: "#78350F" },
  ink: { morning: "#A8A29E", afternoon: "#78716C", evening: "#44403C", night: "#1C1917" },
};

const isDarkSky: Record<TimeOfDay, boolean | Record<ColorOption, boolean>> = {
  morning: false,
  afternoon: false,
  evening: { blue: true, warm: false, ink: true },
  night: true,
};

export function getSkyDark(time: TimeOfDay, color: ColorOption): boolean {
  const d = isDarkSky[time];
  if (typeof d === "boolean") return d;
  return d[color] ?? false;
}

export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

export function getAccentColor(time: TimeOfDay, color: ColorOption): string {
  return accentColors[color][time];
}

export const greetings: Record<TimeOfDay, string> = {
  morning: "Good Morning",
  afternoon: "Good Afternoon",
  evening: "Good Evening",
  night: "Good Night",
};

export const briefingBy: Record<TimeOfDay, string> = {
  morning: "진 집사가 준비한 오늘의 브리핑입니다",
  afternoon: "진 집사가 준비한 오후 브리핑입니다",
  evening: "진 집사가 준비한 저녁 브리핑입니다",
  night: "진 집사가 준비한 하루 마감 브리핑입니다",
};

// 12 sky gradient definitions (from prototype-briefing.html)
export const skyGradients: Record<string, string> = {
  "morning-blue":
    "linear-gradient(180deg, #87CEEB 0%, #93D1ED 10%, #A8DAF0 20%, #B8E1F3 30%, #C8E8F5 40%, #D4EDF7 50%, #E0F1F9 60%, #EAF5FB 70%, #F2F8FC 80%, #F8FBFE 90%, #FFFFFF 100%)",
  "morning-warm":
    "linear-gradient(180deg, #FBBF24 0%, #FCC63A 10%, #FCCE50 20%, #FDD866 30%, #FDE28A 40%, #FDEBAA 50%, #FEF0C3 60%, #FEF5D8 70%, #FEF9EA 80%, #FFFCF5 90%, #FFFFFF 100%)",
  "morning-ink":
    "linear-gradient(180deg, #D6D3D1 0%, #DAD8D6 10%, #DFDDDB 20%, #E4E2E0 30%, #E9E7E5 40%, #EDECEB 50%, #F1F0EF 60%, #F5F4F3 70%, #F8F8F7 80%, #FBFBFB 90%, #FFFFFF 100%)",
  "afternoon-blue":
    "linear-gradient(180deg, #3B82F6 0%, #4A8DF7 10%, #5A98F8 20%, #6BA4F9 30%, #7DB0FA 40%, #93C5FD 50%, #A9D3FE 60%, #BFDEFE 70%, #D5E9FE 80%, #EAF4FF 90%, #FFFFFF 100%)",
  "afternoon-warm":
    "linear-gradient(180deg, #D97706 0%, #DF8818 10%, #E5992B 20%, #EBAB3E 30%, #F0BC51 40%, #F4CC6A 50%, #F7DA88 60%, #FAE5A6 70%, #FCEFC4 80%, #FEF7E2 90%, #FFFFFF 100%)",
  "afternoon-ink":
    "linear-gradient(180deg, #78716C 0%, #847D78 10%, #908A85 20%, #9C9691 30%, #A8A39E 40%, #B5B0AB 50%, #C2BEB9 60%, #CFCCC8 70%, #DCDAD7 80%, #E9E8E6 90%, #FFFFFF 100%)",
  "evening-blue":
    "linear-gradient(180deg, #1E3A5F 0%, #1E3F75 8%, #1E458B 16%, #1F4DA1 24%, #2558B8 32%, #3068CC 40%, #4078DC 48%, #5A8DE6 56%, #7AA5EF 64%, #9ABBF5 72%, #BAD1FA 80%, #D8E6FD 90%, #FFFFFF 100%)",
  "evening-warm":
    "linear-gradient(180deg, #78350F 0%, #834012 8%, #8E4B16 16%, #9A571A 24%, #A8641F 32%, #B67325 40%, #C5842E 48%, #D49638 56%, #E0AA48 64%, #EABD60 72%, #F2D080 80%, #F8E4B0 90%, #FFFFFF 100%)",
  "evening-ink":
    "linear-gradient(180deg, #1C1917 0%, #252220 8%, #2F2C29 16%, #393633 24%, #44413D 32%, #504C48 40%, #5D5954 48%, #6B6661 56%, #7A756F 64%, #8A857F 72%, #9C9790 80%, #C0BCB6 90%, #FFFFFF 100%)",
  "night-blue":
    "linear-gradient(180deg, #0c1445 0%, #101A52 8%, #142060 16%, #18286F 24%, #1C3180 32%, #213D94 40%, #274CA8 48%, #2F5EBC 56%, #3A72CF 64%, #4E89DE 72%, #6BA1EA 80%, #96C0F2 90%, #FFFFFF 100%)",
  "night-warm":
    "linear-gradient(180deg, #451a03 0%, #512206 8%, #5E2A09 16%, #6B330C 24%, #783D10 32%, #864815 40%, #95551B 48%, #A56322 56%, #B6742B 64%, #C88636 72%, #DA9A44 80%, #EBB868 90%, #FFFFFF 100%)",
  "night-ink":
    "linear-gradient(180deg, #0a0a0a 0%, #131211 8%, #1C1A18 16%, #252220 24%, #2F2B28 32%, #393532 40%, #44403C 48%, #504C47 56%, #5D5954 64%, #6B6762 72%, #7A7671 80%, #A09B96 90%, #FFFFFF 100%)",
};
