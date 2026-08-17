import { requireAuthedClient } from "@/lib/supabase/authed";
import { getBudgetBids } from "@/lib/queries/budget";
import { BudgetBidList } from "@/components/dashboard/BudgetBidList";

export default async function BudgetPage() {
  const { supabase } = await requireAuthedClient();
  const bids = await getBudgetBids(supabase);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-primary">예산 모니터링</h1>
        <p className="mt-1 text-sm text-ink-mute">
          그린스마트미래학교·공간재구조화·VR스포츠실 등 교육청 사업명이 등장하는 나라장터
          입찰공고를 사업명·예산금액과 함께 모읍니다(조달청 공식 API 기반).
        </p>
      </div>
      <BudgetBidList bids={bids} />
    </main>
  );
}
