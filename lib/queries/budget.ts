import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type BudgetBid = {
  id: string;
  keyword: string;
  businessType: "cnstwk" | "servc" | "thng";
  bidNo: string;
  title: string;
  noticeInst: string | null;
  demandInst: string | null;
  budgetAmount: number | null;
  presmptPrice: number | null;
  noticeDate: string | null;
  detailUrl: string | null;
};

const BUDGET_DISPLAY_LIMIT = 200;

export async function getBudgetBids(supabase: Client): Promise<BudgetBid[]> {
  const { data } = await supabase
    .from("budget_bids")
    .select("*")
    .order("notice_date", { ascending: false, nullsFirst: false })
    .limit(BUDGET_DISPLAY_LIMIT);

  return (data ?? []).map((b) => ({
    id: b.id,
    keyword: b.keyword,
    businessType: b.business_type,
    bidNo: b.bid_no,
    title: b.title,
    noticeInst: b.notice_inst,
    demandInst: b.demand_inst,
    budgetAmount: b.budget_amount != null ? Number(b.budget_amount) : null,
    presmptPrice: b.presmpt_price != null ? Number(b.presmpt_price) : null,
    noticeDate: b.notice_date,
    detailUrl: b.detail_url,
  }));
}
