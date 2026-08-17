import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type NewsArticle = {
  id: string;
  keyword: string;
  title: string;
  link: string;
  description: string | null;
  publishedAt: string | null;
  collectedAt: string;
};

const NEWS_DISPLAY_LIMIT = 200;
const DEFAULT_RANGE_DAYS = 30;

function daysBefore(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** 뉴스 데이터의 실제 마지막 수집일을 앵커로 쓴다(서버 시계 대신) — ad_account_daily_stats에서
 * 겪었던 UTC/KST 하루 어긋남 버그와 같은 클래스의 문제를 원천 차단한다. */
async function getLatestNewsDate(supabase: Client): Promise<string | null> {
  const { data } = await supabase
    .from("news_articles")
    .select("published_at")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.published_at ? data.published_at.slice(0, 10) : null;
}

export type NewsQueryResult = {
  articles: NewsArticle[];
  range: { since: string; until: string };
};

export async function getNewsArticles(
  supabase: Client,
  options?: { since?: string; until?: string }
): Promise<NewsQueryResult> {
  const latestDate = (await getLatestNewsDate(supabase)) ?? new Date().toISOString().slice(0, 10);
  const since = options?.since ?? daysBefore(latestDate, DEFAULT_RANGE_DAYS - 1);
  const until = options?.until ?? latestDate;

  const { data } = await supabase
    .from("news_articles")
    .select("*")
    .gte("published_at", `${since}T00:00:00Z`)
    .lte("published_at", `${until}T23:59:59Z`)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(NEWS_DISPLAY_LIMIT);

  const articles = (data ?? []).map((a) => ({
    id: a.id,
    keyword: a.keyword,
    title: a.title,
    link: a.link,
    description: a.description,
    publishedAt: a.published_at,
    collectedAt: a.collected_at,
  }));

  return { articles, range: { since, until } };
}
