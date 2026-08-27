"use server";

import { revalidatePath } from "next/cache";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { formatMember } from "@/lib/formatMember";
import { generateQuoteNumber, type QuotationItem } from "@/lib/queries/quotations";

const PATH = "/dashboard/quotations";

export type QuotationFormState = { error?: string } | undefined;

function text(formData: FormData, key: string): string | null {
  return String(formData.get(key) ?? "").trim() || null;
}

function numberOrZero(formData: FormData, key: string): number {
  const raw = String(formData.get(key) ?? "").trim();
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function parseItems(formData: FormData): { items: QuotationItem[]; error?: string } {
  const raw = String(formData.get("itemsJson") ?? "[]");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { items: [], error: "품목 데이터를 읽지 못했습니다." };
  }
  if (!Array.isArray(parsed)) return { items: [], error: "품목 데이터 형식이 올바르지 않습니다." };

  // 금액은 클라이언트가 계산한 값을 그대로 믿지 않고 서버에서 다시 계산한다.
  const items: QuotationItem[] = parsed.map((raw) => {
    const row = (raw ?? {}) as Record<string, unknown>;
    const quantity = Math.max(0, Number(row.quantity) || 0);
    const unitPrice = Math.max(0, Number(row.unitPrice) || 0);
    return {
      productId: typeof row.productId === "string" && row.productId ? row.productId : null,
      name: String(row.name ?? "").trim(),
      specification: String(row.specification ?? "").trim(),
      unit: String(row.unit ?? "").trim(),
      quantity,
      unitPrice,
      amount: Math.round(quantity * unitPrice),
    };
  }).filter((item) => item.name);

  return { items };
}

function computeTotals(items: QuotationItem[], discountAmount: number, extraAmount: number) {
  const subtotalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const supplyAmount = Math.max(0, subtotalAmount - discountAmount + extraAmount);
  const taxAmount = Math.round(supplyAmount * 0.1);
  const totalAmount = supplyAmount + taxAmount;
  return {
    subtotal_amount: subtotalAmount,
    supply_amount: supplyAmount,
    tax_amount: taxAmount,
    total_amount: totalAmount,
  };
}

export async function createQuotation(
  _prevState: QuotationFormState,
  formData: FormData
): Promise<QuotationFormState> {
  const { supabase, user } = await requireAuthedClient();

  const customerName = text(formData, "customerName");
  if (!customerName) return { error: "고객사/발주기관명을 입력하세요." };
  const quoteDate = text(formData, "quoteDate") ?? new Date().toISOString().slice(0, 10);

  const { items, error: itemsError } = parseItems(formData);
  if (itemsError) return { error: itemsError };
  if (items.length === 0) return { error: "품목을 하나 이상 추가하세요." };

  const discountAmount = numberOrZero(formData, "discountAmount");
  const extraAmount = numberOrZero(formData, "extraAmount");
  const totals = computeTotals(items, discountAmount, extraAmount);

  const quoteNumber = await generateQuoteNumber(supabase, quoteDate);

  const { data: profile } = await supabase.from("profiles").select("name, email").eq("id", user.id).single();
  const actor = formatMember(profile?.name ?? null, null, profile?.email ?? user.email ?? "");

  const { data: quotation, error } = await supabase
    .from("quotations")
    .insert({
      quote_number: quoteNumber,
      customer_name: customerName,
      project_title: text(formData, "projectTitle"),
      quote_date: quoteDate,
      valid_until: text(formData, "validUntil"),
      manager_name: text(formData, "managerName"),
      items,
      discount_amount: discountAmount,
      extra_amount: extraAmount,
      ...totals,
      memo: text(formData, "memo"),
      include_stamp: formData.get("includeStamp") === "on",
      created_by: user.id,
      created_by_name: actor,
    })
    .select("id")
    .single();

  if (error || !quotation) return { error: `저장 실패: ${error?.message ?? "알 수 없는 오류"}` };

  await supabase.from("notifications").insert({
    type: "quotation",
    title: `${quoteNumber} (${customerName})`,
    message: `${actor}님이 새 견적서를 작성했습니다.`,
    link: PATH,
  });

  revalidatePath(PATH);
  return undefined;
}

export async function updateQuotation(
  _prevState: QuotationFormState,
  formData: FormData
): Promise<QuotationFormState> {
  const { supabase } = await requireAuthedClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "잘못된 요청입니다." };

  const customerName = text(formData, "customerName");
  if (!customerName) return { error: "고객사/발주기관명을 입력하세요." };
  const quoteDate = text(formData, "quoteDate") ?? new Date().toISOString().slice(0, 10);

  const { items, error: itemsError } = parseItems(formData);
  if (itemsError) return { error: itemsError };
  if (items.length === 0) return { error: "품목을 하나 이상 추가하세요." };

  const discountAmount = numberOrZero(formData, "discountAmount");
  const extraAmount = numberOrZero(formData, "extraAmount");
  const totals = computeTotals(items, discountAmount, extraAmount);

  const { error } = await supabase
    .from("quotations")
    .update({
      customer_name: customerName,
      project_title: text(formData, "projectTitle"),
      quote_date: quoteDate,
      valid_until: text(formData, "validUntil"),
      manager_name: text(formData, "managerName"),
      items,
      discount_amount: discountAmount,
      extra_amount: extraAmount,
      ...totals,
      memo: text(formData, "memo"),
      include_stamp: formData.get("includeStamp") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: `저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}

export async function deleteQuotation(id: string): Promise<void> {
  const { supabase } = await requireAuthedClient();
  await supabase.from("quotations").delete().eq("id", id);
  revalidatePath(PATH);
}
