import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

const TREND_DAYS = 14;

function daysBefore(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** 대시보드 전체가 이 날짜를 기준으로 동작한다 — 특정 날짜 하드코딩 금지. */
export async function getLatestDataDate(supabase: Client): Promise<string | null> {
  const { data } = await supabase
    .from("keyword_daily_metrics")
    .select("date")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.date ?? null;
}

export type DashboardData = {
  latestDate: string | null;
  kpi: {
    activeKeywordCount: number;
    avgRank: number | null;
    totalEstSpend: number;
    alertCount: number;
  };
  rankTrend: { date: string; avgRank: number | null }[];
  adSpendByCompetitor: {
    competitorId: string;
    competitorName: string;
    totalSpend: number;
    breakdown: {
      keyword: string;
      estimatedMonthlySpend: number;
      calcBasis: unknown;
    }[];
  }[];
  keywordTable: {
    keywordId: string;
    keyword: string;
    ourRank: number | null;
    avgCpc: number | null;
    monthlySearchPc: number | null;
    monthlySearchMobile: number | null;
    competitionLevel: string | null;
  }[];
  sov: { competitorId: string; competitorName: string; sharePct: number }[];
  cadence: {
    competitorId: string;
    competitorName: string;
    avgIntervalDays: number | null;
    lastPostAt: string | null;
    postCount30d: number | null;
  }[];
  alerts: {
    id: string;
    severity: "info" | "warning" | "critical";
    category: string;
    message: string;
    evidenceRef: string | null;
  }[];
  reports: {
    id: string;
    date: string;
    reportType: "daily" | "weekly" | "monthly";
    track: "ad" | "blog" | "combined";
    title: string;
  }[];
};

const EMPTY: DashboardData = {
  latestDate: null,
  kpi: { activeKeywordCount: 0, avgRank: null, totalEstSpend: 0, alertCount: 0 },
  rankTrend: [],
  adSpendByCompetitor: [],
  keywordTable: [],
  sov: [],
  cadence: [],
  alerts: [],
  reports: [],
};

export async function getDashboardData(supabase: Client): Promise<DashboardData> {
  const latestDate = await getLatestDataDate(supabase);
  if (!latestDate) return EMPTY;

  const trendStart = daysBefore(latestDate, TREND_DAYS - 1);

  const [
    keywordsRes,
    competitorsRes,
    metricsLatestRes,
    metricsTrendRes,
    spendRes,
    sovRes,
    cadenceRes,
    alertsRes,
    reportsRes,
  ] = await Promise.all([
    supabase.from("keywords").select("*").eq("is_excluded", false),
    supabase.from("competitors").select("*"),
    supabase.from("keyword_daily_metrics").select("*").eq("date", latestDate),
    supabase
      .from("keyword_daily_metrics")
      .select("date, our_rank")
      .gte("date", trendStart)
      .lte("date", latestDate),
    supabase.from("ad_spend_estimates").select("*").eq("date", latestDate),
    supabase.from("blog_sov_daily").select("*").eq("date", latestDate),
    supabase.from("posting_cadence").select("*").eq("date", latestDate),
    supabase
      .from("alerts")
      .select("*")
      .eq("date", latestDate)
      .order("severity", { ascending: false }),
    supabase
      .from("daily_reports")
      .select("id, date, report_type, track, title")
      .order("date", { ascending: false })
      .limit(10),
  ]);

  const keywordMap = new Map((keywordsRes.data ?? []).map((k) => [k.id, k]));
  const competitorMap = new Map((competitorsRes.data ?? []).map((c) => [c.id, c]));

  // KPI
  const activeKeywordCount = keywordsRes.data?.length ?? 0;
  const ranks = (metricsLatestRes.data ?? [])
    .map((m) => m.our_rank)
    .filter((r): r is number => r != null);
  const avgRank = ranks.length
    ? Math.round((ranks.reduce((a, b) => a + b, 0) / ranks.length) * 10) / 10
    : null;
  const totalEstSpend = (spendRes.data ?? []).reduce(
    (sum, r) => sum + Number(r.estimated_monthly_spend),
    0
  );
  const alertCount = (alertsRes.data ?? []).filter(
    (a) => a.severity === "warning" || a.severity === "critical"
  ).length;

  // 14일 순위 추이
  const byDate = new Map<string, number[]>();
  for (const row of metricsTrendRes.data ?? []) {
    if (row.our_rank == null) continue;
    const arr = byDate.get(row.date) ?? [];
    arr.push(row.our_rank);
    byDate.set(row.date, arr);
  }
  const rankTrend: DashboardData["rankTrend"] = [];
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const date = daysBefore(latestDate, i);
    const arr = byDate.get(date);
    rankTrend.push({
      date,
      avgRank: arr?.length
        ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
        : null,
    });
  }

  // 경쟁사별 예상 광고비
  const spendByCompetitor = new Map<
    string,
    { totalSpend: number; breakdown: DashboardData["adSpendByCompetitor"][number]["breakdown"] }
  >();
  for (const row of spendRes.data ?? []) {
    const entry = spendByCompetitor.get(row.competitor_id) ?? {
      totalSpend: 0,
      breakdown: [],
    };
    entry.totalSpend += Number(row.estimated_monthly_spend);
    entry.breakdown.push({
      keyword: keywordMap.get(row.keyword_id)?.keyword ?? "(알 수 없는 키워드)",
      estimatedMonthlySpend: Number(row.estimated_monthly_spend),
      calcBasis: row.calc_basis,
    });
    spendByCompetitor.set(row.competitor_id, entry);
  }
  const adSpendByCompetitor = Array.from(spendByCompetitor.entries())
    .map(([competitorId, v]) => ({
      competitorId,
      competitorName: competitorMap.get(competitorId)?.name ?? "(알 수 없는 경쟁사)",
      totalSpend: v.totalSpend,
      breakdown: v.breakdown,
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend);

  // 키워드 상세 테이블
  const keywordTable = (metricsLatestRes.data ?? [])
    .map((m) => {
      const kw = keywordMap.get(m.keyword_id);
      return {
        keywordId: m.keyword_id,
        keyword: kw?.keyword ?? "(알 수 없는 키워드)",
        ourRank: m.our_rank,
        avgCpc: m.avg_cpc != null ? Number(m.avg_cpc) : null,
        monthlySearchPc: m.monthly_search_pc,
        monthlySearchMobile: m.monthly_search_mobile,
        competitionLevel: m.competition_level,
      };
    })
    .sort((a, b) => (a.ourRank ?? Infinity) - (b.ourRank ?? Infinity));

  // 블로그 SOV — 경쟁사별 평균 점유율
  const sovByCompetitor = new Map<string, number[]>();
  for (const row of sovRes.data ?? []) {
    const arr = sovByCompetitor.get(row.competitor_id) ?? [];
    arr.push(Number(row.share_pct));
    sovByCompetitor.set(row.competitor_id, arr);
  }
  const sov = Array.from(sovByCompetitor.entries())
    .map(([competitorId, arr]) => ({
      competitorId,
      competitorName: competitorMap.get(competitorId)?.name ?? "(알 수 없는 경쟁사)",
      sharePct: Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10,
    }))
    .sort((a, b) => b.sharePct - a.sharePct);

  // 포스팅 주기
  const cadence = (cadenceRes.data ?? [])
    .map((row) => ({
      competitorId: row.competitor_id,
      competitorName: competitorMap.get(row.competitor_id)?.name ?? "(알 수 없는 경쟁사)",
      avgIntervalDays: row.avg_interval_days != null ? Number(row.avg_interval_days) : null,
      lastPostAt: row.last_post_at,
      postCount30d: row.post_count_30d,
    }))
    .sort((a, b) => a.competitorName.localeCompare(b.competitorName));

  const alerts = (alertsRes.data ?? []).map((a) => ({
    id: a.id,
    severity: a.severity,
    category: a.category,
    message: a.message,
    evidenceRef: a.evidence_ref,
  }));

  const reports = (reportsRes.data ?? []).map((r) => ({
    id: r.id,
    date: r.date,
    reportType: r.report_type,
    track: r.track,
    title: r.title,
  }));

  return {
    latestDate,
    kpi: { activeKeywordCount, avgRank, totalEstSpend, alertCount },
    rankTrend,
    adSpendByCompetitor,
    keywordTable,
    sov,
    cadence,
    alerts,
    reports,
  };
}
