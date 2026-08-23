import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type PrespecNotice = {
  id: string;
  keyword: string;
  businessType: "cnstwk" | "servc" | "thng";
  preSpecRegNo: string;
  title: string;
  noticeInst: string | null;
  demandInst: string | null;
  budgetAmount: number | null;
  registeredAt: string | null;
  opinionCloseAt: string | null;
  officialName: string | null;
  officialTel: string | null;
  specDocUrls: string[];
  bidNoticeNos: string[];
};

const PRESPEC_DISPLAY_LIMIT = 200;
const DEFAULT_RANGE_DAYS = 30;

function daysBefore(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

async function getLatestPrespecDate(supabase: Client): Promise<string | null> {
  const { data } = await supabase
    .from("prespec_notices")
    .select("registered_at")
    .not("registered_at", "is", null)
    .order("registered_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.registered_at ? data.registered_at.slice(0, 10) : null;
}

export type PrespecQueryResult = {
  notices: PrespecNotice[];
  range: { since: string; until: string };
};

export async function getPrespecNotices(
  supabase: Client,
  options?: { since?: string; until?: string }
): Promise<PrespecQueryResult> {
  const latestDate = (await getLatestPrespecDate(supabase)) ?? new Date().toISOString().slice(0, 10);
  const since = options?.since ?? daysBefore(latestDate, DEFAULT_RANGE_DAYS - 1);
  const until = options?.until ?? latestDate;

  const { data } = await supabase
    .from("prespec_notices")
    .select("*")
    .gte("registered_at", `${since}T00:00:00Z`)
    .lte("registered_at", `${until}T23:59:59Z`)
    .order("registered_at", { ascending: false, nullsFirst: false })
    .limit(PRESPEC_DISPLAY_LIMIT);

  const notices = (data ?? []).map((n) => ({
    id: n.id,
    keyword: n.keyword,
    businessType: n.business_type,
    preSpecRegNo: n.pre_spec_reg_no,
    title: n.title,
    noticeInst: n.notice_inst,
    demandInst: n.demand_inst,
    budgetAmount: n.budget_amount != null ? Number(n.budget_amount) : null,
    registeredAt: n.registered_at,
    opinionCloseAt: n.opinion_close_at,
    officialName: n.official_name,
    officialTel: n.official_tel,
    specDocUrls: n.spec_doc_urls,
    bidNoticeNos: n.bid_notice_nos,
  }));

  return { notices, range: { since, until } };
}

/** 스크랩한 사전규격은 조회 기간(기본 30일 롤링 윈도우) 밖으로 밀려나도 "스크랩" 탭에서는
 * 계속 보여야 한다 — getPrespecNotices는 항상 기간 필터가 걸려 있어 이 용도로 못 쓴다.
 * (news_articles와 동일한 버그, 사용자 확인 2026-08-24) */
export async function getScrapedPrespecNotices(supabase: Client, ids: string[]): Promise<PrespecNotice[]> {
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("prespec_notices")
    .select("*")
    .in("id", ids)
    .order("registered_at", { ascending: false, nullsFirst: false });

  return (data ?? []).map((n) => ({
    id: n.id,
    keyword: n.keyword,
    businessType: n.business_type,
    preSpecRegNo: n.pre_spec_reg_no,
    title: n.title,
    noticeInst: n.notice_inst,
    demandInst: n.demand_inst,
    budgetAmount: n.budget_amount != null ? Number(n.budget_amount) : null,
    registeredAt: n.registered_at,
    opinionCloseAt: n.opinion_close_at,
    officialName: n.official_name,
    officialTel: n.official_tel,
    specDocUrls: n.spec_doc_urls,
    bidNoticeNos: n.bid_notice_nos,
  }));
}
