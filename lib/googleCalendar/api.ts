import "server-only";

export type GoogleCalendarEventInput = {
  title: string;
  dateStart: string; // ISO, +09:00 오프셋 포함(kstLocalToIso 결과)
  dateEnd: string | null;
  isDatetime: boolean;
  location: string | null;
  content: string | null;
};

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

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function toGoogleEventBody(input: GoogleCalendarEventInput) {
  const base = {
    summary: input.title,
    location: input.location ?? undefined,
    description: input.content ?? undefined,
  };
  if (input.isDatetime) {
    return {
      ...base,
      start: { dateTime: input.dateStart, timeZone: "Asia/Seoul" },
      end: { dateTime: input.dateEnd ?? input.dateStart, timeZone: "Asia/Seoul" },
    };
  }
  // 종일 일정: 구글의 end.date는 배타적(마지막 날 다음날)이라 우리 쪽
  // dateEnd(포함) 규칙에서 하루를 더해서 보낸다.
  return {
    ...base,
    start: { date: input.dateStart.slice(0, 10) },
    end: { date: addDaysIso(input.dateEnd ?? input.dateStart, 1).slice(0, 10) },
  };
}

/** 새 이벤트를 사용자의 기본(primary) 구글 캘린더에 등록하고 생성된 이벤트
 * id를 돌려준다. */
export async function insertGoogleCalendarEvent(accessToken: string, input: GoogleCalendarEventInput): Promise<string> {
  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(toGoogleEventBody(input)),
  });
  if (!res.ok) throw new Error(`구글 캘린더 등록 실패: ${await res.text()}`);
  const data = await res.json();
  return data.id as string;
}

export async function updateGoogleCalendarEvent(
  accessToken: string,
  googleEventId: string,
  input: GoogleCalendarEventInput
): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(toGoogleEventBody(input)),
  });
  if (!res.ok) throw new Error(`구글 캘린더 수정 실패: ${await res.text()}`);
}

/** 이미 지워졌거나(404) 정리된(410) 이벤트는 성공으로 간주한다 — 우리 쪽
 * 상태를 정리하는 게 목적이라 구글 쪽에 이미 없어도 문제 없음. */
export async function deleteGoogleCalendarEvent(accessToken: string, googleEventId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`구글 캘린더 삭제 실패: ${await res.text()}`);
  }
}
