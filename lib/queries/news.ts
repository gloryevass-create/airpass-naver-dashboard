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

/** 스크랩한 기사는 조회 기간(기본 30일 롤링 윈도우) 밖으로 밀려나도 "스크랩" 탭에서는
 * 계속 보여야 한다 — getNewsArticles는 항상 기간 필터가 걸려 있어 이 용도로 못 쓴다.
 * (버그: 스크랩 배지 카운트는 notice_scraps 기준이라 안 줄어드는데, 목록은 기간 필터를
 * 통과 못 해 사라지는 것처럼 보였음 — 사용자 확인, 2026-08-24) */
export async function getScrapedNewsArticles(supabase: Client, ids: string[]): Promise<NewsArticle[]> {
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("news_articles")
    .select("*")
    .in("id", ids)
    .order("published_at", { ascending: false, nullsFirst: false });

  return (data ?? []).map((a) => ({
    id: a.id,
    keyword: a.keyword,
    title: a.title,
    link: a.link,
    description: a.description,
    publishedAt: a.published_at,
    collectedAt: a.collected_at,
  }));
}
