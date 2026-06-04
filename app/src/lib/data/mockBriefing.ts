import type { BriefingData } from "@/lib/types/briefing";
import type { TimeOfDay } from "@/lib/theme/timeColor";

// Google Calendar에서 실제로 가져온 5월 일정 (2026-05-02 토요일 기준)
export const mockBriefing: BriefingData = {
  date: "2026-05-02",
  today: {
    summary: "토요일 — aSSIST 아고라01",
    note: "08:30 ~ 17:30",
    items: [
      { text: "아고라01 수업 (08:30–17:30)", done: false },
    ],
  },
  tomorrow: {
    summary: "일요일 — aSSIST 아고라02",
    note: "08:30 ~ 17:30",
    items: [
      { text: "아고라02 수업 (08:30–17:30)", done: false },
    ],
  },
  yesterday: [
    { text: "노동절 (공휴일)", done: true },
  ],
  recommendation:
    "오늘 아고라01 수업이 종일입니다. 내일도 아고라02가 있으니, 오늘 수업에 집중하시고 저녁에 충분히 쉬세요.",
  weather: {
    temperature: "18°",
    condition: "맑음",
    range: "최저 12° / 최고 22°",
  },
  todos: [
    // Google Calendar 실제 일정
    { id: "gc-1", text: "5/02 (토) 아고라01 — 08:30~17:30", done: false, source: "calendar" },
    { id: "gc-2", text: "5/03 (일) 아고라02 — 08:30~17:30", done: false, source: "calendar" },
    { id: "gc-3", text: "5/04 (월) 교무회의, 취업진담 화상회의", done: false, source: "calendar" },
    { id: "gc-4", text: "5/17 (토) 주체·환경·지원 모델연구 세미나 — 종일", done: false, source: "calendar" },
    { id: "gc-5", text: "5/20 (수) 건강검진 결과 — 15:15~16:15", done: false, source: "calendar" },
    { id: "gc-6", text: "5/26 (화) 피검사 (금식·약X) — 08:00~09:00", done: false, source: "calendar" },
    { id: "gc-7", text: "5/28 (목) 질적연구방법론 과제1 마감 (연구기획안)", done: false, source: "calendar" },
    { id: "gc-8", text: "5/30 (토) 주체·환경·지원 모델연구 세미나 — 종일", done: false, source: "calendar" },
    // 수동 입력
    { id: "m-1", text: "5/28 과제 — 데이터 수집 계획서 작성", done: false, source: "manual" },
    { id: "m-2", text: "Life OS Phase 5: Supabase 설정", done: false, source: "manual" },
  ],
};

export const mockWeatherByTime: Record<
  TimeOfDay,
  { temperature: string; condition: string; range: string }
> = {
  morning: { temperature: "18°", condition: "맑음", range: "최저 12° / 최고 22°" },
  afternoon: { temperature: "22°", condition: "구름 조금", range: "최저 12° / 최고 22°" },
  evening: { temperature: "17°", condition: "맑음", range: "최저 12° / 최고 22°" },
  night: { temperature: "13°", condition: "맑음", range: "최저 12° / 최고 22°" },
};

// 시간대별 Daily Insight (모미/마음 대화 요약 + 날씨 기반 제안)
// AI 연결 후에는 실제 대화 내용을 분석하여 자동 생성
export const mockDailyInsights: Record<
  TimeOfDay,
  { bodyStatus: string | null; mindStatus: string | null; suggestion: string }
> = {
  morning: {
    bodyStatus: null,
    mindStatus: null,
    suggestion:
      "오늘 아고라01 수업이 종일 있습니다. 내일도 아고라02가 이어지니, 수업 사이 쉬는 시간에 바깥 공기를 쐬며 환기하세요.",
  },
  afternoon: {
    bodyStatus: null,
    mindStatus: null,
    suggestion:
      "오전 수업을 잘 마치셨군요. 오후에도 집중이 필요한 시간이니, 점심 후 5분 스트레칭으로 몸을 풀고 가볍게 시작하세요.",
  },
  evening: {
    bodyStatus: null,
    mindStatus: null,
    suggestion:
      "아고라01 수업, 수고하셨습니다. 내일 아고라02가 있으니 오늘 저녁은 일찍 쉬세요.",
  },
  night: {
    bodyStatus: null,
    mindStatus: null,
    suggestion:
      "오늘 아고라01을 마치셨습니다. 내일 아고라02가 있으니 자기 전 10분 스트레칭 후 충분히 주무세요.",
  },
};

// 모미 v1.5 — 몸/건강 도메인
export const mockMomiContent = {
  greeting: "(◉ ◡ ◉) 안녕하세요, 오늘 몸 상태는 어떠세요?",
  status: {
    sleep: null as string | null,
    exercise: null as string | null,
    condition: null as number | null,
  },
  message:
    "아직 오늘 건강 기록이 없네요. 수면 시간, 운동, 컨디션 중 하나라도 기록해주시면 제가 살펴볼게요.",
  prompt: "수면, 운동, 식사, 컨디션 중 기록하고 싶은 것이 있으면 말씀해주세요.",
};

// 마음 v1.5 — 감정/마인드 도메인
export const mockMaeumContent = {
  greeting: "【⊡ ◡ ⊡】 오늘 기분은 어떤가요?",
  journal: null as string[] | null,
  emotion: null as string | null,
  message:
    "오늘 아직 일기를 안 쓰셨네요. 한 줄이라도 괜찮아요. 오늘 가장 기억에 남는 순간이 뭐였어요?",
  prompt: "오늘 가장 인상 깊었던 순간, 떠오르는 감정, 내일 하고 싶은 것 — 하나만 골라서 말해봐요.",
};
