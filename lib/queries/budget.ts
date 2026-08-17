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
const DEFAULT_RANGE_DAYS = 30;

function daysBefore(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

async function getLatestBudgetDate(supabase: Client): Promise<string | null> {
  const { data } = await supabase
    .from("budget_bids")
    .select("notice_date")
    .not("notice_date", "is", null)
    .order("notice_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.notice_date ? data.notice_date.slice(0, 10) : null;
}

export type BudgetQueryResult = {
  bids: BudgetBid[];
  range: { since: string; until: string };
};

export async function getBudgetBids(
  supabase: Client,
  options?: { since?: string; until?: string }
): Promise<BudgetQueryResult> {
  const latestDate = (await getLatestBudgetDate(supabase)) ?? new Date().toISOString().slice(0, 10);
  const since = options?.since ?? daysBefore(latestDate, DEFAULT_RANGE_DAYS - 1);
  const until = options?.until ?? latestDate;

  const { data } = await supabase
    .from("budget_bids")
    .select("*")
    .gte("notice_date", `${since}T00:00:00Z`)
    .lte("notice_date", `${until}T23:59:59Z`)
    .order("notice_date", { ascending: false, nullsFirst: false })
    .limit(BUDGET_DISPLAY_LIMIT);

  const bids = (data ?? []).map((b) => ({
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

  return { bids, range: { since, until } };
}
