import { requireAuthedClient } from "@/lib/supabase/authed";
import { getNewsArticles } from "@/lib/queries/news";
import { NewsList } from "@/components/dashboard/NewsList";

export default async function NewsPage() {
  const { supabase } = await requireAuthedClient();
  const articles = await getNewsArticles(supabase);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-primary">뉴스 모니터링</h1>
        <p className="mt-1 text-sm text-ink-mute">
          에듀테크·AI·교육감·교육청·교육부 등 영업 전략에 영향을 줄 수 있는 정책·사업 관련
          뉴스를 네이버 뉴스 검색 기반으로 모읍니다.
        </p>
      </div>
      <NewsList articles={articles} />
    </main>
  );
}
