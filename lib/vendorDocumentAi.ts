import "server-only";
import type { VendorDocumentType } from "@/lib/queries/vendors";

/** 사업자등록증·통장 사본·명함 이미지/PDF에서 업체 정보를 추출한다(Claude vision).
 * 참고 저장소(WHIZZUP)가 OpenAI Responses API의 forced json_schema로 하던 것을,
 * Anthropic Messages API의 강제 tool-use(tool_choice)로 동일하게 구현했다.
 *
 * 문서 종류별로 관련 없는 필드는 도구 스키마 자체에서 제외한다 — 세 문서 종류가 모두 같은
 * 필드 세트를 받으면 모델이 통장 사본을 보고도 업체명·주소 같은 사업자 정보 필드를 억지로
 * 채워 넣어 다른 문서에서 읽은 값을 덮어써 버리는 문제가 있었다. */

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

const FIELDS_BY_DOCUMENT_TYPE: Record<VendorDocumentType, (keyof ExtractedVendorFields)[]> = {
  business_registration: [
    "companyName",
    "businessNumber",
    "representativeName",
    "businessType",
    "businessItem",
    "address",
    "phone",
    "email",
  ],
  bankbook: ["bankName", "accountNumber", "accountHolder"],
  business_card: ["contactName", "contactTitle", "contactPhone", "contactEmail"],
  // 제품자료(카탈로그·브로슈어 등)는 업체 정보 추출 대상이 아니다 — 첨부만
  // 한다(app/dashboard/actions/vendors.ts에서 이 타입은 AI 호출 자체를 건너뜀).
  product_material: [],
};

const DOCUMENT_LABELS: Record<VendorDocumentType, string> = {
  business_registration: "사업자등록증",
  bankbook: "통장 사본(은행 계좌)",
  business_card: "명함",
  product_material: "제품자료",
};

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
  contentType: string,
  documentType: VendorDocumentType
): Promise<Partial<ExtractedVendorFields>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");

  const fieldKeys = FIELDS_BY_DOCUMENT_TYPE[documentType];
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
              text: `${DOCUMENT_LABELS[documentType]} 문서입니다. extract_vendor_info 도구로 이 문서에서 확인되는 정보만 추출하세요. 문서에 안 보이는 값은 추측하지 말고 빈 문자열로 두세요.`,
            },
          ],
        },
      ],
      tools: [
        {
          name: "extract_vendor_info",
          description: `${DOCUMENT_LABELS[documentType]} 문서에서 읽은 정보를 구조화해서 반환한다.`,
          input_schema: {
            type: "object",
            properties: Object.fromEntries(fieldKeys.map((key) => [key, { type: "string" }])),
            required: fieldKeys,
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
  for (const key of fieldKeys) {
    const value = toolUse.input[key];
    if (typeof value === "string" && value.trim()) result[key] = value.trim();
  }
  return result;
}
