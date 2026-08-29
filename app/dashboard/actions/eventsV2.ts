"use server";

import { revalidatePath } from "next/cache";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { formatMember } from "@/lib/formatMember";
import { getValidGoogleAccessToken } from "@/lib/queries/googleCalendar";
import { insertGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent } from "@/lib/googleCalendar/api";

const PATH = "/dashboard/events2";

export type TeamEventV2FormState = { error?: string } | undefined;

function text(formData: FormData, key: string): string | null {
  return String(formData.get(key) ?? "").trim() || null;
}

function listFromForm(formData: FormData, key: string): string[] {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// MemberMultiSelect(담당자/참석자)는 같은 name으로 여러 값을 제출하므로 getAll로
// 받는다 — 태그는 여전히 자유 텍스트라 listFromForm(쉼표 파싱)을 그대로 쓴다
// (예전 "쉼표로 구분" 자유 텍스트 입력을 실제 팀원 선택으로 대체, 2026-08-23).
function memberListFromForm(formData: FormData, key: string): string[] {
  return formData.getAll(key).map(String).filter(Boolean);
}

// <input type="datetime-local">가 주는 "YYYY-MM-DDTHH:mm"에는 타임존 정보가 없다 —
// 브라우저에서는 사용자의 로컬 시간(KST)로 보이지만, new Date(문자열)을 서버(Vercel,
// UTC)에서 그대로 파싱하면 서버 로컬시간(UTC)으로 잘못 해석돼 9시간이 밀린다. 이 앱은
// 항상 KST 기준이므로 명시적으로 +09:00을 붙여 파싱한다.
function kstLocalToIso(value: string): string {
  return new Date(`${value}:00+09:00`).toISOString();
}

function fieldsFromForm(formData: FormData) {
  const dateStart = String(formData.get("dateStart") ?? "").trim();
  const dateEnd = String(formData.get("dateEnd") ?? "").trim();
  return {
    title: text(formData, "title") ?? "",
    date_start: dateStart ? kstLocalToIso(dateStart) : "",
    date_end: dateEnd ? kstLocalToIso(dateEnd) : null,
    is_datetime: formData.get("isDatetime") === "on",
    category: text(formData, "category"),
    tags: listFromForm(formData, "tags"),
    target: text(formData, "target"),
    location: text(formData, "location"),
    content: text(formData, "content"),
    assignees: memberListFromForm(formData, "assignees"),
    attendees: memberListFromForm(formData, "attendees"),
  };
}

function googleEventInputFrom(fields: ReturnType<typeof fieldsFromForm>) {
  return {
    title: fields.title,
    dateStart: fields.date_start,
    dateEnd: fields.date_end,
    isDatetime: fields.is_datetime,
    location: fields.location,
    content: fields.content,
  };
}

export async function createTeamEventV2(
  _prevState: TeamEventV2FormState,
  formData: FormData
): Promise<TeamEventV2FormState> {
  const { supabase, user } = await requireAuthedClient();

  const fields = fieldsFromForm(formData);
  if (!fields.title) return { error: "일정 제목을 입력하세요." };
  if (!fields.date_start) return { error: "일시를 입력하세요." };

  const { data: inserted, error } = await supabase.from("team_events_v2").insert(fields).select("id").single();
  if (error) return { error: `저장 실패: ${error.message}` };

  // 구글 캘린더 등록은 부가 기능이라 실패해도 팀 일정 저장 자체는 성공으로
  // 처리한다(연결 해제됐거나 토큰 만료 등) — 콘솔에만 남긴다.
  if (formData.get("syncToGoogle") === "on") {
    try {
      const accessToken = await getValidGoogleAccessToken(supabase, user.id);
      if (accessToken) {
        const googleEventId = await insertGoogleCalendarEvent(accessToken, googleEventInputFrom(fields));
        await supabase
          .from("team_events_v2")
          .update({ google_event_id: googleEventId, google_event_owner_id: user.id })
          .eq("id", inserted.id);
      }
    } catch (e) {
      console.error("[createTeamEventV2] 구글 캘린더 등록 실패:", e instanceof Error ? e.message : e);
    }
  }

  const { data: profile } = await supabase.from("profiles").select("name, email").eq("id", user.id).single();
  const actor = formatMember(profile?.name ?? null, null, profile?.email ?? user.email ?? "");
  await supabase.from("notifications").insert({
    type: "event",
    title: fields.title,
    message: `${actor}님이 새 일정을 등록했습니다.`,
    link: PATH,
  });

  revalidatePath(PATH);
  return undefined;
}

export async function updateTeamEventV2(
  _prevState: TeamEventV2FormState,
  formData: FormData
): Promise<TeamEventV2FormState> {
  const { supabase, user } = await requireAuthedClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "잘못된 요청입니다." };

  const fields = fieldsFromForm(formData);
  if (!fields.title) return { error: "일정 제목을 입력하세요." };
  if (!fields.date_start) return { error: "일시를 입력하세요." };

  const { data: existing } = await supabase
    .from("team_events_v2")
    .select("google_event_id, google_event_owner_id")
    .eq("id", id)
    .maybeSingle();

  // 이 일정을 구글 캘린더에 등록한 적이 없거나, 등록한 사람이 지금 수정하는
  // 본인일 때만 구글 쪽도 같이 건드린다 — 남이 등록해 둔 걸 내 세션 토큰으로
  // 고칠 수는 없으므로(권한 없음), 그런 경우 구글 이벤트는 그대로 두고 우리
  // DB 필드만 갱신한다.
  const canTouchGoogle = !existing?.google_event_owner_id || existing.google_event_owner_id === user.id;
  let googleFieldUpdates: { google_event_id?: string | null; google_event_owner_id?: string | null } = {};

  if (canTouchGoogle) {
    const wantsGoogleSync = formData.get("syncToGoogle") === "on";
    try {
      const accessToken = await getValidGoogleAccessToken(supabase, user.id);
      if (accessToken && wantsGoogleSync) {
        const input = googleEventInputFrom(fields);
        if (existing?.google_event_id) {
          await updateGoogleCalendarEvent(accessToken, existing.google_event_id, input);
          googleFieldUpdates = { google_event_owner_id: user.id };
        } else {
          const googleEventId = await insertGoogleCalendarEvent(accessToken, input);
          googleFieldUpdates = { google_event_id: googleEventId, google_event_owner_id: user.id };
        }
      } else if (accessToken && !wantsGoogleSync && existing?.google_event_id) {
        await deleteGoogleCalendarEvent(accessToken, existing.google_event_id);
        googleFieldUpdates = { google_event_id: null, google_event_owner_id: null };
      }
    } catch (e) {
      console.error("[updateTeamEventV2] 구글 캘린더 동기화 실패:", e instanceof Error ? e.message : e);
    }
  }

  const { error } = await supabase
    .from("team_events_v2")
    .update({ ...fields, ...googleFieldUpdates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: `저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}

export async function deleteTeamEventV2(id: string): Promise<void> {
  const { supabase, user } = await requireAuthedClient();

  const { data: existing } = await supabase
    .from("team_events_v2")
    .select("google_event_id, google_event_owner_id")
    .eq("id", id)
    .maybeSingle();

  if (existing?.google_event_id && existing.google_event_owner_id === user.id) {
    try {
      const accessToken = await getValidGoogleAccessToken(supabase, user.id);
      if (accessToken) await deleteGoogleCalendarEvent(accessToken, existing.google_event_id);
    } catch (e) {
      console.error("[deleteTeamEventV2] 구글 캘린더 삭제 실패:", e instanceof Error ? e.message : e);
    }
  }

  await supabase.from("team_events_v2").delete().eq("id", id);
  revalidatePath(PATH);
}
