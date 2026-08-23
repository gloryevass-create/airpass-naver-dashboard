import { requireAuthedClient } from "@/lib/supabase/authed";
import { getMarketingTasks } from "@/lib/queries/marketingTasks";
import { MarketingTaskBoard } from "@/components/dashboard/MarketingTaskBoard";
import { NavIcon } from "@/components/icons/NavIcon";

export default async function MarketingTasksPage() {
  const { supabase } = await requireAuthedClient();
  const tasks = await getMarketingTasks(supabase);

  return (
    <main className="flex w-full flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="list" className="h-5 w-5" />
          마케팅업무
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          이 화면에서 직접 마케팅 업무를 추가·수정·삭제합니다(Notion 연동 없음 — 이 시스템이 원본입니다).
        </p>
      </div>

      <MarketingTaskBoard tasks={tasks} />
    </main>
  );
}
