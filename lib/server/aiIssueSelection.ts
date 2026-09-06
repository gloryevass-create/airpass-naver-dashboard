import "server-only";
import type { AiIssueCandidate } from "@/lib/server/aiIssueCandidates";

// news_articles/뉴스 모니터링과 달리 AI Issue는 후보를 전부 보여주는 게 아니라
// "실제로 이슈가 되는 것"만 하루 최대 10개 골라 보여준다(사용자 확인,
// 2026-09-06) — lib/newsHotKeywordsAi.ts와 같은 방식(fetch로 Claude Messages
// API 직접 호출 + tool_use로 구조화된 응답)을 재사용한다.
const MODEL = "claude-haiku-4-5-20251001";
const MAX_ISSUES = 10;

export type SelectedAiIssue = {
  index: number;
  summary: string;
};

export async function selectAiIssuesWithAI(candidates: AiIssueCandidate[]): Promise<SelectedAiIssue[]> {
  if (candidates.length === 0) return [];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");

  const listText = candidates
    .map((c, i) => `${i}. [${c.query}] ${c.title}\n   ${c.description}`)
    .join("\n\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content:
            `아래는 오늘 수집된 AI 관련 뉴스 후보 ${candidates.length}건입니다(번호는 0부터 시작). ` +
            `select_ai_issues 도구로, 이 중에서 실제로 "이슈"라고 부를 만한 항목만 최대 ${MAX_ISSUES}개 골라주세요. ` +
            `기준: 새 모델/서비스 출시, 주요 기업(OpenAI/Anthropic/Google/Meta 등)의 정책·인사·투자 변화, ` +
            `규제·법률 동향, 눈에 띄는 사고/논란, 업계 판도를 바꿀 만한 발표. ` +
            `단순 홍보성 기사, 동일 소식의 반복 보도(가장 구체적인 것 하나만), 사설·칼럼성 글은 제외하세요. ` +
            `목록에 없는 내용을 지어내지 말고, summary는 그 기사 제목·설명에 실제로 있는 내용만으로 한국어 한 문장으로 요약하세요. ` +
            `이슈로 볼 만한 게 하나도 없으면 빈 배열을 반환해도 됩니다.\n\n` +
            listText,
        },
      ],
      tools: [
        {
          name: "select_ai_issues",
          description: "AI 뉴스 후보 중 실제로 이슈가 되는 항목만 골라 반환한다.",
          input_schema: {
            type: "object",
            properties: {
              issues: {
                type: "array",
                maxItems: MAX_ISSUES,
                items: {
                  type: "object",
                  properties: {
                    index: { type: "integer", description: "후보 목록의 번호(0부터 시작)" },
                    summary: { type: "string", description: "한국어 한 문장 요약" },
                  },
                  required: ["index", "summary"],
                },
              },
            },
            required: ["issues"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "select_ai_issues" },
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`AI 이슈 선별 실패 (${response.status}): ${text.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    content?: { type: string; input?: { issues?: unknown } }[];
  };
  const toolUse = payload.content?.find((block) => block.type === "tool_use");
  const raw = toolUse?.input?.issues;
  if (!Array.isArray(raw)) throw new Error("AI 이슈 선별 응답 형식이 올바르지 않습니다.");

  return raw
    .filter(
      (v): v is { index: number; summary: string } =>
        typeof v === "object" &&
        v !== null &&
        typeof (v as { index?: unknown }).index === "number" &&
        typeof (v as { summary?: unknown }).summary === "string" &&
        (v as { index: number }).index >= 0 &&
        (v as { index: number }).index < candidates.length
    )
    .slice(0, MAX_ISSUES);
}
