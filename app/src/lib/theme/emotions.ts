export const emotionColors: Record<string, string> = {
  "기쁨": "#FBBF24",
  "평온": "#60A5FA",
  "설렘": "#F472B6",
  "감사": "#34D399",
  "무기력": "#94A3B8",
  "불안": "#A78BFA",
  "짜증": "#FB923C",
  "슬픔": "#818CF8",
  "피곤": "#CBD5E1",
  "외로움": "#C4B5FD",
  "막막": "#9CA3AF",
  "우울": "#6366F1",
};

export const emotionList = ["기쁨", "평온", "설렘", "감사", "무기력", "불안", "짜증", "슬픔", "피곤", "외로움"];

export function getEmotionColor(emotion: string): string {
  return emotionColors[emotion] ?? "#6B7280";
}
