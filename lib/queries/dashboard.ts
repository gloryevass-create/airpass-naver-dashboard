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
    alertCount: number;
  };
  rankTrend: { date: string; avgRank: number | null }[];
  keywordTable: {
    keywordId: string;
    keyword: string;
    ourRank: number | null;
    avgCpc: number | null;
    monthlySearchPc: number | null;
    monthlySearchMobile: number | null;
    monthlyClickPc: number | null;
    monthlyClickMobile: number | null;
    competitionLevel: string | null;
  }[];
  contentMatchedKeywords: {
    keywordId: string;
    keyword: string;
    monthlySearchPc: number | null;
    monthlySearchMobile: number | null;
    monthlyClickPc: number | null;
    monthlyClickMobile: number | null;
    avgCpc: number | null;
    matchCount: number;
  }[];
  sov: { competitorId: string; competitorName: string; sharePct: number }[];
  cadence: {
    competitorId: string;
    competitorName: string;
    avgIntervalDays: number | null;
    lastPostAt: string | null;
    postCount30d: number | null;
    totalPostCount: number;
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
  kpi: { activeKeywordCount: 0, avgRank: null, alertCount: 0 },
  rankTrend: [],
  keywordTable: [],
  contentMatchedKeywords: [],
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
    sovRes,
    cadenceRes,
    blogPostsRes,
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
    supabase.from("blog_sov_daily").select("*").eq("date", latestDate),
    supabase.from("posting_cadence").select("*").eq("date", latestDate),
    // 총 게시물 수는 posting_cadence에 저장된 값이 아니라(스키마에 없음),
    // blog_posts에 지금까지 수집·누적된(url 기준 중복 제거) 전체 건수를 직접 센다.
    // title은 콘텐츠 매칭 키워드 표 계산에도 재사용한다(아래).
    supabase.from("blog_posts").select("competitor_id, title"),
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

  // KPI: "활성 키워드"는 제외되지 않았고(is_excluded=false) 계정에서 여전히 ELIGIBLE인 것만 센다
  // — 캠페인/광고그룹이 일시중지되면 에이전트가 status를 'REMOVED'로 바꿔주므로 그 값을 그대로 신뢰한다.
  const activeKeywordCount = (keywordsRes.data ?? []).filter((k) => k.status === "ELIGIBLE").length;
  const ranks = (metricsLatestRes.data ?? [])
    .map((m) => m.our_rank)
    .filter((r): r is number => r != null);
  const avgRank = ranks.length
    ? Math.round((ranks.reduce((a, b) => a + b, 0) / ranks.length) * 10) / 10
    : null;
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

  // 키워드 상세 테이블 (기본 정렬은 화면에서 처리 — 월간검색수 PC+모바일 내림차순)
  const keywordTable = (metricsLatestRes.data ?? []).map((m) => {
    const kw = keywordMap.get(m.keyword_id);
    return {
      keywordId: m.keyword_id,
      keyword: kw?.keyword ?? "(알 수 없는 키워드)",
      ourRank: m.our_rank,
      avgCpc: m.avg_cpc != null ? Number(m.avg_cpc) : null,
      monthlySearchPc: m.monthly_search_pc,
      monthlySearchMobile: m.monthly_search_mobile,
      monthlyClickPc: m.monthly_click_pc != null ? Number(m.monthly_click_pc) : null,
      monthlyClickMobile: m.monthly_click_mobile != null ? Number(m.monthly_click_mobile) : null,
      competitionLevel: m.competition_level,
    };
  });

  // 콘텐츠 매칭 키워드 — 실제 수집된 블로그 게시물 제목에 등장하는 단어와 겹치는 키워드만
  // 골라 상위 20개(제목 매칭 건수 기준). airpass-naver-monitor의 블로그 SOV 검색어 선정
  // 로직(scripts/lib/blog-keyword-scope.ts)과 같은 방식을 대시보드 쪽에서 재현한 것 —
  // 이미 Supabase에 있는 keywords/blog_posts 데이터만으로 계산하므로 별도 동기화가 필요 없다.
  const CONTENT_KEYWORD_DISPLAY_COUNT = 20;
  const postTitles = (blogPostsRes.data ?? [])
    .map((p) => p.title)
    .filter((t): t is string => Boolean(t));
  const contentMatchedKeywords = keywordTable
    .map((k) => ({
      keywordId: k.keywordId,
      keyword: k.keyword,
      monthlySearchPc: k.monthlySearchPc,
      monthlySearchMobile: k.monthlySearchMobile,
      monthlyClickPc: k.monthlyClickPc,
      monthlyClickMobile: k.monthlyClickMobile,
      avgCpc: k.avgCpc,
      matchCount: postTitles.filter((t) => t.includes(k.keyword)).length,
    }))
    .filter((k) => k.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, CONTENT_KEYWORD_DISPLAY_COUNT);

  // 블로그 SOV — 채널별 평균 점유율. 블로그 등록된(blog_id 있는) 채널은 오늘 노출 매칭이
  // 없었더라도 0%로 표시한다 — 매칭된 채널만 보이면 "우리가 몇 곳을 추적 중인지" 알 수 없다.
  const sovByCompetitor = new Map<string, number[]>();
  for (const row of sovRes.data ?? []) {
    const arr = sovByCompetitor.get(row.competitor_id) ?? [];
    arr.push(Number(row.share_pct));
    sovByCompetitor.set(row.competitor_id, arr);
  }
  const blogTrackedCompetitors = (competitorsRes.data ?? []).filter((c) => c.blog_id);
  const sov = blogTrackedCompetitors
    .map((c) => {
      const arr = sovByCompetitor.get(c.id);
      return {
        competitorId: c.id,
        competitorName: c.name,
        sharePct: arr?.length
          ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
          : 0,
      };
    })
    .sort((a, b) => b.sharePct - a.sharePct);

  // 총 게시물 수 — blog_posts에 지금까지 누적 수집된(url 기준 중복 제거) 건수를 채널별로 집계
  const totalPostCountByCompetitor = new Map<string, number>();
  for (const row of blogPostsRes.data ?? []) {
    totalPostCountByCompetitor.set(
      row.competitor_id,
      (totalPostCountByCompetitor.get(row.competitor_id) ?? 0) + 1
    );
  }

  // 포스팅 주기
  const cadence = (cadenceRes.data ?? [])
    .map((row) => ({
      competitorId: row.competitor_id,
      competitorName: competitorMap.get(row.competitor_id)?.name ?? "(알 수 없는 채널)",
      avgIntervalDays: row.avg_interval_days != null ? Number(row.avg_interval_days) : null,
      lastPostAt: row.last_post_at,
      postCount30d: row.post_count_30d,
      totalPostCount: totalPostCountByCompetitor.get(row.competitor_id) ?? 0,
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
    kpi: { activeKeywordCount, avgRank, alertCount },
    rankTrend,
    keywordTable,
    contentMatchedKeywords,
    sov,
    cadence,
    alerts,
    reports,
  };
}
