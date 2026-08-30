-- ============================================================================
-- 협력사 관리 업체 문서에 "제품자료"(카탈로그·브로슈어 등 참고자료) 종류를
-- 추가한다(2026-08-30). 사업자등록증/통장 사본/명함과 달리 AI가 업체
-- 정보를 자동으로 읽어 채우는 대상이 아니다 — 그냥 첨부파일로 보관만 한다
-- (lib/vendorDocumentAi.ts에서 이 타입은 추출 대상 필드가 없어 AI 호출
-- 자체를 건너뛴다).
-- ============================================================================

alter table public.vendor_documents drop constraint if exists vendor_documents_document_type_check;
alter table public.vendor_documents add constraint vendor_documents_document_type_check
  check (document_type in ('business_registration', 'bankbook', 'business_card', 'product_material'));
