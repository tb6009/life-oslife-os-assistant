import { getServerSession } from "next-auth";
import { google } from "googleapis";
import { syncSchedulesFromCalendar } from "@/lib/supabase/api";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/** UTC Date를 KST 기준 YYYY-MM-DD 문자열로 변환 */
function toKSTDateStr(d: Date): string {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split("T")[0];
}

/** ISO datetime에서 HH:MM 추출 — timeZone:"Asia/Seoul" 지정 후 Google이 +09:00 형식으로 반환 */
function toKSTTime(isoStr: string): string | null {
  const match = isoStr.match(/T(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : null;
}

export async function GET() {
  const session = await getServerSession(authOptions) as Record<string, unknown> | null;
  const accessToken = session?.accessToken as string | undefined;

  if (!accessToken) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth });

  // 오늘, 어제, 내일 범위 계산 — KST 기준
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  // KST 기준 어제 00:00 ~ 모레 00:00 (UTC로 변환해서 API에 전달)
  const kstTodayStart = new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()) - 9 * 60 * 60 * 1000);
  const yesterday = new Date(kstTodayStart);
  yesterday.setDate(yesterday.getDate() - 1);

  const dayAfterTomorrow = new Date(kstTodayStart);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 3);

  try {
    // 모든 캘린더 목록 가져오기
    const calendarList = await calendar.calendarList.list();
    const calendars = calendarList.data.items ?? [];

    // 각 캘린더에서 이벤트 가져오기
    const allEvents: Array<{
      summary: string;
      start: string;
      end: string;
      date: string;
      allDay: boolean;
      calendarName: string;
    }> = [];

    for (const cal of calendars) {
      try {
        const events = await calendar.events.list({
          calendarId: cal.id!,
          timeMin: yesterday.toISOString(),
          timeMax: dayAfterTomorrow.toISOString(),
          singleEvents: true,
          orderBy: "startTime",
          timeZone: "Asia/Seoul",
          maxResults: 20,
        });

        for (const event of events.data.items ?? []) {
          const startDateTime = event.start?.dateTime ?? event.start?.date ?? "";
          const endDateTime = event.end?.dateTime ?? event.end?.date ?? "";
          const allDay = !event.start?.dateTime;

          // 이벤트 날짜 계산 — KST 기준
          let eventDate: string;
          if (allDay && event.start?.date) {
            eventDate = event.start.date;
          } else if (event.start?.dateTime) {
            eventDate = toKSTDateStr(new Date(event.start.dateTime));
          } else {
            continue;
          }

          allEvents.push({
            summary: event.summary ?? "(제목 없음)",
            start: startDateTime,
            end: endDateTime,
            date: eventDate,
            allDay,
            calendarName: cal.summary ?? "",
          });
        }
      } catch {
        // 개별 캘린더 오류는 무시
      }
    }

    // 날짜별로 분류 — KST 기준
    const todayStr = toKSTDateStr(now);
    const yesterdayStr = toKSTDateStr(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    const tomorrowStr = toKSTDateStr(new Date(now.getTime() + 24 * 60 * 60 * 1000));

    const todayEvents = allEvents.filter((e) => e.date === todayStr);
    const yesterdayEvents = allEvents.filter((e) => e.date === yesterdayStr);
    const tomorrowEvents = allEvents.filter((e) => e.date === tomorrowStr);

    // Supabase에 동기화 — KST 기준 HH:MM 추출
    const toSync = allEvents.map((e) => {
      let time: string | null = null;
      if (!e.allDay && e.start) {
        time = toKSTTime(e.start);
      }
      return { title: e.summary, time, date: e.date, source: "google" };
    });
    await syncSchedulesFromCalendar(toSync);

    return Response.json({
      today: todayEvents,
      yesterday: yesterdayEvents,
      tomorrow: tomorrowEvents,
      synced: toSync.length,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Calendar API 오류";
    return Response.json({ error: message }, { status: 500 });
  }
}
