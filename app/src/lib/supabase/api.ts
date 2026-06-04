import { supabase } from "./client";

// ── Todo ──

export async function getTodos() {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) console.error("getTodos error:", error);
  return data ?? [];
}

export async function addTodo(text: string, source: "manual" | "calendar" = "manual", dueDate?: string) {
  const { data, error } = await supabase
    .from("todos")
    .insert({ text, source, due_date: dueDate ?? null })
    .select()
    .single();
  if (error) console.error("addTodo error:", error);
  return data;
}

export async function toggleTodo(id: number, done: boolean) {
  const { error } = await supabase
    .from("todos")
    .update({ done, completed_at: done ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) console.error("toggleTodo error:", error);
}

export async function deleteTodo(id: number) {
  const { error } = await supabase.from("todos").delete().eq("id", id);
  if (error) console.error("deleteTodo error:", error);
}

// 오늘 진행 토글: 같은 날 다시 누르면 취소
export async function progressTodo(id: number) {
  const { data: row, error: readErr } = await supabase
    .from("todos")
    .select("last_progressed_at, progress_count")
    .eq("id", id)
    .single();
  if (readErr || !row) {
    console.error("progressTodo read error:", readErr);
    return null;
  }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const last = row.last_progressed_at ? new Date(row.last_progressed_at) : null;
  if (last) last.setHours(0, 0, 0, 0);
  const isTodayAlready = !!last && last.getTime() === today.getTime();

  const next = isTodayAlready
    ? { last_progressed_at: null, progress_count: Math.max(0, (row.progress_count ?? 0) - 1) }
    : { last_progressed_at: new Date().toISOString(), progress_count: (row.progress_count ?? 0) + 1 };

  const { error: writeErr } = await supabase.from("todos").update(next).eq("id", id);
  if (writeErr) console.error("progressTodo write error:", writeErr);
  return next;
}

export async function addRoutineByChat(title: string) {
  const { data, error } = await supabase
    .from("routines")
    .insert({ title })
    .select()
    .single();
  if (error) console.error("addRoutineByChat error:", error);
  return data;
}

export async function removeRoutineByChat(title: string) {
  const { error } = await supabase
    .from("routines")
    .update({ active: false })
    .ilike("title", `%${title}%`);
  if (error) console.error("removeRoutineByChat error:", error);
}

export async function deactivateRoutine(id: number) {
  const { error } = await supabase
    .from("routines")
    .update({ active: false })
    .eq("id", id);
  if (error) console.error("deactivateRoutine error:", error);
}

// ── Chat Messages ──

export async function getChatMessages(character: "momi" | "maeum", date: string) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("character", character)
    .eq("date", date)
    .order("created_at", { ascending: true });
  if (error) console.error("getChatMessages error:", error);
  return data ?? [];
}

export async function saveChatMessage(
  character: "momi" | "maeum",
  role: "user" | "assistant",
  message: string,
  date: string
) {
  const { error } = await supabase
    .from("chat_messages")
    .insert({ character, role, message, date });
  if (error) console.error("saveChatMessage error:", error);
}

// ── Schedules ──

export async function getSchedules(date: string) {
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("date", date)
    .order("time", { ascending: true });
  if (error) console.error("getSchedules error:", error);
  return data ?? [];
}

export async function toggleScheduleDone(id: number, done: boolean) {
  const { error } = await supabase
    .from("schedules")
    .update({ done })
    .eq("id", id);
  if (error) console.error("toggleScheduleDone error:", error);
}

export async function syncSchedulesFromCalendar(
  events: Array<{ title: string; time: string | null; date: string; source?: string }>
) {
  for (const ev of events) {
    // 같은 날짜+제목+시간이 이미 있으면 스킵
    const query = supabase
      .from("schedules")
      .select("id")
      .eq("date", ev.date)
      .eq("title", ev.title);
    if (ev.time) query.eq("time", ev.time);
    const { data: existing } = await query.limit(1);
    if (existing && existing.length > 0) continue;
    const { error } = await supabase
      .from("schedules")
      .insert({ date: ev.date, title: ev.title, time: ev.time, source: ev.source ?? "google" });
    if (error) console.error("syncSchedule insert error:", error);
  }
}

export async function deleteSchedule(id: number) {
  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) console.error("deleteSchedule error:", error);
}

// ── Daily Insight ──

export async function getDailyInsight(date: string) {
  const { data, error } = await supabase
    .from("daily_insights")
    .select("*")
    .eq("date", date)
    .single();
  if (error && error.code !== "PGRST116") console.error("getDailyInsight error:", error);
  return data;
}

// ── Health Log ──

export async function getHealthLog(date: string) {
  const { data, error } = await supabase
    .from("health_logs")
    .select("*")
    .eq("date", date)
    .single();
  if (error && error.code !== "PGRST116") console.error("getHealthLog error:", error);
  return data;
}

export async function upsertHealthLog(
  date: string,
  updates: { sleep_hours?: number; sleep_quality?: number; exercise?: string; meal?: string; condition?: number; memo?: string; coffee?: number }
) {
  const existing = await getHealthLog(date);

  // 업데이트할 필드만 추출 (id, created_at 등 제외)
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  );

  if (existing) {
    const { error } = await supabase
      .from("health_logs")
      .update(cleanUpdates)
      .eq("date", date);
    if (error) console.error("upsertHealthLog update error:", error);
  } else {
    const { error } = await supabase
      .from("health_logs")
      .insert({ date, ...cleanUpdates });
    if (error) console.error("upsertHealthLog insert error:", error);
  }
}

// ── Journal ──

export async function getJournalEntry(date: string) {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("date", date)
    .single();
  if (error && error.code !== "PGRST116") console.error("getJournalEntry error:", error);
  return data;
}

export async function upsertJournalEntry(
  date: string,
  updates: { moment?: string; thought?: string; tomorrow?: string; emotion?: string; memo?: string; grateful?: string; done_today?: string; not_done_today?: string; want_tomorrow?: string; note_to_self?: string }
) {
  const existing = await getJournalEntry(date);

  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  );

  if (existing) {
    const { error } = await supabase
      .from("journal_entries")
      .update(cleanUpdates)
      .eq("date", date);
    if (error) console.error("upsertJournalEntry update error:", error);
  } else {
    const { error } = await supabase
      .from("journal_entries")
      .insert({ date, ...cleanUpdates });
    if (error) console.error("upsertJournalEntry insert error:", error);
  }
}

// ── Recommendation Logs ──

export async function saveRecommendationLog(
  date: string,
  total: number,
  done: number,
  items: Array<{ text: string; done: boolean }>
) {
  const { data: existing } = await supabase
    .from("recommendation_logs")
    .select("id")
    .eq("date", date)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("recommendation_logs")
      .update({ total, done, items })
      .eq("date", date);
    if (error) console.error("saveRecommendationLog update error:", error);
  } else {
    const { error } = await supabase
      .from("recommendation_logs")
      .insert({ date, total, done, items });
    if (error) console.error("saveRecommendationLog insert error:", error);
  }
}

export async function getRecommendationLogs(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from("recommendation_logs")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });
  if (error) console.error("getRecommendationLogs error:", error);
  return data ?? [];
}

export async function getHealthLogs(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from("health_logs")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });
  if (error) console.error("getHealthLogs error:", error);
  return data ?? [];
}

export async function getJournalEntries(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });
  if (error) console.error("getJournalEntries error:", error);
  return data ?? [];
}

// ── Weekly Reviews ──

export async function getWeeklyReview(yearWeek: string) {
  const { data, error } = await supabase
    .from("weekly_reviews")
    .select("*")
    .eq("year_week", yearWeek)
    .single();
  if (error && error.code !== "PGRST116") console.error("getWeeklyReview error:", error);
  return data;
}

export async function upsertWeeklyReview(yearWeek: string, updates: { next_week?: string; one_line?: string }) {
  const existing = await getWeeklyReview(yearWeek);
  const clean = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
  if (existing) {
    await supabase.from("weekly_reviews").update(clean).eq("year_week", yearWeek);
  } else {
    await supabase.from("weekly_reviews").insert({ year_week: yearWeek, ...clean });
  }
}

// ── Monthly Reviews ──

export async function getMonthlyReview(yearMonth: string) {
  const { data, error } = await supabase
    .from("monthly_reviews")
    .select("*")
    .eq("year_month", yearMonth)
    .single();
  if (error && error.code !== "PGRST116") console.error("getMonthlyReview error:", error);
  return data;
}

export async function upsertMonthlyReview(yearMonth: string, updates: { memorable?: string; next_goal?: string; note_to_self?: string }) {
  const existing = await getMonthlyReview(yearMonth);
  const clean = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
  if (existing) {
    await supabase.from("monthly_reviews").update(clean).eq("year_month", yearMonth);
  } else {
    await supabase.from("monthly_reviews").insert({ year_month: yearMonth, ...clean });
  }
}

// ── Routines ──

export async function getRoutines() {
  const { data, error } = await supabase
    .from("routines")
    .select("*")
    .eq("active", true)
    .order("id", { ascending: true });
  if (error) console.error("getRoutines error:", error);
  return data ?? [];
}

export async function getRoutineLogsForDate(date: string) {
  const { data, error } = await supabase
    .from("routine_logs")
    .select("*")
    .eq("date", date);
  if (error) console.error("getRoutineLogsForDate error:", error);
  return data ?? [];
}

export async function toggleRoutineLog(routineId: number, date: string, done: boolean) {
  const { data: existing } = await supabase
    .from("routine_logs")
    .select("id")
    .eq("routine_id", routineId)
    .eq("date", date)
    .single();

  if (existing) {
    await supabase.from("routine_logs").update({ done }).eq("routine_id", routineId).eq("date", date);
  } else {
    await supabase.from("routine_logs").insert({ routine_id: routineId, date, done });
  }
}

export async function getRoutineStreak(routineId: number, todayStr: string): Promise<number> {
  // 오늘부터 거슬러 올라가며 연속 일수 계산
  let streak = 0;
  const d = new Date(todayStr);

  for (let i = 0; i < 60; i++) {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const { data } = await supabase
      .from("routine_logs")
      .select("done")
      .eq("routine_id", routineId)
      .eq("date", dateStr)
      .single();

    if (data?.done) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export async function getRoutineLogsByRange(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from("routine_logs")
    .select("*, routines(title)")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });
  if (error) console.error("getRoutineLogsByRange error:", error);
  return data ?? [];
}

// ── Project Comments ──

export async function getProjectComments(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from("project_comments")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("created_at", { ascending: false });
  if (error) console.error("getProjectComments error:", error);
  return data ?? [];
}

export async function addProjectComment(projectId: string, projectName: string, comment: string, date: string) {
  const { error } = await supabase
    .from("project_comments")
    .insert({ project_id: projectId, project_name: projectName, comment, date });
  if (error) console.error("addProjectComment error:", error);
}

export async function deleteProjectComment(id: number) {
  const { error } = await supabase.from("project_comments").delete().eq("id", id);
  if (error) console.error("deleteProjectComment error:", error);
}

export async function getProjectCommentsByProject(projectId: string, limit = 20) {
  const { data, error } = await supabase
    .from("project_comments")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) console.error("getProjectCommentsByProject error:", error);
  return data ?? [];
}

export async function getChatMessagesByRange(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .eq("role", "user")
    .order("created_at", { ascending: false });
  if (error) console.error("getChatMessagesByRange error:", error);
  return data ?? [];
}

// ── Thesis Logs ──

export async function getThesisLogs(limit = 100) {
  const { data, error } = await supabase
    .from("thesis_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) console.error("getThesisLogs error:", error);
  return data ?? [];
}

export async function addThesisLog(worked: string, todo: string) {
  const { error } = await supabase
    .from("thesis_logs")
    .insert({ worked, todo });
  if (error) console.error("addThesisLog error:", error);
}

export async function deleteThesisLog(id: number) {
  const { error } = await supabase.from("thesis_logs").delete().eq("id", id);
  if (error) console.error("deleteThesisLog error:", error);
}
