import { requireAuthedClient } from "@/lib/supabase/authed";
import { getDashboardData } from "@/lib/queries/dashboard";
import { AdAccountStatsPanel } from "@/components/dashboard/AdAccountStatsPanel";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { RankTrendChart } from "@/components/dashboard/RankTrendChart";
import { HotKeywordTreemap } from "@/components/dashboard/HotKeywordTreemap";
import { KeywordTable } from "@/components/dashboard/KeywordTable";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { ReportsList } from "@/components/dashboard/ReportsList";
import { NavIcon } from "@/components/icons/NavIcon";

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
    <main className="flex w-full flex-col gap-8 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="search" className="h-5 w-5" />
          네이버 키워드 분석
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          네이버 검색광고 키워드 실적과 경쟁사 대비 노출순위를 모니터링합니다.
        </p>
      </div>

      {!dashboard.latestDate && (
        <div className="rounded-sm border border-hairline bg-canvas-cream p-6 text-sm text-ink-mute">
          아직 모니터링 에이전트가 수집한 데이터가 없습니다. 파이프라인이 최소 1회 실행되면
          여기에 결과가 표시됩니다.
        </div>
      )}

      <AdAccountStatsPanel data={dashboard.adAccountStats} />

      <KpiCards kpi={dashboard.kpi} />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-sm border border-hairline bg-canvas-cream p-4">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-mute">
            <NavIcon name="chart" className="h-4 w-4" />
            키워드 평균 노출순위 추이 (최근 14일)
          </h2>
          <RankTrendChart data={dashboard.rankTrend} />
        </div>
        <div className="rounded-sm border border-hairline bg-canvas-cream p-4">
          <HotKeywordTreemap keywordTable={dashboard.keywordTable} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-mute">
          <NavIcon name="list" className="h-4 w-4" />
          키워드별 상세
        </h2>
        <KeywordTable data={dashboard.keywordTable} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-mute">
            <NavIcon name="alert" className="h-4 w-4" />
            이상 징후 알림
          </h2>
          <AlertsList data={dashboard.alerts} />
        </div>
        <div>
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-mute">
            <NavIcon name="document" className="h-4 w-4" />
            최근 리포트
          </h2>
          <ReportsList data={keywordReports} />
        </div>
      </section>
    </main>
  );
}
