import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type NoticeType = "budget" | "prespec" | "news";

/** 로그인한 사용자가 스크랩해 둔 notice_id 집합. */
export async function getScrapedNoticeIds(
  supabase: Client,
  userId: string,
  noticeType: NoticeType
): Promise<Set<string>> {
  const { data } = await supabase
    .from("notice_scraps")
    .select("notice_id")
    .eq("user_id", userId)
    .eq("notice_type", noticeType);

  return new Set((data ?? []).map((r) => r.notice_id));
}
