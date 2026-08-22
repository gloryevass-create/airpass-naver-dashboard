-- ============================================================================
-- 제품 카탈로그 ↔ 협력사 연결 — 제품 목록에서 여러 건을 선택해 협력사를 한 번에
-- 일괄 지정할 수 있도록 supplier_vendor_id를 추가한다.
-- ============================================================================

alter table public.product_catalog
  add column if not exists supplier_vendor_id uuid references public.partner_vendors (id) on delete set null;

create index if not exists idx_product_catalog_supplier_vendor on public.product_catalog (supplier_vendor_id);
