import OpenAI from "openai";
import { HARU_SYSTEM_PROMPT, MOMI_SYSTEM_PROMPT, MAEUM_SYSTEM_PROMPT, MANFRED_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { createClient } from "@supabase/supabase-js";

const systemPrompts: Record<string, string> = {
  haru: HARU_SYSTEM_PROMPT,
  momi: MOMI_SYSTEM_PROMPT,
  maeum: MAEUM_SYSTEM_PROMPT,
  manfred: MANFRED_SYSTEM_PROMPT,
};

const modelMap: Record<string, string> = {
  manfred: "gpt-4o",
};

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function createSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getHealthContext(): Promise<string> {
  const supabase = createSupabase();
  const today = getToday();

  // 병렬로 오늘 데이터 조회
  const [healthRes, journalRes, schedulesRes, routinesRes, routineLogsRes, todosRes] = await Promise.all([
    supabase.from("health_logs").select("*").eq("date", today).single(),
    supabase.from("journal_entries").select("*").eq("date", today).single(),
    supabase.from("schedules").select("*").eq("date", today).order("time", { ascending: true }),
    supabase.from("routines").select("*").eq("active", true).order("id", { ascending: true }),
    supabase.from("routine_logs").select("*").eq("date", today),
    supabase.from("todos").select("*").order("created_at", { ascending: true }),
  ]);

  const health = healthRes.data;
  const journal = journalRes.data;
  const schedules = schedulesRes.data ?? [];
  const routines = routinesRes.data ?? [];
  const routineLogs = routineLogsRes.data ?? [];
  const todos = todosRes.data ?? [];

  const parts: string[] = [`[오늘 날짜: ${today}]`];

  // 건강 기록
  if (health) {
    const h: string[] = [];
    if (health.sleep_hours) h.push(`수면: ${health.sleep_hours}시간`);
    if (health.sleep_quality) h.push(`수면 질: ${health.sleep_quality}/5`);
    if (health.condition) h.push(`컨디션: ${health.condition}/5`);
    if (health.exercise) h.push(`운동: ${health.exercise}`);
    if (health.meal) h.push(`식사: ${health.meal}`);
    if (health.coffee !== undefined && health.coffee !== null) h.push(`커피: ${health.coffee}잔`);
    if (h.length > 0) parts.push(`[오늘 건강 기록] ${h.join(", ")}`);
  } else {
    parts.push("[오늘 건강 기록] 아직 없음");
  }

  // 감정 기록
  if (journal) {
    const j: string[] = [];
    if (journal.emotion) j.push(`감정: ${journal.emotion}`);
    if (journal.moment) j.push(`인상적 순간: ${journal.moment}`);
    if (j.length > 0) parts.push(`[오늘 감정 기록] ${j.join(", ")}`);
  } else {
    parts.push("[오늘 감정 기록] 아직 없음");
  }

  // 오늘 스케줄
  if (schedules.length > 0) {
    const scheduleList = schedules.map((s: { time?: string; title: string; done?: boolean }) => {
      const time = s.time ? s.time.slice(0, 5) : "종일";
      const status = s.done ? "(완료)" : "";
      return `${time} ${s.title} ${status}`.trim();
    });
    parts.push(`[오늘 스케줄] ${scheduleList.join(" / ")}`);
  } else {
    parts.push("[오늘 스케줄] 없음");
  }

  // 오늘 루틴 완료 상태
  if (routines.length > 0) {
    const logMap = new Map(routineLogs.map((l: { routine_id: number; done: boolean }) => [l.routine_id, l.done]));
    const routineList = routines.map((r: { id: number; title: string }) => {
      const done = logMap.get(r.id) ? "O" : "X";
      return `${r.title}(${done})`;
    });
    parts.push(`[오늘 루틴] ${routineList.join(", ")}`);
  }

  // 오늘 투두 상태
  const activeTodos = todos.filter((t: { done?: boolean; due_date?: string }) => {
    // due_date가 오늘이거나, due_date 없으면 done=false인 것만
    if (t.due_date) return t.due_date === today;
    return !t.done;
  });
  if (activeTodos.length > 0) {
    const todoList = activeTodos.slice(0, 8).map((t: { text: string; done?: boolean }) => {
      const status = t.done ? "O" : "X";
      return `${t.text}(${status})`;
    });
    parts.push(`[오늘 할 일] ${todoList.join(", ")}`);
  }

  return parts.join("\n");
}

async function getWeeklyChatSummary(character: string): Promise<string> {
  const supabase = createSupabase();
  const sevenDaysAgo = getDateNDaysAgo(7);
  const yesterday = getDateNDaysAgo(1);

  // 최근 7일간 assistant 메시지 조회 (오늘 제외, 어제까지)
  const { data } = await supabase
    .from("chat_messages")
    .select("message, date")
    .eq("character", character)
    .eq("role", "assistant")
    .gte("date", sevenDaysAgo)
    .lte("date", yesterday)
    .order("created_at", { ascending: false })
    .limit(30);

  if (!data || data.length === 0) return "";

  // 핵심 키워드/주제 추출 (간단한 방식: 메시지에서 주요 내용 축약)
  const messages = data.map((m: { message: string; date: string }) => m.message);
  const combined = messages.join(" ");

  // 300자 이내로 압축 (가장 최근 메시지 위주)
  if (combined.length <= 300) {
    return combined;
  }

  // 최근 메시지부터 300자까지만
  let summary = "";
  for (const msg of messages) {
    // 메시지가 너무 길면 첫 문장만
    const shortMsg = msg.length > 80 ? msg.slice(0, 80) + "..." : msg;
    if ((summary + " / " + shortMsg).length > 300) break;
    summary = summary ? summary + " / " + shortMsg : shortMsg;
  }

  return summary;
}

export async function POST(request: Request) {
  const { character, messages, apiKey } = await request.json();

  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    return Response.json({ error: "No API key" }, { status: 401 });
  }

  const basePrompt = systemPrompts[character];
  if (!basePrompt) {
    return Response.json({ error: "Unknown character" }, { status: 400 });
  }

  try {
    let systemPrompt: string;

    if (character === "manfred") {
      // 맨프레드는 건강·일정 컨텍스트 없이 순수 페르소나로 동작
      const weeklySummary = await getWeeklyChatSummary(character);
      systemPrompt = basePrompt;
      if (weeklySummary) {
        systemPrompt += `\n\n## 최근 대화 요약\n${weeklySummary}`;
      }
    } else {
      const [healthContext, weeklySummary] = await Promise.all([
        getHealthContext(),
        getWeeklyChatSummary(character),
      ]);
      systemPrompt = `${basePrompt}\n\n## 사용자의 오늘 상태 (DB 기록)\n${healthContext}`;
      if (weeklySummary) {
        systemPrompt += `\n\n## 최근 7일 대화 요약\n${weeklySummary}`;
      }
    }

    const openai = new OpenAI({ apiKey: key });

    const openaiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m: { role: string; text: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.text,
      })),
    ];

    const response = await openai.chat.completions.create({
      model: modelMap[character] ?? "gpt-4o-mini",
      max_tokens: 600,
      messages: openaiMessages,
    });

    const text = response.choices[0]?.message?.content ?? "";

    return Response.json({ text });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "AI 요청 실패";
    return Response.json({ error: message }, { status: 500 });
  }
}
