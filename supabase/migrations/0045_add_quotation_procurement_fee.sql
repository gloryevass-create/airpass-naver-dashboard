-- ============================================================================
-- 견적서 금액 요약에 "조달수수료(별도)" 항목을 추가한다(WHIZZUP 참고, 사용자
-- 확인 2026-08-27). product_catalog에 이미 있는 procurement/procurement_fee_rate
-- 를 근거로 품목별 조달수수료를 계산해 최종 합계에 더한다 — 공급가액/부가세는
-- 조달수수료를 뺀 품목금액만 기준으로 계산한다(세액 참고용, 최종 합계와는 별개).
-- ============================================================================

alter table public.quotations
  add column if not exists procurement_fee_amount numeric not null default 0;
