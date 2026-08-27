-- ============================================================================
-- 자료메일발송에 산출내역(견적) 첨부 기능을 추가하면서, 어떤 산출내역을 보냈는지
-- 이력에 남긴다(사용자 확인, 2026-08-28). quotations가 삭제돼도 발송 이력 자체는
-- 남아야 하므로 on delete set null — quote_number는 조인 없이 목록에 바로
-- 보여주려고 file_names/file_links와 같은 방식으로 함께 저장한다.
-- ============================================================================

alter table public.material_email_logs
  add column if not exists quotation_id uuid references public.quotations(id) on delete set null,
  add column if not exists quotation_quote_number text;
