import "server-only";

/** 사업자등록증·통장 사본·명함 이미지/PDF에서 업체 정보를 추출한다(Claude vision).
 * 참고 저장소(WHIZZUP)가 OpenAI Responses API의 forced json_schema로 하던 것을,
 * Anthropic Messages API의 강제 tool-use(tool_choice)로 동일하게 구현했다. */

export type ExtractedVendorFields = {
  companyName: string;
  businessNumber: string;
  representativeName: string;
  businessType: string;
  businessItem: string;
  address: string;
  phone: string;
  email: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  contactName: string;
  contactTitle: string;
  contactPhone: string;
  contactEmail: string;
};

const FIELD_KEYS: (keyof ExtractedVendorFields)[] = [
  "companyName",
  "businessNumber",
  "representativeName",
  "businessType",
  "businessItem",
  "address",
  "phone",
  "email",
  "bankName",
  "accountNumber",
  "accountHolder",
  "contactName",
  "contactTitle",
  "contactPhone",
  "contactEmail",
];

const MODEL = "claude-haiku-4-5-20251001";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 32768) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
  }
  return Buffer.from(binary, "binary").toString("base64");
}

export async function extractVendorInfoFromDocument(
  bytes: Uint8Array,
  contentType: string
): Promise<Partial<ExtractedVendorFields>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");

  const data = toBase64(bytes);
  const isPdf = contentType === "application/pdf";
  const contentBlock = isPdf
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
    : { type: "image", source: { type: "base64", media_type: contentType, data } };

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
          content: [
            contentBlock,
            {
              type: "text",
              text: "사업자등록증, 통장 사본 또는 명함 문서입니다. extract_vendor_info 도구로 업체 정보를 추출하세요. 문서에 안 보이는 값은 추측하지 말고 빈 문자열로 두세요.",
            },
          ],
        },
      ],
      tools: [
        {
          name: "extract_vendor_info",
          description: "문서에서 읽은 업체 정보를 구조화해서 반환한다.",
          input_schema: {
            type: "object",
            properties: Object.fromEntries(FIELD_KEYS.map((key) => [key, { type: "string" }])),
            required: FIELD_KEYS,
          },
        },
      ],
      tool_choice: { type: "tool", name: "extract_vendor_info" },
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`문서 분석 실패 (${response.status}): ${text.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    content?: { type: string; input?: Record<string, unknown> }[];
  };
  const toolUse = payload.content?.find((block) => block.type === "tool_use");
  if (!toolUse?.input) throw new Error("문서에서 정보를 읽지 못했습니다.");

  const result: Partial<ExtractedVendorFields> = {};
  for (const key of FIELD_KEYS) {
    const value = toolUse.input[key];
    if (typeof value === "string" && value.trim()) result[key] = value.trim();
  }
  return result;
}
