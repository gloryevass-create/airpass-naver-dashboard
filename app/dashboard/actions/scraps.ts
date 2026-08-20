"use server";

import { revalidatePath } from "next/cache";
import { requireAuthedClient } from "@/lib/supabase/authed";
import type { NoticeType } from "@/lib/queries/scraps";
import { formatMember } from "@/lib/formatMember";

const NOTICE_TABLE: Record<NoticeType, "budget_bids" | "prespec_notices" | "news_articles"> = {
  budget: "budget_bids",
  prespec: "prespec_notices",
  news: "news_articles",
};
const NOTIFICATION_TYPE: Record<NoticeType, "budget_scrap" | "prespec_scrap" | "news_scrap"> = {
  budget: "budget_scrap",
  prespec: "prespec_scrap",
  news: "news_scrap",
};
const NOTICE_LABEL: Record<NoticeType, string> = {
  budget: "조달입찰공고",
  prespec: "조달사전규격",
  news: "교육관련뉴스",
};
const NOTICE_LINK: Record<NoticeType, string> = {
  budget: "/dashboard/budget",
  prespec: "/dashboard/prespec",
  news: "/dashboard/news",
};

/** 스크랩 발생을 팀 전체에게 알린다 — 여러 건을 한 번에 스크랩해도 알림 1건으로
 * 묶는다(항목마다 알림을 만들면 대량 선택 시 알림 목록이 도배된다). */
async function notifyTeamOfScrap(
  supabase: Awaited<ReturnType<typeof requireAuthedClient>>["supabase"],
  userId: string,
  noticeType: NoticeType,
  noticeIds: string[]
) {
  const [{ data: profile }, { data: notices }] = await Promise.all([
    supabase.from("profiles").select("name, email").eq("id", userId).single(),
    supabase.from(NOTICE_TABLE[noticeType]).select("title").in("id", noticeIds),
  ]);

  const actor = formatMember(profile?.name ?? null, null, profile?.email ?? "");
  const titles = (notices ?? []).map((n) => n.title);
  const label = NOTICE_LABEL[noticeType];

  const title = titles.length === 1 ? titles[0] : `${label} ${titles.length}건`;
  const message =
    titles.length === 1 ? `${actor}님이 스크랩했습니다.` : `${actor}님이 ${titles.length}건을 스크랩했습니다.`;

  await supabase.from("notifications").insert({
    type: NOTIFICATION_TYPE[noticeType],
    title,
    message,
    link: NOTICE_LINK[noticeType],
  });
}

export async function scrapNotices(noticeType: NoticeType, noticeIds: string[], path: string): Promise<void> {
  if (noticeIds.length === 0) return;
  const { supabase, user } = await requireAuthedClient();

  const rows = noticeIds.map((noticeId) => ({ user_id: user.id, notice_type: noticeType, notice_id: noticeId }));
  // 이미 스크랩된 항목을 다시 선택해 눌러도 에러 없이 무시되도록 upsert한다.
  await supabase.from("notice_scraps").upsert(rows, { onConflict: "user_id,notice_type,notice_id" });

  await notifyTeamOfScrap(supabase, user.id, noticeType, noticeIds).catch(() => {});

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
