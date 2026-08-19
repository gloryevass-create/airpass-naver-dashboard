import { requireAuthedClient } from "@/lib/supabase/authed";
import { getDashboardData } from "@/lib/queries/dashboard";
import { getActiveCompetitors } from "@/lib/queries/competitors";
import { SovChart } from "@/components/dashboard/SovChart";
import { CadenceTable } from "@/components/dashboard/CadenceTable";
import { ContentMatchedKeywordTable } from "@/components/dashboard/ContentMatchedKeywordTable";
import { ReportsList } from "@/components/dashboard/ReportsList";
import { CompetitorBlogManager } from "@/components/dashboard/CompetitorBlogManager";
import { NavIcon } from "@/components/icons/NavIcon";

export default async function BlogPage() {
  const { supabase } = await requireAuthedClient();
  const [dashboard, competitors] = await Promise.all([
    getDashboardData(supabase),
    getActiveCompetitors(supabase),
  ]);

  const blogReports = dashboard.reports.filter((r) => r.track !== "ad");

  return (
    <main className="mx-auto flex w-[90%] flex-col gap-8 p-6">
      <CompetitorBlogManager competitors={competitors} path="/dashboard/blog" />
      {!dashboard.latestDate && (
        <div className="rounded-xl border border-hairline bg-canvas-cream p-6 text-sm text-ink-mute">
          아직 모니터링 에이전트가 수집한 데이터가 없습니다. 파이프라인이 최소 1회 실행되면
          여기에 결과가 표시됩니다.
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-hairline p-4">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-mute">
            <NavIcon name="pie" className="h-4 w-4" />
            블로그 노출 점유율 (SOV)
          </h2>
          <SovChart data={dashboard.sov} />
        </div>
        <div className="rounded-xl border border-hairline p-4">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-mute">
            <NavIcon name="calendar" className="h-4 w-4" />
            블로그 포스팅 주기
          </h2>
          <CadenceTable data={dashboard.cadence} />
          <p className="mt-2 text-[11px] text-ink-mute">
            * 에어패스 자체 블로그를 포함합니다. 총 게시물 수는 모니터링을 시작한 이후 누적
            수집된 건수입니다.
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-mute">
          <NavIcon name="tag" className="h-4 w-4" />
          콘텐츠 매칭 키워드 (경쟁사 게시물과 겹치는 주요 키워드 TOP 20)
        </h2>
        <ContentMatchedKeywordTable data={dashboard.contentMatchedKeywords} />
        <p className="mt-2 text-[11px] text-ink-mute">
          * 실제 수집된 경쟁사·에어패스 게시물 제목에 등장하는 단어와 겹치는 등록 키워드만
          모아 제목 매칭 건수 기준 상위 10개를 표시합니다. CPC는 계정의 biz channel 연동 전이라
          아직 채워지지 않았습니다. &ldquo;경쟁사별 이 키워드 광고 여부&rdquo;는 네이버가
          제3자에게 공개하지 않는 정보라 표시하지 않습니다.
        </p>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-mute">
          <NavIcon name="document" className="h-4 w-4" />
          최근 리포트
        </h2>
        <ReportsList data={blogReports} />
      </section>
    </main>
  );
}
