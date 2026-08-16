import { requireAuthedClient } from "@/lib/supabase/authed";
import { getDashboardData } from "@/lib/queries/dashboard";
import { SovChart } from "@/components/dashboard/SovChart";
import { CadenceTable } from "@/components/dashboard/CadenceTable";
import { ReportsList } from "@/components/dashboard/ReportsList";

export default async function BlogPage() {
  const { supabase } = await requireAuthedClient();
  const dashboard = await getDashboardData(supabase);

  const blogReports = dashboard.reports.filter((r) => r.track !== "ad");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      {!dashboard.latestDate && (
        <div className="rounded-xl border border-hairline bg-canvas-cream p-6 text-sm text-ink-mute">
          아직 모니터링 에이전트가 수집한 데이터가 없습니다. 파이프라인이 최소 1회 실행되면
          여기에 결과가 표시됩니다.
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-hairline p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink-mute">
            블로그 노출 점유율 (SOV)
          </h2>
          <SovChart data={dashboard.sov} />
        </div>
        <div className="rounded-xl border border-hairline p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink-mute">블로그 포스팅 주기</h2>
          <CadenceTable data={dashboard.cadence} />
          <p className="mt-2 text-[11px] text-ink-mute">
            * 에어패스 자체 블로그를 포함합니다. 총 게시물 수는 모니터링을 시작한 이후 누적
            수집된 건수입니다.
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-mute">최근 리포트</h2>
        <ReportsList data={blogReports} />
      </section>
    </main>
  );
}
