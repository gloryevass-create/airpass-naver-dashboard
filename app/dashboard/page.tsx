import { requireAuthedClient } from "@/lib/supabase/authed";
import { getDashboardData } from "@/lib/queries/dashboard";
import { DashboardHeader } from "@/components/DashboardHeader";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { RankTrendChart } from "@/components/dashboard/RankTrendChart";
import { AdSpendChart } from "@/components/dashboard/AdSpendChart";
import { KeywordTable } from "@/components/dashboard/KeywordTable";
import { SovPieChart } from "@/components/dashboard/SovPieChart";
import { CadenceTable } from "@/components/dashboard/CadenceTable";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { ReportsList } from "@/components/dashboard/ReportsList";

export default async function DashboardPage() {
  const { supabase, user } = await requireAuthedClient();

  const [{ data: profile }, dashboard] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    getDashboardData(supabase),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        email={user.email ?? ""}
        isAdmin={profile?.role === "admin"}
        latestDate={dashboard.latestDate}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
        {!dashboard.latestDate && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600">
            아직 모니터링 에이전트가 수집한 데이터가 없습니다. 파이프라인이 최소 1회 실행되면
            여기에 결과가 표시됩니다.
          </div>
        )}

        <KpiCards kpi={dashboard.kpi} />

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-neutral-200 p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-700">
              키워드 평균 노출순위 추이 (최근 14일)
            </h2>
            <RankTrendChart data={dashboard.rankTrend} />
          </div>
          <div className="rounded-lg border border-neutral-200 p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-700">
              경쟁사별 월 예상 광고비
            </h2>
            <AdSpendChart data={dashboard.adSpendByCompetitor} />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">키워드별 상세</h2>
          <KeywordTable data={dashboard.keywordTable} />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-neutral-200 p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-700">
              블로그 노출 점유율 (SOV)
            </h2>
            <SovPieChart data={dashboard.sov} />
          </div>
          <div className="rounded-lg border border-neutral-200 p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-700">
              경쟁사 블로그 포스팅 주기
            </h2>
            <CadenceTable data={dashboard.cadence} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-neutral-700">이상 징후 알림</h2>
            <AlertsList data={dashboard.alerts} />
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-neutral-700">최근 리포트</h2>
            <ReportsList data={dashboard.reports} />
          </div>
        </section>
      </main>
    </div>
  );
}
