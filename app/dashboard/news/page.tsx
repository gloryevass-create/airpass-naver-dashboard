import { Suspense } from "react";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getNewsArticles, getScrapedNewsArticles } from "@/lib/queries/news";
import { getMonitorKeywords } from "@/lib/queries/monitorKeywords";
import { getScrapedNoticeIds } from "@/lib/queries/scraps";
import { extractHotKeywordsWithAI } from "@/lib/newsHotKeywordsAi";
import { NewsList } from "@/components/dashboard/NewsList";
import { NewsHotKeywords } from "@/components/dashboard/NewsHotKeywords";
import { NewsDateRangeFilter } from "@/components/dashboard/NewsDateRangeFilter";
import { MonitorKeywordManager } from "@/components/dashboard/MonitorKeywordManager";
import { NavIcon } from "@/components/icons/NavIcon";

type SearchParams = Promise<{ from?: string; to?: string }>;

// AI 핫 키워드 분석은 실제로 Claude를 호출해서 1~2초 이상 걸린다 — 페이지 전체를
// 기다리게 하지 않도록 별도 컴포넌트로 분리해 Suspense로 스트리밍한다.
async function HotKeywordsSection({ titles }: { titles: string[] }) {
  const hotKeywords = await extractHotKeywordsWithAI(titles);
  return <NewsHotKeywords keywords={hotKeywords} />;
}

function HotKeywordsSkeleton() {
  return (
    <div className="rounded-sm border border-hairline bg-canvas-cream p-4">
      <h2 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-ink-mute">
        <NavIcon name="sparkle" className="h-4 w-4" />
        AI 분석 핫 키워드
      </h2>
      <p className="text-xs text-ink-mute">AI가 분석 중입니다...</p>
    </div>
  );
}

export default async function NewsPage({ searchParams }: { searchParams: SearchParams }) {
  const { from, to } = await searchParams;
  const { supabase, user } = await requireAuthedClient();
  const [{ articles, range }, keywords, scrapedIds] = await Promise.all([
    getNewsArticles(supabase, { since: from, until: to }),
    getMonitorKeywords(supabase, "news"),
    getScrapedNoticeIds(supabase, user.id, "news"),
  ]);
  const scrapedArticles = await getScrapedNewsArticles(supabase, Array.from(scrapedIds));

  return (
    <main className="flex w-full flex-col gap-6 p-6">
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
      <NewsDateRangeFilter basePath="/dashboard/news" range={range} resultCount={articles.length} />
      <Suspense fallback={<HotKeywordsSkeleton />}>
        <HotKeywordsSection titles={articles.map((a) => a.title)} />
      </Suspense>
      <NewsList
        articles={articles}
        scrapedArticles={scrapedArticles}
        registeredKeywords={keywords.map((k) => k.keyword)}
        scrapedIds={scrapedIds}
      />
    </main>
  );
}
