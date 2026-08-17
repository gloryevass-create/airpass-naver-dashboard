"use server";

import { revalidatePath } from "next/cache";
import { requireAuthedClient } from "@/lib/supabase/authed";
import type { MonitorTrack } from "@/lib/queries/monitorKeywords";

export type AddKeywordState = { error?: string } | undefined;

export async function addMonitorKeyword(
  track: MonitorTrack,
  path: string,
  _prevState: AddKeywordState,
  formData: FormData
): Promise<AddKeywordState> {
  const { supabase } = await requireAuthedClient();

  const keyword = String(formData.get("keyword") ?? "").trim();
  if (!keyword) return { error: "키워드를 입력하세요." };

  const { error } = await supabase.from("monitor_keywords").insert({ track, keyword });
  if (error) {
    if (error.code === "23505") return { error: "이미 등록된 키워드입니다." };
    return { error: `등록 실패: ${error.message}` };
  }

  revalidatePath(path);
  return undefined;
}

// formData는 폼 action 시그니처를 맞추기 위해서만 받는다(내용은 쓰지 않음).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteMonitorKeyword(id: string, path: string, formData: FormData): Promise<void> {
  const { supabase } = await requireAuthedClient();
  await supabase.from("monitor_keywords").delete().eq("id", id);
  revalidatePath(path);
}
