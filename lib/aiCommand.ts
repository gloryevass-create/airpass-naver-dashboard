import "server-only";

/** 통합 AI 입력창의 라우팅 로직 — 자유 문장을 받아 Calendar 일정 등록/Memo Board
 * 작성 중 어느 것에 해당하는지 판단하고 필드까지 한 번에 추출한다.
 * vendorDocumentAi.ts와 동일하게 Anthropic Messages API의 강제 tool-use를 쓰되,
 * 도구를 여러 개 주고 tool_choice를 "any"로 둬서 모델이 그중 하나를 고르게 한다
 * (판단과 추출을 한 번의 호출로 끝냄 — 별도 분류 단계를 두지 않음).
 * 이 함수는 절대 DB에 쓰지 않는다 — 항상 미리보기 폼을 채우는 초안만 반환하고,
 * 실제 저장은 기존 create 액션(createTeamEventV2/createMemo)이 그대로 담당한다. */

const MODEL = "claude-haiku-4-5-20251001";

export type AiCalendarEventDraft = {
  title: string;
  dateStart: string; // KST 기준 "YYYY-MM-DDTHH:mm" (datetime-local 입력값과 동일 형식)
  dateEnd: string;
  isAllDay: boolean;
  category: string;
  location: string;
  target: string;
  content: string;
  assignees: string[];
  attendees: string[];
};

export type AiMemoDraft = {
  category: "business" | "cooperation" | "marketing" | "etc";
  title: string;
  content: string;
};

export type AiCommandResult =
  | { tool: "create_calendar_event"; input: AiCalendarEventDraft }
  | { tool: "create_memo"; input: AiMemoDraft }
  | { tool: "ask_clarification"; question: string };

export type AiCommandTurn = { role: "user" | "assistant"; text: string };

function todayInSeoul(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const MEMO_CATEGORIES = ["business", "cooperation", "marketing", "etc"] as const;

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).map((s) => s.trim()).filter(Boolean) : [];
}

export async function runAiCommand(
  message: string,
  history: AiCommandTurn[],
  context: { userName: string; teamMembers: string[] }
): Promise<AiCommandResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");

  const messages = [
    ...history.slice(-6).map((t) => ({ role: t.role, content: t.text })),
    { role: "user" as const, content: message },
  ];

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
      system: `당신은 사내 대시보드의 통합 AI 입력 도우미입니다. 사용자의 자유 문장을 보고 Calendar 일정 등록, Memo Board 메모 작성 중 어느 것에 해당하는지 판단해 알맞은 도구를 정확히 하나 호출하세요.
오늘 날짜는 ${todayInSeoul()}(KST)입니다. "내일", "다음주 화요일" 같은 상대 날짜는 이 날짜를 기준으로 계산하세요.
현재 로그인한 사용자 이름은 "${context.userName}"입니다. "내가", "나" 같은 표현은 이 이름으로 처리하세요.
실제 팀원 이름 목록: ${context.teamMembers.join(", ") || "(없음)"}. 담당자·참석자는 반드시 이 목록에서 정확히 일치하는 이름만 넣고, 목록에 없거나 불확실한 이름은 추측해서 넣지 말고 빈 배열로 두세요.
일정도 메모도 아니거나, 제목·날짜처럼 필수 정보가 빠져 등록할 수 없으면 ask_clarification 도구로 한 가지만 짧게 되물으세요. 억지로 다른 도구를 고르지 마세요.
모르는 값은 절대 추측하지 말고 빈 문자열/빈 배열로 두세요.`,
      messages,
      tools: [
        {
          name: "create_calendar_event",
          description: "Calendar 메뉴에 새 팀 일정을 등록한다. 일정 제목과 날짜(시간)가 비교적 분명할 때만 사용한다.",
          input_schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              dateStart: {
                type: "string",
                description: "시작 일시, KST 기준 YYYY-MM-DDTHH:mm. 시간이 언급되지 않았으면 09:00으로 채운다.",
              },
              dateEnd: { type: "string", description: "종료 일시, 같은 형식. 없으면 빈 문자열." },
              isAllDay: { type: "boolean", description: "시간 없이 날짜만 있는 일정이면 true" },
              category: { type: "string", description: "분류(예: 미팅, 외근). 모르면 빈 문자열" },
              location: { type: "string" },
              target: { type: "string", description: "대상(예: 전사, 영업팀). 모르면 빈 문자열" },
              content: { type: "string" },
              assignees: { type: "array", items: { type: "string" } },
              attendees: { type: "array", items: { type: "string" } },
            },
            required: [
              "title",
              "dateStart",
              "dateEnd",
              "isAllDay",
              "category",
              "location",
              "target",
              "content",
              "assignees",
              "attendees",
            ],
          },
        },
        {
          name: "create_memo",
          description: "Memo Board에 새 메모를 작성한다. 특정 안건에 대한 메모·의견·정리 요청일 때 사용한다.",
          input_schema: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: [...MEMO_CATEGORIES],
                description: "business=SI Business, cooperation=Cooperation, marketing=Marketing, etc=기타",
              },
              title: { type: "string" },
              content: { type: "string" },
            },
            required: ["category", "title", "content"],
          },
        },
        {
          name: "ask_clarification",
          description: "요청이 모호하거나 필수 정보가 빠졌을 때 짧게 되묻는다.",
          input_schema: {
            type: "object",
            properties: { question: { type: "string" } },
            required: ["question"],
          },
        },
      ],
      tool_choice: { type: "any" },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`AI 처리 실패 (${response.status}): ${text.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    content?: { type: string; name?: string; input?: Record<string, unknown> }[];
  };
  const toolUse = payload.content?.find((b) => b.type === "tool_use");
  if (!toolUse?.name || !toolUse.input) throw new Error("AI가 요청을 이해하지 못했습니다.");

  const input = toolUse.input;

  if (toolUse.name === "create_calendar_event") {
    return {
      tool: "create_calendar_event",
      input: {
        title: String(input.title ?? "").trim(),
        dateStart: String(input.dateStart ?? "").trim(),
        dateEnd: String(input.dateEnd ?? "").trim(),
        isAllDay: Boolean(input.isAllDay),
        category: String(input.category ?? "").trim(),
        location: String(input.location ?? "").trim(),
        target: String(input.target ?? "").trim(),
        content: String(input.content ?? "").trim(),
        assignees: toStringArray(input.assignees),
        attendees: toStringArray(input.attendees),
      },
    };
  }

  if (toolUse.name === "create_memo") {
    const category = (MEMO_CATEGORIES as readonly string[]).includes(String(input.category))
      ? (input.category as AiMemoDraft["category"])
      : "etc";
    return {
      tool: "create_memo",
      input: {
        category,
        title: String(input.title ?? "").trim(),
        content: String(input.content ?? "").trim(),
      },
    };
  }

  return { tool: "ask_clarification", question: String(input.question ?? "요청을 다시 말씀해 주세요.") };
}
