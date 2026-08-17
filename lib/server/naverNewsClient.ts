import "server-only";

// airpass-naver-monitor의 scripts/lib/naver-openapi-client.ts와 동일한 스펙(NAVER API HUB,
// 뉴스 검색) — 새 키워드를 등록하는 즉시 그 자리에서 백필하기 위해 대시보드 서버에도
// 같은 클라이언트를 둔다. 절대 클라이언트 컴포넌트/브라우저 번들로 흘러가면 안 된다.
const BASE_URL = "https://naverapihub.apigw.ntruss.com";

export type NewsSearchItem = {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
};

export async function searchNews(query: string, display = 20): Promise<NewsSearchItem[]> {
  const clientId = process.env.NAVER_OPENAPI_CLIENT_ID;
  const clientSecret = process.env.NAVER_OPENAPI_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("NAVER_OPENAPI_CLIENT_ID/SECRET 환경변수가 설정되지 않았습니다.");
  }

  const url = new URL("/search/v1/news", BASE_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("display", String(display));
  url.searchParams.set("sort", "date");

  const res = await fetch(url, {
    headers: {
      "X-NCP-APIGW-API-KEY-ID": clientId,
      "X-NCP-APIGW-API-KEY": clientSecret,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`뉴스 검색 API 실패 (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { items: NewsSearchItem[] };
  return json.items;
}

function stripHtml(s: string): string {
  return s
    .replace(/<\/?b>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");
}

function toIso(pubDate: string): string | null {
  const d = new Date(pubDate);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export type NewsArticleRow = {
  keyword: string;
  title: string;
  link: string;
  description: string;
  published_at: string | null;
};

/** 키워드 하나를 검색해 news_articles upsert용 행으로 바로 매핑한다(naver-news-fetch.ts와
 * 동일한 정제 로직). */
export async function fetchNewsForKeyword(keyword: string): Promise<NewsArticleRow[]> {
  const items = await searchNews(keyword);
  const seen = new Set<string>();
  const rows: NewsArticleRow[] = [];
  for (const item of items) {
    const link = item.originallink || item.link;
    if (!link || seen.has(link)) continue;
    seen.add(link);
    rows.push({
      keyword,
      title: stripHtml(item.title),
      link,
      description: stripHtml(item.description),
      published_at: toIso(item.pubDate),
    });
  }
  return rows;
}
