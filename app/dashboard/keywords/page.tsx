import { requireAuthedClient } from "@/lib/supabase/authed";
import { getDashboardData } from "@/lib/queries/dashboard";
import { AdAccountStatsPanel } from "@/components/dashboard/AdAccountStatsPanel";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { RankTrendChart } from "@/components/dashboard/RankTrendChart";
import { HotKeywordTreemap } from "@/components/dashboard/HotKeywordTreemap";
import { KeywordTable } from "@/components/dashboard/KeywordTable";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { ReportsList } from "@/components/dashboard/ReportsList";

type SearchParams = Promise<{ statsFrom?: string; statsTo?: string }>;

export default async function KeywordsPage({ searchParams }: { searchParams: SearchParams }) {
  const { statsFrom, statsTo } = await searchParams;
  const { supabase } = await requireAuthedClient();
  const dashboard = await getDashboardData(supabase, {
    accountStatsSince: statsFrom,
    accountStatsUntil: statsTo,
  });

  const keywordReports = dashboard.reports.filter((r) => r.track !== "blog");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      {!dashboard.latestDate && (
        <div className="rounded-xl border border-hairline bg-canvas-cream p-6 text-sm text-ink-mute">
          아직 모니터링 에이전트가 수집한 데이터가 없습니다. 파이프라인이 최소 1회 실행되면
          여기에 결과가 표시됩니다.
        </div>
      )}

      <AdAccountStatsPanel data={dashboard.adAccountStats} />

      <KpiCards kpi={dashboard.kpi} />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-hairline p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink-mute">
            키워드 평균 노출순위 추이 (최근 14일)
          </h2>
          <RankTrendChart data={dashboard.rankTrend} />
        </div>
        <div className="rounded-xl border border-hairline p-4">
          <HotKeywordTreemap keywordTable={dashboard.keywordTable} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-mute">키워드별 상세</h2>
        <KeywordTable data={dashboard.keywordTable} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink-mute">이상 징후 알림</h2>
          <AlertsList data={dashboard.alerts} />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink-mute">최근 리포트</h2>
          <ReportsList data={keywordReports} />
        </div>
      </section>
    </main>
  );
}
