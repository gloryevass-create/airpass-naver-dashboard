import { requireAuthedClient } from "@/lib/supabase/authed";
import { getNewsArticles } from "@/lib/queries/news";
import { getMonitorKeywords } from "@/lib/queries/monitorKeywords";
import { getScrapedNoticeIds } from "@/lib/queries/scraps";
import { extractHotKeywords } from "@/lib/newsKeywordFrequency";
import { NewsList } from "@/components/dashboard/NewsList";
import { NewsHotKeywords } from "@/components/dashboard/NewsHotKeywords";
import { MonitorDateRangeFilter } from "@/components/dashboard/MonitorDateRangeFilter";
import { MonitorKeywordManager } from "@/components/dashboard/MonitorKeywordManager";
import { NavIcon } from "@/components/icons/NavIcon";

type SearchParams = Promise<{ from?: string; to?: string }>;

export default async function NewsPage({ searchParams }: { searchParams: SearchParams }) {
  const { from, to } = await searchParams;
  const { supabase, user } = await requireAuthedClient();
  const [{ articles, range }, keywords, scrapedIds] = await Promise.all([
    getNewsArticles(supabase, { since: from, until: to }),
    getMonitorKeywords(supabase, "news"),
    getScrapedNoticeIds(supabase, user.id, "news"),
  ]);
  const hotKeywords = extractHotKeywords(articles.map((a) => a.title));

  return (
    <main className="mx-auto flex w-[90%] flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="newspaper" className="h-5 w-5" />
          교육관련뉴스
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          에듀테크·AI·교육감·교육청·교육부 등 영업 전략에 영향을 줄 수 있는 정책·사업 관련
          뉴스를 네이버 뉴스 검색 기반으로 모읍니다.
        </p>
      </div>
      <MonitorKeywordManager track="news" keywords={keywords} path="/dashboard/news" />
      <MonitorDateRangeFilter basePath="/dashboard/news" range={range} resultCount={articles.length} />
      <NewsHotKeywords keywords={hotKeywords} />
      <NewsList articles={articles} registeredKeywords={keywords.map((k) => k.keyword)} scrapedIds={scrapedIds} />
    </main>
  );
}
