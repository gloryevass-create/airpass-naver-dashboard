import { requireAuthedClient } from "@/lib/supabase/authed";
import { getPrespecNotices, getScrapedPrespecNotices } from "@/lib/queries/prespec";
import { getMonitorKeywords } from "@/lib/queries/monitorKeywords";
import { getScrapedNoticeIds } from "@/lib/queries/scraps";
import { PrespecNoticeList } from "@/components/dashboard/PrespecNoticeList";
import { NewsDateRangeFilter } from "@/components/dashboard/NewsDateRangeFilter";
import { NavIcon } from "@/components/icons/NavIcon";
import Link from "next/link";

type SearchParams = Promise<{ from?: string; to?: string }>;
const PATH = "/dashboard/prespec";

export default async function PrespecPage({ searchParams }: { searchParams: SearchParams }) {
  const { from, to } = await searchParams;
  const { supabase, user } = await requireAuthedClient();
  const [{ notices, range }, keywords, scrapedIds] = await Promise.all([
    getPrespecNotices(supabase, { since: from, until: to }),
    getMonitorKeywords(supabase, "budget"),
    getScrapedNoticeIds(supabase, user.id, "prespec"),
  ]);
  const scrapedNotices = await getScrapedPrespecNotices(supabase, Array.from(scrapedIds));

  return (
    <main className="flex w-full flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="search" className="h-5 w-5" />
          조달사전규격
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          입찰공고가 뜨기 전, 발주기관이 규격을 미리 공개해 의견을 수렴하는 단계를
          모니터링합니다(조달청 나라장터 사전규격정보서비스 기반). 검색 키워드는{" "}
          <Link href="/dashboard/budget" className="text-link-blue hover:underline">
            조달입찰공고
          </Link>
          과 동일한 목록을 씁니다.
        </p>
      </div>
      <NewsDateRangeFilter basePath={PATH} range={range} resultCount={notices.length} />
      <PrespecNoticeList
        notices={notices}
        scrapedNotices={scrapedNotices}
        registeredKeywords={keywords.map((k) => k.keyword)}
        scrapedIds={scrapedIds}
        path={PATH}
      />
    </main>
  );
}
