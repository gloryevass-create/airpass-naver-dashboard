"use server";

import { revalidatePath } from "next/cache";
import { requireAuthedClient } from "@/lib/supabase/authed";
import type { NoticeType } from "@/lib/queries/scraps";

export async function scrapNotices(noticeType: NoticeType, noticeIds: string[], path: string): Promise<void> {
  if (noticeIds.length === 0) return;
  const { supabase, user } = await requireAuthedClient();

  const rows = noticeIds.map((noticeId) => ({ user_id: user.id, notice_type: noticeType, notice_id: noticeId }));
  // 이미 스크랩된 항목을 다시 선택해 눌러도 에러 없이 무시되도록 upsert한다.
  await supabase.from("notice_scraps").upsert(rows, { onConflict: "user_id,notice_type,notice_id" });

  revalidatePath(path);
}

export async function unscrapNotices(noticeType: NoticeType, noticeIds: string[], path: string): Promise<void> {
  if (noticeIds.length === 0) return;
  const { supabase, user } = await requireAuthedClient();

  await supabase
    .from("notice_scraps")
    .delete()
    .eq("user_id", user.id)
    .eq("notice_type", noticeType)
    .in("notice_id", noticeIds);

  revalidatePath(path);
}
