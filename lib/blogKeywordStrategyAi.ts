import "server-only";
import { unstable_cache } from "next/cache";

const MODEL = "claude-haiku-4-5-20251001";

type SovInput = { competitorName: string; sharePct: number };
type KeywordInput = { keyword: string; matchCount: number };

async function callClaude(sov: SovInput[], keywords: KeywordInput[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");

  const sovText = sov.length
    ? sov.map((s) => `- ${s.competitorName}: ${s.sharePct}%`).join("\n")
    : "(집계된 데이터 없음)";
  const keywordText = keywords.length
    ? keywords
        .slice(0, 20)
        .map((k) => `- ${k.keyword} (게시물 매칭 ${k.matchCount}건)`)
        .join("\n")
    : "(집계된 데이터 없음)";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content:
            "에어패스(우리 회사)와 경쟁사들의 블로그 노출 점유율(SOV), 그리고 실제 게시물 제목과 " +
            "겹치는 주요 키워드 목록입니다. 이 데이터만 근거로 삼아 키워드 전략 코멘트를 " +
            "3~4문장, 자연스러운 문단으로 작성하세요. 어느 경쟁사가 어느 키워드/영역에서 " +
            "앞서는지, 에어패스가 어떤 키워드를 더 강화하면 좋을지를 구체적으로 언급하세요. " +
            "제목·헤더·불릿·마크다운 기호 없이 코멘트 문단 텍스트만 출력하세요. " +
            "데이터에 없는 수치나 사실을 지어내지 마세요.\n\n" +
            `블로그 노출 점유율(SOV):\n${sovText}\n\n` +
            `콘텐츠 매칭 키워드(제목 매칭 건수 순):\n${keywordText}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`AI 키워드 전략 코멘트 생성 실패 (${response.status}): ${text.slice(0, 300)}`);
  }

  const payload = (await response.json()) as { content?: { type: string; text?: string }[] };
  const textBlock = payload.content?.find((block) => block.type === "text");
  if (!textBlock?.text) throw new Error("AI 응답에서 코멘트를 찾지 못했습니다.");
  // 모델이 지시를 무시하고 마크다운 제목 줄을 앞에 붙이는 경우를 대비한 방어적 제거.
  return textBlock.text.trim().replace(/^#{1,6}\s.*\n+/, "").trim();
}

const getCachedComment = unstable_cache(callClaude, ["blog-keyword-strategy-ai"], {
  revalidate: 3600,
});

export async function getKeywordStrategyComment(
  sov: SovInput[],
  keywords: KeywordInput[]
): Promise<string | null> {
  if (sov.length === 0 && keywords.length === 0) return null;
  try {
    return await getCachedComment(sov, keywords);
  } catch (e) {
    console.error(
      "[blogKeywordStrategyAi] 코멘트 생성 실패:",
      e instanceof Error ? e.message : e
    );
    return null;
  }
}
