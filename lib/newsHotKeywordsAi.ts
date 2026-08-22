import "server-only";
import { unstable_cache } from "next/cache";
import { extractHotKeywords, type HotKeyword } from "@/lib/newsKeywordFrequency";

// 조회 기간에 수집된 뉴스 제목에서 화제가 되는 키워드를 Claude로 뽑는다(빈도 계산 대신).
// 같은 제목 목록에 대해서는 다시 API를 부르지 않도록 unstable_cache로 감싼다 — 인자(titles)가
// 그대로 캐시 키에 포함되므로 제목 목록이 달라지면(날짜 범위 변경, 새 기사 수집) 자동으로
// 새 캐시 항목이 된다. API 실패 시(키 미설정, 네트워크 오류 등) 화면이 비지 않도록 기존
// 빈도 계산 방식으로 조용히 대체한다.

const MODEL = "claude-haiku-4-5-20251001";
const MAX_KEYWORDS = 15;

async function callClaude(titles: string[]): Promise<HotKeyword[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content:
            `다음은 특정 기간에 수집된 뉴스 기사 제목 ${titles.length}개입니다. ` +
            `extract_hot_keywords 도구로, 이 제목들에서 실제로 반복 등장하는 핵심 키워드를 ` +
            `최대 ${MAX_KEYWORDS}개까지 뽑아 등장 빈도가 높은 순으로 반환하세요. ` +
            `제목에 등장하지 않는 단어를 지어내지 마세요. count에는 그 키워드(명백한 동의어·줄임말 포함)가 ` +
            `등장한 제목 수를 정확히 세어 넣으세요.\n\n` +
            titles.map((t, i) => `${i + 1}. ${t}`).join("\n"),
        },
      ],
      tools: [
        {
          name: "extract_hot_keywords",
          description: "뉴스 제목들에서 화제가 되는 핵심 키워드를 빈도순으로 반환한다.",
          input_schema: {
            type: "object",
            properties: {
              keywords: {
                type: "array",
                maxItems: MAX_KEYWORDS,
                items: {
                  type: "object",
                  properties: {
                    term: { type: "string" },
                    count: { type: "integer" },
                  },
                  required: ["term", "count"],
                },
              },
            },
            required: ["keywords"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "extract_hot_keywords" },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`핫 키워드 분석 실패 (${response.status}): ${text.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    content?: { type: string; input?: { keywords?: unknown } }[];
  };
  const toolUse = payload.content?.find((block) => block.type === "tool_use");
  const raw = toolUse?.input?.keywords;
  if (!Array.isArray(raw)) throw new Error("핫 키워드 응답 형식이 올바르지 않습니다.");

  return raw
    .filter(
      (k): k is { term: string; count: number } =>
        typeof k === "object" && k !== null && typeof (k as { term?: unknown }).term === "string" &&
        typeof (k as { count?: unknown }).count === "number"
    )
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_KEYWORDS);
}

const getCachedHotKeywords = unstable_cache(callClaude, ["news-hot-keywords-ai"], {
  revalidate: 3600,
});

export async function extractHotKeywordsWithAI(titles: string[]): Promise<HotKeyword[]> {
  if (titles.length === 0) return [];
  try {
    return await getCachedHotKeywords(titles);
  } catch (e) {
    console.error("[newsHotKeywordsAi] AI 추출 실패, 빈도 계산으로 대체:", e instanceof Error ? e.message : e);
    return extractHotKeywords(titles);
  }
}
