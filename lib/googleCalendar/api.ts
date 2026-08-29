import "server-only";

export type GoogleCalendarEvent = {
  id: string;
  title: string;
  dateStart: string; // ISO
  dateEnd: string | null; // ISO, 우리 쪽 규칙과 맞춰 포함(inclusive)
  isDatetime: boolean;
  htmlLink: string;
};

type GoogleApiEventItem = {
  id: string;
  status?: string;
  summary?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

export async function fetchGoogleCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];

  const data = await res.json();
  const items: GoogleApiEventItem[] = data.items ?? [];

  return items
    .filter((it) => it.status !== "cancelled" && it.start)
    .map((it) => {
      const isDatetime = Boolean(it.start?.dateTime);
      const dateStart = it.start?.dateTime ?? `${it.start?.date}T00:00:00+09:00`;

      let dateEnd: string | null = null;
      if (it.end?.dateTime) {
        dateEnd = it.end.dateTime;
      } else if (it.end?.date) {
        // 구글 종일 일정의 end.date는 배타적(마지막 날 다음날 자정)이라, 하루
        // 빼서 우리 쪽 dateEnd(포함) 규칙에 맞춘다.
        const d = new Date(`${it.end.date}T00:00:00Z`);
        d.setUTCDate(d.getUTCDate() - 1);
        dateEnd = d.toISOString();
      }

      return {
        id: it.id,
        title: it.summary || "(제목 없음)",
        dateStart,
        dateEnd,
        isDatetime,
        htmlLink: it.htmlLink ?? "",
      };
    });
}
