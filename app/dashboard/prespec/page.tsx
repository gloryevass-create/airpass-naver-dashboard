import { requireAuthedClient } from "@/lib/supabase/authed";
import { getPrespecNotices } from "@/lib/queries/prespec";
import { getMonitorKeywords } from "@/lib/queries/monitorKeywords";
import { PrespecNoticeList } from "@/components/dashboard/PrespecNoticeList";
import { MonitorDateRangeFilter } from "@/components/dashboard/MonitorDateRangeFilter";
import { NavIcon } from "@/components/icons/NavIcon";
import Link from "next/link";

type SearchParams = Promise<{ from?: string; to?: string }>;

export default async function PrespecPage({ searchParams }: { searchParams: SearchParams }) {
  const { from, to } = await searchParams;
  const { supabase } = await requireAuthedClient();
  const [{ notices, range }, keywords] = await Promise.all([
    getPrespecNotices(supabase, { since: from, until: to }),
    getMonitorKeywords(supabase, "budget"),
  ]);

  return (
    <main className="mx-auto flex w-[80%] flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="search" className="h-5 w-5" />
          사전규격
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          입찰공고가 뜨기 전, 발주기관이 규격을 미리 공개해 의견을 수렴하는 단계를
          모니터링합니다(조달청 나라장터 사전규격정보서비스 기반). 검색 키워드는{" "}
          <Link href="/dashboard/budget" className="text-link-blue hover:underline">
            공고 모니터링
          </Link>
          과 동일한 목록을 씁니다.
        </p>
      </div>
      <MonitorDateRangeFilter basePath="/dashboard/prespec" range={range} resultCount={notices.length} />
      <PrespecNoticeList notices={notices} registeredKeywords={keywords.map((k) => k.keyword)} />
    </main>
  );
}
