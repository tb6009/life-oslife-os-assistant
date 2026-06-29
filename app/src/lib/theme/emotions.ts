// 카테고리별 감정어 (각 8개)
export const emotionsByCategory = {
  positive: ["기쁨", "설렘", "활기", "뿌듯함", "몰입", "감사", "평온", "충만"],
  neutral:  ["차분", "무덤덤", "멍함", "졸림", "호기심", "놀람", "생각많음", "집중"],
  negative: ["짜증", "분노", "불안", "초조", "슬픔", "외로움", "무기력", "막막"],
} as const;

export type EmotionCategory = keyof typeof emotionsByCategory;

// 색상: 카테고리 기조 + 개별 미세 차이
export const emotionColors: Record<string, string> = {
  // positive — 따뜻한 톤
  "기쁨": "#FBBF24", "설렘": "#F472B6", "활기": "#FB7185", "뿌듯함": "#FCD34D",
  "몰입": "#FB923C", "감사": "#34D399", "평온": "#60A5FA", "충만": "#A78BFA",
  // neutral — 그레이 톤
  "차분": "#94A3B8", "무덤덤": "#9CA3AF", "멍함": "#CBD5E1", "졸림": "#D1D5DB",
  "호기심": "#A3A3A3", "놀람": "#9CA3AF", "생각많음": "#8B949E", "집중": "#7C8794",
  // negative — 차가운/어두운 톤
  "짜증": "#FB923C", "분노": "#EF4444", "불안": "#A78BFA", "초조": "#C084FC",
  "슬픔": "#818CF8", "외로움": "#C4B5FD", "무기력": "#6B7280", "막막": "#4B5563",
  // legacy (과거 데이터 호환)
  "피곤": "#CBD5E1", "우울": "#6366F1",
};

// legacy export (TodayTab.tsx 외 다른 파일 호환)
export const emotionList = [...emotionsByCategory.positive, ...emotionsByCategory.neutral, ...emotionsByCategory.negative];

export function getEmotionColor(emotion: string): string {
  return emotionColors[emotion] ?? "#6B7280";
}

export function getEmotionCategory(emotion: string): EmotionCategory | null {
  for (const cat of Object.keys(emotionsByCategory) as EmotionCategory[]) {
    if ((emotionsByCategory[cat] as readonly string[]).includes(emotion)) return cat;
  }
  return null;
}

// 에너지 레벨: -3 ~ +3 (7단계)
export const energyLabels: Record<number, string> = {
  [-3]: "매우 낮음",
  [-2]: "낮음",
  [-1]: "약간 낮음",
  [0]:  "보통",
  [1]:  "약간 높음",
  [2]:  "높음",
  [3]:  "매우 높음",
};

// 슬라이더 색: -3(파랑) → 0(흰색) → +3(빨강)
export function getEnergyColor(level: number): string {
  if (level <= -3) return "#3B82F6";
  if (level === -2) return "#60A5FA";
  if (level === -1) return "#93C5FD";
  if (level === 0)  return "#F3F4F6";
  if (level === 1)  return "#FCA5A5";
  if (level === 2)  return "#F87171";
  return "#EF4444";
}

// 시간 표시: 24h 정수 → "오후 3시" 형식
export function formatHour(hour: number): string {
  if (hour === 0) return "자정";
  if (hour === 12) return "정오";
  const period = hour < 12 ? "오전" : "오후";
  const h = hour <= 12 ? hour : hour - 12;
  return `${period} ${h}시`;
}
