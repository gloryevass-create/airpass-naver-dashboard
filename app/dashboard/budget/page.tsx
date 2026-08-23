import { requireAuthedClient } from "@/lib/supabase/authed";
import { getBudgetBids, getScrapedBudgetBids } from "@/lib/queries/budget";
import { getMonitorKeywords } from "@/lib/queries/monitorKeywords";
import { getScrapedNoticeIds } from "@/lib/queries/scraps";
import { BudgetBidList } from "@/components/dashboard/BudgetBidList";
import { MonitorDateRangeFilter } from "@/components/dashboard/MonitorDateRangeFilter";
import { MonitorKeywordManager } from "@/components/dashboard/MonitorKeywordManager";
import { NavIcon } from "@/components/icons/NavIcon";

type SearchParams = Promise<{ from?: string; to?: string }>;
const PATH = "/dashboard/budget";

export default async function BudgetPage({ searchParams }: { searchParams: SearchParams }) {
  const { from, to } = await searchParams;
  const { supabase, user } = await requireAuthedClient();
  const [{ bids, range }, keywords, scrapedIds] = await Promise.all([
    getBudgetBids(supabase, { since: from, until: to }),
    getMonitorKeywords(supabase, "budget"),
    getScrapedNoticeIds(supabase, user.id, "budget"),
  ]);
  const scrapedBids = await getScrapedBudgetBids(supabase, Array.from(scrapedIds));

  return (
    <main className="flex w-full flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="megaphone" className="h-5 w-5" />
          조달입찰공고
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          그린스마트미래학교·공간재구조화·VR스포츠실 등 교육청 사업명이 등장하는 나라장터
          입찰공고를 사업명·예산금액과 함께 모읍니다(조달청 공식 API 기반).
        </p>
      </div>
      <MonitorKeywordManager track="budget" keywords={keywords} path={PATH} />
      <MonitorDateRangeFilter basePath={PATH} range={range} resultCount={bids.length} />
      <BudgetBidList
        bids={bids}
        scrapedBids={scrapedBids}
        registeredKeywords={keywords.map((k) => k.keyword)}
        scrapedIds={scrapedIds}
        path={PATH}
      />
    </main>
  );
}
