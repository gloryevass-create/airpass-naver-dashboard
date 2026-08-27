import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type QuotationItem = {
  // 화면에서 드래그로 순서를 바꿀 때 "같은 품목이 자리를 옮겼다"를 구분하기 위한
  // 클라이언트 전용 id — DB에서 온 값이 없으면(예전 데이터) 불러올 때 하나 붙여준다.
  id: string;
  productId: string | null;
  name: string;
  specification: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  note: string;
};

export type Quotation = {
  id: string;
  quoteNumber: string;
  customerName: string;
  projectTitle: string | null;
  businessProjectId: string | null;
  businessProjectTitle: string | null;
  quoteDate: string;
  validUntil: string | null;
  managerName: string | null;
  items: QuotationItem[];
  discountAmount: number;
  extraAmount: number;
  subtotalAmount: number;
  supplyAmount: number;
  taxAmount: number;
  procurementFeeAmount: number;
  totalAmount: number;
  memo: string | null;
  includeStamp: boolean;
  executionType: "직영" | "컨소" | "해당없음";
  consortiumCompany: string | null;
  consortiumRate: number;
  extraInternalCost: number;
  status: "draft" | "final";
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
};

function toItems(raw: unknown): QuotationItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r, i) => {
    const row = (r ?? {}) as Record<string, unknown>;
    return {
      id: typeof row.id === "string" && row.id ? row.id : `legacy-${i}`,
      productId: typeof row.productId === "string" ? row.productId : null,
      name: String(row.name ?? ""),
      specification: String(row.specification ?? ""),
      unit: String(row.unit ?? ""),
      quantity: Number(row.quantity ?? 0),
      unitPrice: Number(row.unitPrice ?? 0),
      amount: Number(row.amount ?? 0),
      note: String(row.note ?? ""),
    };
  });
}

function toQuotation(
  row: Database["public"]["Tables"]["quotations"]["Row"],
  businessProjectTitleById: Map<string, string>
): Quotation {
  return {
    id: row.id,
    quoteNumber: row.quote_number,
    customerName: row.customer_name,
    projectTitle: row.project_title,
    businessProjectId: row.business_project_id,
    businessProjectTitle: row.business_project_id
      ? (businessProjectTitleById.get(row.business_project_id) ?? null)
      : null,
    quoteDate: row.quote_date,
    validUntil: row.valid_until,
    managerName: row.manager_name,
    items: toItems(row.items),
    discountAmount: Number(row.discount_amount),
    extraAmount: Number(row.extra_amount),
    subtotalAmount: Number(row.subtotal_amount),
    supplyAmount: Number(row.supply_amount),
    taxAmount: Number(row.tax_amount),
    procurementFeeAmount: Number(row.procurement_fee_amount),
    totalAmount: Number(row.total_amount),
    memo: row.memo,
    includeStamp: row.include_stamp,
    executionType: row.execution_type,
    consortiumCompany: row.consortium_company,
    consortiumRate: Number(row.consortium_rate),
    extraInternalCost: Number(row.extra_internal_cost),
    status: row.status,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// PostgREST 임베디드 조인 대신 business_projects_v2를 별도 조회해 Map으로
// JS 레벨 조인한다(이 프로젝트의 기존 컨벤션 — lib/queries/dashboard.ts 참고).
async function fetchBusinessProjectTitleById(supabase: Client): Promise<Map<string, string>> {
  const { data } = await supabase.from("business_projects_v2").select("id, title");
  return new Map((data ?? []).map((p) => [p.id, p.title]));
}

export async function getQuotations(supabase: Client): Promise<Quotation[]> {
  const [{ data }, businessProjectTitleById] = await Promise.all([
    supabase.from("quotations").select("*").order("updated_at", { ascending: false }),
    fetchBusinessProjectTitleById(supabase),
  ]);
  return (data ?? []).map((row) => toQuotation(row, businessProjectTitleById));
}

export async function getQuotation(supabase: Client, id: string): Promise<Quotation | null> {
  const [{ data }, businessProjectTitleById] = await Promise.all([
    supabase.from("quotations").select("*").eq("id", id).maybeSingle(),
    fetchBusinessProjectTitleById(supabase),
  ]);
  return data ? toQuotation(data, businessProjectTitleById) : null;
}

/** 산출내역 작성 화면의 "연결 사업" 검색에 쓰는 최소 필드 — 전체 사업 정보(댓글·
 * 히스토리 포함)를 불러오는 getBusinessProjectsV2보다 가볍다. */
export async function getBusinessProjectOptions(
  supabase: Client
): Promise<{ id: string; title: string }[]> {
  const { data } = await supabase
    .from("business_projects_v2")
    .select("id, title")
    .order("updated_at", { ascending: false });
  return data ?? [];
}

/** "Q-YYYYMMDD-001" 형식 — 같은 날짜에 발급된 개수 기준으로 순번을 매긴다.
 * 동시에 여러 명이 같은 날 마지막 순번에 등록하면 충돌할 수 있으나(unique 제약),
 * 팀 규모상 실무에서 부딪힐 가능성은 낮고 부딪히면 다시 저장하면 된다. */
export async function generateQuoteNumber(supabase: Client, quoteDate: string): Promise<string> {
  const dateStr = quoteDate.replace(/-/g, "");
  const { count } = await supabase
    .from("quotations")
    .select("id", { count: "exact", head: true })
    .eq("quote_date", quoteDate);
  const seq = (count ?? 0) + 1;
  return `Q-${dateStr}-${String(seq).padStart(3, "0")}`;
}
