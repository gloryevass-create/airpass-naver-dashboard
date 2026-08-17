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

export async function getNewsArticles(supabase: Client): Promise<NewsArticle[]> {
  const { data } = await supabase
    .from("news_articles")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(NEWS_DISPLAY_LIMIT);

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
