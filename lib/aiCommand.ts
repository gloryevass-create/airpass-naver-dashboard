import "server-only";

/** 통합 AI 입력창의 라우팅 로직 — 자유 문장을 받아 Calendar 일정 등록/Memo Board
 * 작성/SI Business·Cooperation·Marketing 신규 항목 등록 중 어느 것에 해당하는지
 * 판단하고 필드까지 한 번에 추출한다. vendorDocumentAi.ts와 동일하게 Anthropic
 * Messages API의 강제 tool-use를 쓰되, 도구를 여러 개 주고 tool_choice를 "any"로
 * 둬서 모델이 그중 하나를 고르게 한다(판단과 추출을 한 번의 호출로 끝냄 — 별도
 * 분류 단계를 두지 않음).
 * 이 함수는 절대 DB에 쓰지 않는다 — 항상 각 메뉴의 create 액션에 그대로 넘길 수
 * 있는 초안만 반환하고, 실제 저장은 기존 create 액션이 그대로 담당한다. */

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

export type AiBusinessProjectDraft = {
  title: string;
  stage: string;
  status: string;
  orgName: string;
  participationType: string;
  workType: string;
  result: string;
  amount: string;
  progressRate: string;
  submissionDate: string;
  submissionMethod: string;
  presentationDate: string;
  constructionStart: string;
  constructionEnd: string;
  constructionContent: string;
  assignees: string[];
  notes: string;
};

export type AiCooperationProjectDraft = {
  title: string;
  company: string;
  relationType: string;
  workType: string;
  status: string;
  projectStartDate: string;
  projectEndDate: string;
  mainAssignees: string[];
  subAssignees: string[];
  content: string;
};

export type AiMarketingTaskDraft = {
  title: string;
  content: string;
  category: string;
  workType: string;
  stage: string;
  status: string;
  dueDate: string;
  dueDateEnd: string;
  assignees: string[];
};

export type AiMaterialEmailDraft = {
  recipients: string;
  subject: string;
  message: string;
  fileNameHints: string[];
};

export type AiCommandResult =
  | { tool: "create_calendar_event"; input: AiCalendarEventDraft }
  | { tool: "create_memo"; input: AiMemoDraft }
  | { tool: "create_business_project"; input: AiBusinessProjectDraft }
  | { tool: "create_cooperation_project"; input: AiCooperationProjectDraft }
  | { tool: "create_marketing_task"; input: AiMarketingTaskDraft }
  | { tool: "send_material_email"; input: AiMaterialEmailDraft }
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
const BUSINESS_STAGES = ["", "Ⅰ영업진행", "Ⅱ사업제안", "Ⅲ제안서작성", "Ⅳ사업수행", "Ⅴ사업완료"] as const;
const BUSINESS_STATUSES = ["시작 전", "진행 중", "완료", "보류", "실패"] as const;
const COOPERATION_RELATION_TYPES = [
  "",
  "콘텐츠",
  "하드웨어",
  "공동생산 판매",
  "제품 판매",
  "자재구매",
  "일반",
  "비즈니스협업",
] as const;
const COOPERATION_WORK_TYPES = [
  "",
  "아이디어",
  "시장조사",
  "기획",
  "개발",
  "상품화",
  "제품생산",
  "조달등록",
  "자료",
  "판매",
  "첫 미팅",
] as const;
const COOPERATION_STATUSES = ["시작 전", "진행 중", "완료", "종료"] as const;
const MARKETING_CATEGORIES = ["", "문서", "영상", "사진", "웹페이지", "광고"] as const;
const MARKETING_WORK_TYPES = ["", "브로슈어", "매뉴얼", "홈페이지", "SNS", "영상", "기타"] as const;
const MARKETING_STAGES = ["", "기획", "제작", "수행"] as const;
const MARKETING_STATUSES = ["시작 전", "진행 중", "완료", "종료"] as const;

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).map((s) => s.trim()).filter(Boolean) : [];
}

function str(input: Record<string, unknown>, key: string): string {
  return String(input[key] ?? "").trim();
}

function pickEnum<T extends readonly string[]>(input: Record<string, unknown>, key: string, options: T, fallback: T[number]): T[number] {
  const value = String(input[key] ?? "");
  return (options as readonly string[]).includes(value) ? value : fallback;
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
      max_tokens: 1536,
      system: `당신은 사내 대시보드의 통합 AI 입력 도우미입니다. 사용자의 자유 문장을 보고 아래 중 어느 메뉴에 해당하는지 판단해 알맞은 도구를 정확히 하나 호출하세요.
- Calendar: 팀 일정 등록
- Memo Board: 특정 안건에 대한 메모·의견 작성
- SI Business: 관공서·기관 대상 영업/사업 진행 건 신규 등록(발주기관, 사업 단계·진행상태 등)
- Cooperation: 협력사와의 협업 건 신규 등록(콘텐츠/하드웨어/공동생산 등 관계 유형)
- Marketing: 마케팅 업무 신규 등록(브로슈어·홈페이지·영상 등 제작 업무)
- 자료메일발송: 구글드라이브 자료를 이메일로 보내기(자료 소개·전달 요청)
오늘 날짜는 ${todayInSeoul()}(KST)입니다. "내일", "다음주 화요일" 같은 상대 날짜는 이 날짜를 기준으로 계산하세요.
현재 로그인한 사용자 이름은 "${context.userName}"입니다. "내가", "나" 같은 표현은 이 이름으로 처리하세요.
실제 팀원 이름 목록: ${context.teamMembers.join(", ") || "(없음)"}. 담당자류 필드는 반드시 이 목록에서 정확히 일치하는 이름만 넣고, 목록에 없거나 불확실한 이름은 추측해서 넣지 말고 빈 배열로 두세요.
자료메일발송의 recipients는 문장에 실제 이메일 주소(@ 포함)가 명시된 경우에만 채우세요. 이름만 언급되고 이메일 주소가 없으면 절대 추측하지 말고 빈 문자열로 두세요(사람 이름을 이메일 주소로 지어내는 것 절대 금지). 이 도구는 실제 발송을 하지 않고 발송 화면으로 안내만 하니, 확신이 없어도 fileNameHints·message는 최선을 다해 채우세요.
위 6개 메뉴 중 어디에도 해당하지 않거나, 제목처럼 핵심 정보가 빠져 등록할 수 없으면 ask_clarification 도구로 한 가지만 짧게 되물으세요. 억지로 다른 도구를 고르지 마세요.
모르는 값은 절대 추측하지 말고 빈 문자열/빈 배열로 두세요. enum으로 제한된 필드는 목록에 없으면 빈 문자열을 쓰세요.`,
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
          name: "create_business_project",
          description: "SI Business 메뉴에 새 사업 진행 건을 등록한다. 관공서·기관 대상 사업/영업 건일 때 사용한다.",
          input_schema: {
            type: "object",
            properties: {
              title: { type: "string", description: "사업명" },
              stage: { type: "string", enum: [...BUSINESS_STAGES], description: "진행 단계. 모르면 빈 문자열" },
              status: { type: "string", enum: [...BUSINESS_STATUSES], description: "진행 상태. 모르면 \"시작 전\"" },
              orgName: { type: "string", description: "발주기관. 모르면 빈 문자열" },
              participationType: { type: "string", description: "참여 형태. 모르면 빈 문자열" },
              workType: { type: "string", description: "사업 유형. 모르면 빈 문자열" },
              result: { type: "string", description: "결과. 모르면 빈 문자열" },
              amount: { type: "string", description: "금액(원, 숫자만). 모르면 빈 문자열" },
              progressRate: { type: "string", description: "진행률(%, 숫자만). 모르면 빈 문자열" },
              submissionDate: { type: "string", description: "제출일 YYYY-MM-DD. 모르면 빈 문자열" },
              submissionMethod: { type: "string" },
              presentationDate: { type: "string", description: "발표일 YYYY-MM-DD. 모르면 빈 문자열" },
              constructionStart: { type: "string", description: "공사 시작일 YYYY-MM-DD. 모르면 빈 문자열" },
              constructionEnd: { type: "string", description: "공사 종료일 YYYY-MM-DD. 모르면 빈 문자열" },
              constructionContent: { type: "string" },
              assignees: { type: "array", items: { type: "string" } },
              notes: { type: "string", description: "참고 사항. 모르면 빈 문자열" },
            },
            required: [
              "title",
              "stage",
              "status",
              "orgName",
              "participationType",
              "workType",
              "result",
              "amount",
              "progressRate",
              "submissionDate",
              "submissionMethod",
              "presentationDate",
              "constructionStart",
              "constructionEnd",
              "constructionContent",
              "assignees",
              "notes",
            ],
          },
        },
        {
          name: "create_cooperation_project",
          description: "Cooperation 메뉴에 새 협업 건을 등록한다. 협력사와의 협업 건일 때 사용한다.",
          input_schema: {
            type: "object",
            properties: {
              title: { type: "string", description: "협업 이름" },
              company: { type: "string", description: "업체명. 모르면 빈 문자열" },
              relationType: { type: "string", enum: [...COOPERATION_RELATION_TYPES], description: "관계 유형. 모르면 빈 문자열" },
              workType: { type: "string", enum: [...COOPERATION_WORK_TYPES], description: "업무 유형. 모르면 빈 문자열" },
              status: { type: "string", enum: [...COOPERATION_STATUSES], description: "진행 상태. 모르면 \"시작 전\"" },
              projectStartDate: { type: "string", description: "시작일 YYYY-MM-DD. 모르면 빈 문자열" },
              projectEndDate: { type: "string", description: "종료일 YYYY-MM-DD. 모르면 빈 문자열" },
              mainAssignees: { type: "array", items: { type: "string" } },
              subAssignees: { type: "array", items: { type: "string" } },
              content: { type: "string" },
            },
            required: [
              "title",
              "company",
              "relationType",
              "workType",
              "status",
              "projectStartDate",
              "projectEndDate",
              "mainAssignees",
              "subAssignees",
              "content",
            ],
          },
        },
        {
          name: "create_marketing_task",
          description: "Marketing 메뉴에 새 마케팅 업무를 등록한다. 브로슈어·홈페이지·영상 등 제작·마케팅 업무일 때 사용한다.",
          input_schema: {
            type: "object",
            properties: {
              title: { type: "string", description: "업무명" },
              content: { type: "string" },
              category: { type: "string", enum: [...MARKETING_CATEGORIES], description: "분류. 모르면 빈 문자열" },
              workType: { type: "string", enum: [...MARKETING_WORK_TYPES], description: "업무 유형. 모르면 빈 문자열" },
              stage: { type: "string", enum: [...MARKETING_STAGES], description: "진행 단계. 모르면 빈 문자열" },
              status: { type: "string", enum: [...MARKETING_STATUSES], description: "진행 상태. 모르면 \"시작 전\"" },
              dueDate: { type: "string", description: "마감일 YYYY-MM-DD. 모르면 빈 문자열" },
              dueDateEnd: { type: "string", description: "마감 종료일 YYYY-MM-DD. 모르면 빈 문자열" },
              assignees: { type: "array", items: { type: "string" } },
            },
            required: ["title", "content", "category", "workType", "stage", "status", "dueDate", "dueDateEnd", "assignees"],
          },
        },
        {
          name: "send_material_email",
          description:
            "자료메일발송 화면으로 안내한다. 실제 발송은 하지 않고, 화면에 내용을 미리 채워 사용자가 확인 후 직접 보내게 한다.",
          input_schema: {
            type: "object",
            properties: {
              recipients: {
                type: "string",
                description: "쉼표로 구분된 실제 이메일 주소만. @가 포함된 명시적 주소가 없으면 빈 문자열.",
              },
              subject: { type: "string", description: "이메일 제목" },
              message: { type: "string", description: "본문 안내 문구(정중한 존댓말로 간결하게 작성)" },
              fileNameHints: {
                type: "array",
                items: { type: "string" },
                maxItems: 8,
                description: "보낼 자료 이름에 들어갈 키워드. 확실하지 않으면 빈 배열.",
              },
            },
            required: ["recipients", "subject", "message", "fileNameHints"],
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
        title: str(input, "title"),
        dateStart: str(input, "dateStart"),
        dateEnd: str(input, "dateEnd"),
        isAllDay: Boolean(input.isAllDay),
        category: str(input, "category"),
        location: str(input, "location"),
        target: str(input, "target"),
        content: str(input, "content"),
        assignees: toStringArray(input.assignees),
        attendees: toStringArray(input.attendees),
      },
    };
  }

  if (toolUse.name === "create_memo") {
    return {
      tool: "create_memo",
      input: {
        category: pickEnum(input, "category", MEMO_CATEGORIES, "etc"),
        title: str(input, "title"),
        content: str(input, "content"),
      },
    };
  }

  if (toolUse.name === "create_business_project") {
    return {
      tool: "create_business_project",
      input: {
        title: str(input, "title"),
        stage: pickEnum(input, "stage", BUSINESS_STAGES, ""),
        status: pickEnum(input, "status", BUSINESS_STATUSES, "시작 전"),
        orgName: str(input, "orgName"),
        participationType: str(input, "participationType"),
        workType: str(input, "workType"),
        result: str(input, "result"),
        amount: str(input, "amount"),
        progressRate: str(input, "progressRate"),
        submissionDate: str(input, "submissionDate"),
        submissionMethod: str(input, "submissionMethod"),
        presentationDate: str(input, "presentationDate"),
        constructionStart: str(input, "constructionStart"),
        constructionEnd: str(input, "constructionEnd"),
        constructionContent: str(input, "constructionContent"),
        assignees: toStringArray(input.assignees),
        notes: str(input, "notes"),
      },
    };
  }

  if (toolUse.name === "create_cooperation_project") {
    return {
      tool: "create_cooperation_project",
      input: {
        title: str(input, "title"),
        company: str(input, "company"),
        relationType: pickEnum(input, "relationType", COOPERATION_RELATION_TYPES, ""),
        workType: pickEnum(input, "workType", COOPERATION_WORK_TYPES, ""),
        status: pickEnum(input, "status", COOPERATION_STATUSES, "시작 전"),
        projectStartDate: str(input, "projectStartDate"),
        projectEndDate: str(input, "projectEndDate"),
        mainAssignees: toStringArray(input.mainAssignees),
        subAssignees: toStringArray(input.subAssignees),
        content: str(input, "content"),
      },
    };
  }

  if (toolUse.name === "create_marketing_task") {
    return {
      tool: "create_marketing_task",
      input: {
        title: str(input, "title"),
        content: str(input, "content"),
        category: pickEnum(input, "category", MARKETING_CATEGORIES, ""),
        workType: pickEnum(input, "workType", MARKETING_WORK_TYPES, ""),
        stage: pickEnum(input, "stage", MARKETING_STAGES, ""),
        status: pickEnum(input, "status", MARKETING_STATUSES, "시작 전"),
        dueDate: str(input, "dueDate"),
        dueDateEnd: str(input, "dueDateEnd"),
        assignees: toStringArray(input.assignees),
      },
    };
  }

  if (toolUse.name === "send_material_email") {
    return {
      tool: "send_material_email",
      input: {
        recipients: str(input, "recipients"),
        subject: str(input, "subject"),
        message: str(input, "message"),
        fileNameHints: toStringArray(input.fileNameHints),
      },
    };
  }

  return { tool: "ask_clarification", question: str(input, "question") || "요청을 다시 말씀해 주세요." };
}
