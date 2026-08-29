import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { refreshAccessToken } from "@/lib/googleCalendar/oauth";
import { fetchGoogleCalendarEvents, type GoogleCalendarEvent } from "@/lib/googleCalendar/api";

type Client = SupabaseClient<Database>;

export type GoogleCalendarConnection = { googleEmail: string; connectedAt: string };

export async function getGoogleCalendarConnection(
  supabase: Client,
  userId: string
): Promise<GoogleCalendarConnection | null> {
  const { data } = await supabase
    .from("google_calendar_connections")
    .select("google_email, connected_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  return { googleEmail: data.google_email, connectedAt: data.connected_at };
}

/** 연결된 구글 계정의 access_token을 돌려준다(없거나 곧 만료되면 refresh_token으로
 * 새로 받아 DB 캐시도 같이 갱신). 연결이 없거나 갱신에 실패하면 null — 조회
 * (getMyGoogleCalendarEvents)와 등록/수정/삭제(eventsV2.ts) 양쪽에서 공유하는
 * 진입점이라, 실패 시 처리(조용히 건너뛸지 에러를 보여줄지)는 호출부가 맥락에
 * 맞게 결정한다. */
export async function getValidGoogleAccessToken(supabase: Client, userId: string): Promise<string | null> {
  const { data: conn } = await supabase
    .from("google_calendar_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!conn) return null;

  let accessToken = conn.access_token;
  const expiresSoon =
    !conn.access_token_expires_at || new Date(conn.access_token_expires_at).getTime() < Date.now() + 60_000;

  if (!accessToken || expiresSoon) {
    try {
      const refreshed = await refreshAccessToken(conn.refresh_token);
      accessToken = refreshed.access_token;
      const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
      await supabase
        .from("google_calendar_connections")
        .update({ access_token: accessToken, access_token_expires_at: expiresAt })
        .eq("user_id", userId);
    } catch (e) {
      console.error("[getValidGoogleAccessToken] 토큰 갱신 실패:", e instanceof Error ? e.message : e);
      return null;
    }
  }

  return accessToken;
}

/** 연결돼 있으면 그 사용자의 구글 캘린더 일정을 가져온다. 연결이 없거나
 * 구글 쪽 요청이 실패해도 조용히 빈 배열을 돌려준다 — 이 기능이 실패했다고
 * 캘린더 화면 전체가 막히면 안 되기 때문이다. */
export async function getMyGoogleCalendarEvents(
  supabase: Client,
  userId: string,
  rangeStart: string,
  rangeEnd: string
): Promise<GoogleCalendarEvent[]> {
  const accessToken = await getValidGoogleAccessToken(supabase, userId);
  if (!accessToken) return [];

  try {
    return await fetchGoogleCalendarEvents(accessToken, rangeStart, rangeEnd);
  } catch (e) {
    console.error("[getMyGoogleCalendarEvents] 일정 조회 실패:", e instanceof Error ? e.message : e);
    return [];
  }
}
