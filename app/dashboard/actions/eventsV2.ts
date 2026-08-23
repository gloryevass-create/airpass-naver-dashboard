"use server";

import { revalidatePath } from "next/cache";
import { requireAuthedClient } from "@/lib/supabase/authed";

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
    assignees: listFromForm(formData, "assignees"),
    attendees: listFromForm(formData, "attendees"),
  };
}

export async function createTeamEventV2(
  _prevState: TeamEventV2FormState,
  formData: FormData
): Promise<TeamEventV2FormState> {
  const { supabase } = await requireAuthedClient();

  const fields = fieldsFromForm(formData);
  if (!fields.title) return { error: "일정 제목을 입력하세요." };
  if (!fields.date_start) return { error: "일시를 입력하세요." };

  const { error } = await supabase.from("team_events_v2").insert(fields);
  if (error) return { error: `저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}

export async function updateTeamEventV2(
  _prevState: TeamEventV2FormState,
  formData: FormData
): Promise<TeamEventV2FormState> {
  const { supabase } = await requireAuthedClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "잘못된 요청입니다." };

  const fields = fieldsFromForm(formData);
  if (!fields.title) return { error: "일정 제목을 입력하세요." };
  if (!fields.date_start) return { error: "일시를 입력하세요." };

  const { error } = await supabase
    .from("team_events_v2")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: `저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}

export async function deleteTeamEventV2(id: string): Promise<void> {
  const { supabase } = await requireAuthedClient();
  await supabase.from("team_events_v2").delete().eq("id", id);
  revalidatePath(PATH);
}
