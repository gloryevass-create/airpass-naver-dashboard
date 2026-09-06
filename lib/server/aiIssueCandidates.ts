import "server-only";
import { searchNews, type NewsSearchItem } from "@/lib/server/naverNewsClient";

// AI Issue(2026-09-06)가 매일 아침 판단할 후보 기사 풀을 모은다 — news_articles처럼
// 사용자가 등록/관리하는 키워드가 아니라, AI 업계 전반을 훑는 고정된 검색어
// 세트다(사용자 확인: "키워드 방식은 아니고 이슈가 되는것을 판단해서"). 이
// 검색어들은 후보를 넓게 모으기 위한 것일 뿐 — 실제로 "이슈"인지 판단은
// lib/server/aiIssueSelection.ts가 Claude로 한다.
const CANDIDATE_QUERIES = [
  "인공지능",
  "생성형 AI",
  "챗GPT",
  "오픈AI",
  "구글 제미나이",
  "AI 규제",
  "AI 반도체",
  "메타 AI",
];

const MAX_ARTICLE_AGE_HOURS = 36;
const DISPLAY_PER_QUERY = 15;

export type AiIssueCandidate = {
  query: string;
  title: string;
  link: string;
  description: string;
  publishedAt: string | null;
};

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

function toCandidate(query: string, item: NewsSearchItem): AiIssueCandidate | null {
  const link = item.originallink || item.link;
  if (!link) return null;
  return {
    query,
    title: stripHtml(item.title),
    link,
    description: stripHtml(item.description),
    publishedAt: toIso(item.pubDate),
  };
}

/** 고정 검색어 세트로 네이버 뉴스를 넓게 훑어 최근 기사만 남기고 링크로
 * 중복 제거한다 — 하나의 실제 이슈가 여러 검색어에 동시에 걸리는 경우가
 * 흔해서(예: "챗GPT"와 "오픈AI" 둘 다에 같은 기사가 잡힘) 반드시 필요하다. */
export async function fetchAiIssueCandidates(): Promise<AiIssueCandidate[]> {
  const results = await Promise.allSettled(
    CANDIDATE_QUERIES.map((q) => searchNews(q, DISPLAY_PER_QUERY).then((items) => ({ query: q, items })))
  );

  const cutoff = Date.now() - MAX_ARTICLE_AGE_HOURS * 3600 * 1000;
  const seen = new Set<string>();
  const candidates: AiIssueCandidate[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") {
      console.error("[fetchAiIssueCandidates] 검색 실패:", result.reason instanceof Error ? result.reason.message : result.reason);
      continue;
    }
    const { query, items } = result.value;
    for (const item of items) {
      const candidate = toCandidate(query, item);
      if (!candidate || seen.has(candidate.link)) continue;
      if (candidate.publishedAt && new Date(candidate.publishedAt).getTime() < cutoff) continue;
      seen.add(candidate.link);
      candidates.push(candidate);
    }
  }

  return candidates;
}
