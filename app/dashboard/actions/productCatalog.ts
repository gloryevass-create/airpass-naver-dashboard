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

export type BulkImportRow = {
  name: string;
  specification: string;
  unitPrice: number | null;
  note: string;
  supplyType: "partner" | "direct" | null;
  commissionRate: number | null;
  marginRate: number | null;
  reference: string;
};

/** 엑셀로 가져온(검증까지 끝난, errors가 없는) 행들을 한 번에 추가한다. */
export async function bulkImportProducts(rows: BulkImportRow[]): Promise<{ added: number; error?: string }> {
  if (rows.length === 0) return { added: 0 };
  const { supabase } = await requireAuthedClient();

  const inserts = rows.map((row) => {
    const detected = detectProcurement(row.note);
    const supplyType = row.supplyType ?? "partner";
    return {
      name: row.name,
      specification: row.specification || null,
      note: row.note || null,
      unit_price: row.unitPrice,
      supply_type: supplyType,
      commission_rate: supplyType === "partner" ? row.commissionRate : null,
      margin_rate: supplyType === "direct" ? row.marginRate : null,
      reference: row.reference || null,
      procurement: detected.procurement,
      procurement_channel: detected.channel,
      procurement_number: detected.number,
      procurement_fee_rate: detected.feeRate,
    };
  });

  const { error } = await supabase.from("product_catalog").insert(inserts);
  if (error) return { added: 0, error: `가져오기 실패: ${error.message}` };

  revalidatePath(PATH);
  return { added: inserts.length };
}

/** 여러 제품을 선택해 협력사를 한 번에 지정(또는 해제)한다. */
export async function bulkAssignVendor(productIds: string[], vendorId: string | null): Promise<void> {
  if (productIds.length === 0) return;
  const { supabase } = await requireAuthedClient();

  await supabase
    .from("product_catalog")
    .update({ supplier_vendor_id: vendorId, updated_at: new Date().toISOString() })
    .in("id", productIds);

  revalidatePath(PATH);
}

/** 즐겨찾기는 팀 공유가 아니라 로그인한 본인 것만 켜고 끈다. */
export async function toggleProductFavorite(productId: string): Promise<void> {
  const { supabase, user } = await requireAuthedClient();

  const { data: existing } = await supabase
    .from("product_catalog_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase.from("product_catalog_favorites").delete().eq("id", existing.id);
  } else {
    await supabase.from("product_catalog_favorites").insert({ user_id: user.id, product_id: productId });
  }

  revalidatePath(PATH);
}

/** 화살표로 한 칸 위/아래로 옮긴다 — 본인이 아직 순서를 저장한 적 없으면(product_catalog_user_order
 * 행이 없으면) 현재 이름순 전체 목록을 기준으로 처음 저장한다. */
export async function moveProductInUserOrder(productId: string, direction: "up" | "down"): Promise<void> {
  const { supabase, user } = await requireAuthedClient();

  const [{ data: allProducts }, { data: userOrderRow }] = await Promise.all([
    supabase.from("product_catalog").select("id").order("name", { ascending: true }),
    supabase.from("product_catalog_user_order").select("product_ids").eq("user_id", user.id).maybeSingle(),
  ]);

  const allIds = (allProducts ?? []).map((p) => p.id);
  const savedOrder = userOrderRow?.product_ids ?? [];

  // 저장된 순서 + 아직 순서에 없는(신규) 제품을 이름순으로 이어붙여 "현재 화면에 보이는 순서"를 재현한다.
  const savedSet = new Set(savedOrder);
  const effectiveOrder = [...savedOrder.filter((id) => allIds.includes(id)), ...allIds.filter((id) => !savedSet.has(id))];

  const index = effectiveOrder.indexOf(productId);
  if (index === -1) return;
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= effectiveOrder.length) return;

  const newOrder = [...effectiveOrder];
  [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];

  await supabase
    .from("product_catalog_user_order")
    .upsert({ user_id: user.id, product_ids: newOrder, updated_at: new Date().toISOString() });

  revalidatePath(PATH);
}
