"use server";

import { revalidatePath } from "next/cache";
import { requireAuthedClient } from "@/lib/supabase/authed";

const PATH = "/dashboard/product-catalog";

/** note 텍스트에서 조달 채널·식별번호를 자동 판별한다(참고 저장소의 규칙을 그대로
 * 재현) — "G2B 12345678", "S2B 123..." 같은 표기를 인식한다. */
function detectProcurement(note: string) {
  const procurement = /G\s*2\s*B|S\s*2\s*B|나라장터|조달|디지털서비스몰|혁신장터/iu.test(note);
  if (!procurement) {
    return { procurement: false, channel: null, number: null, feeRate: null };
  }
  const channel = /S\s*2\s*B/iu.test(note)
    ? "S2B"
    : /디지털서비스몰/iu.test(note)
      ? "디지털서비스몰"
      : /혁신장터/iu.test(note)
        ? "혁신장터"
        : "G2B";
  const match = note.match(/(?:G\s*2\s*B|S\s*2\s*B|식별번호)[^0-9]{0,20}([0-9][0-9\s-]{4,}[0-9])/iu);
  const number = match?.[1]?.replace(/\D/g, "") ?? null;
  return { procurement: true, channel, number, feeRate: 0.0054 };
}

export type ProductCatalogFormState = { error?: string } | undefined;

export async function createProduct(
  _prevState: ProductCatalogFormState,
  formData: FormData
): Promise<ProductCatalogFormState> {
  const { supabase } = await requireAuthedClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "제품명을 입력하세요." };

  const specification = String(formData.get("specification") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim();
  const unitPriceRaw = String(formData.get("unitPrice") ?? "").trim();
  const unitPrice = unitPriceRaw ? Number(unitPriceRaw) : null;
  const supplyType = formData.get("supplyType") === "direct" ? "direct" : "partner";
  const rateRaw = String(formData.get("rate") ?? "").trim();
  const rate = rateRaw ? Number(rateRaw) / 100 : null;
  const reference = String(formData.get("reference") ?? "").trim() || null;

  const detected = detectProcurement(note);

  const { error } = await supabase.from("product_catalog").insert({
    name,
    specification,
    note: note || null,
    unit_price: unitPrice,
    supply_type: supplyType,
    commission_rate: supplyType === "partner" ? rate : null,
    margin_rate: supplyType === "direct" ? rate : null,
    reference,
    procurement: detected.procurement,
    procurement_channel: detected.channel,
    procurement_number: detected.number,
    procurement_fee_rate: detected.feeRate,
  });

  if (error) return { error: `저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}

export async function updateProduct(
  _prevState: ProductCatalogFormState,
  formData: FormData
): Promise<ProductCatalogFormState> {
  const { supabase } = await requireAuthedClient();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id) return { error: "잘못된 요청입니다." };
  if (!name) return { error: "제품명을 입력하세요." };

  const specification = String(formData.get("specification") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim();
  const unitPriceRaw = String(formData.get("unitPrice") ?? "").trim();
  const unitPrice = unitPriceRaw ? Number(unitPriceRaw) : null;
  const supplyType = formData.get("supplyType") === "direct" ? "direct" : "partner";
  const rateRaw = String(formData.get("rate") ?? "").trim();
  const rate = rateRaw ? Number(rateRaw) / 100 : null;
  const reference = String(formData.get("reference") ?? "").trim() || null;

  const detected = detectProcurement(note);

  const { error } = await supabase
    .from("product_catalog")
    .update({
      name,
      specification,
      note: note || null,
      unit_price: unitPrice,
      supply_type: supplyType,
      commission_rate: supplyType === "partner" ? rate : null,
      margin_rate: supplyType === "direct" ? rate : null,
      reference,
      procurement: detected.procurement,
      procurement_channel: detected.channel,
      procurement_number: detected.number,
      procurement_fee_rate: detected.feeRate,
      needs_review: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: `저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}

export async function deleteProduct(id: string): Promise<void> {
  const { supabase } = await requireAuthedClient();
  await supabase.from("product_catalog").delete().eq("id", id);
  revalidatePath(PATH);
}
