import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type ProductSupplyType = "partner" | "direct";

export type ProductCatalogItem = {
  id: string;
  name: string;
  specification: string | null;
  unitPrice: number | null;
  note: string | null;
  commissionRate: number | null;
  marginRate: number | null;
  supplyType: ProductSupplyType;
  reference: string | null;
  procurement: boolean;
  procurementChannel: string | null;
  procurementNumber: string | null;
  procurementFeeRate: number | null;
  needsReview: boolean;
  createdAt: string;
};

export async function getProductCatalog(supabase: Client): Promise<ProductCatalogItem[]> {
  const { data } = await supabase
    .from("product_catalog")
    .select("*")
    .order("name", { ascending: true });

  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    specification: p.specification,
    unitPrice: p.unit_price != null ? Number(p.unit_price) : null,
    note: p.note,
    commissionRate: p.commission_rate != null ? Number(p.commission_rate) : null,
    marginRate: p.margin_rate != null ? Number(p.margin_rate) : null,
    supplyType: p.supply_type,
    reference: p.reference,
    procurement: p.procurement,
    procurementChannel: p.procurement_channel,
    procurementNumber: p.procurement_number,
    procurementFeeRate: p.procurement_fee_rate != null ? Number(p.procurement_fee_rate) : null,
    needsReview: p.needs_review,
    createdAt: p.created_at,
  }));
}
