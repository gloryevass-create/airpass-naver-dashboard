"use server";

import { revalidatePath } from "next/cache";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { backfillMonitorKeyword } from "@/lib/server/keywordBackfill";
import type { MonitorTrack } from "@/lib/queries/monitorKeywords";

export type AddKeywordState = { error?: string; success?: string } | undefined;

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

  // 키워드는 이미 등록됐으니, 즉시 수집이 실패하더라도 등록 자체는 실패로 보지 않는다
  // (다음 날 정기 파이프라인이 대신 채워준다) — 대신 경고 메시지로 알려준다.
  try {
    const { count } = await backfillMonitorKeyword(track, keyword);
    revalidatePath(path);
    return { success: `"${keyword}" 등록 완료 — 지금 바로 ${count}건 수집했습니다.` };
  } catch (e) {
    return {
      success: `"${keyword}" 등록 완료.`,
      error: `다만 즉시 수집에는 실패했습니다(내일 자동 수집 시 다시 시도됩니다): ${(e as Error).message}`,
    };
  }
}

// formData는 폼 action 시그니처를 맞추기 위해서만 받는다(내용은 쓰지 않음).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteMonitorKeyword(id: string, path: string, formData: FormData): Promise<void> {
  const { supabase } = await requireAuthedClient();
  await supabase.from("monitor_keywords").delete().eq("id", id);
  revalidatePath(path);
}
