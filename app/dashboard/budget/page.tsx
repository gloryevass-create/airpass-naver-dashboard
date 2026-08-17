import { requireAuthedClient } from "@/lib/supabase/authed";
import { getBudgetBids } from "@/lib/queries/budget";
import { getMonitorKeywords } from "@/lib/queries/monitorKeywords";
import { BudgetBidList } from "@/components/dashboard/BudgetBidList";
import { MonitorDateRangeFilter } from "@/components/dashboard/MonitorDateRangeFilter";
import { MonitorKeywordManager } from "@/components/dashboard/MonitorKeywordManager";

type SearchParams = Promise<{ from?: string; to?: string }>;

export default async function BudgetPage({ searchParams }: { searchParams: SearchParams }) {
  const { from, to } = await searchParams;
  const { supabase } = await requireAuthedClient();
  const [{ bids, range }, keywords] = await Promise.all([
    getBudgetBids(supabase, { since: from, until: to }),
    getMonitorKeywords(supabase, "budget"),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-primary">예산 모니터링</h1>
        <p className="mt-1 text-sm text-ink-mute">
          그린스마트미래학교·공간재구조화·VR스포츠실 등 교육청 사업명이 등장하는 나라장터
          입찰공고를 사업명·예산금액과 함께 모읍니다(조달청 공식 API 기반).
        </p>
      </div>
      <MonitorKeywordManager track="budget" keywords={keywords} path="/dashboard/budget" />
      <MonitorDateRangeFilter basePath="/dashboard/budget" range={range} resultCount={bids.length} />
      <BudgetBidList bids={bids} />
    </main>
  );
}
