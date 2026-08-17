import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchNewsForKeyword } from "./naverNewsClient";
import { fetchBudgetBidsForKeyword } from "./g2bClient";
import type { MonitorTrack } from "@/lib/queries/monitorKeywords";

/** 새 키워드를 등록하는 즉시 실시간으로 한 번 수집해 바로 반영한다 — 그렇지 않으면
 * 다음 날 자동 파이프라인이 돌 때까지 그 키워드의 데이터를 볼 수 없다. 정기 파이프라인
 * (airpass-naver-monitor)과 같은 정제 로직·onConflict 키를 쓴다. */
export async function backfillMonitorKeyword(track: MonitorTrack, keyword: string): Promise<{ count: number }> {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  if (track === "news") {
    const rows = await fetchNewsForKeyword(keyword);
    if (rows.length === 0) return { count: 0 };
    const { error } = await admin
      .from("news_articles")
      .upsert(
        rows.map((r) => ({ ...r, collected_at: today })),
        { onConflict: "link" }
      );
    if (error) throw new Error(`news_articles upsert 실패: ${error.message}`);
    return { count: rows.length };
  }

  const rows = await fetchBudgetBidsForKeyword(keyword);
  if (rows.length === 0) return { count: 0 };
  const { error } = await admin
    .from("budget_bids")
    .upsert(
      rows.map((r) => ({ ...r, collected_at: today })),
      { onConflict: "bid_no,bid_ord" }
    );
  if (error) throw new Error(`budget_bids upsert 실패: ${error.message}`);
  return { count: rows.length };
}
