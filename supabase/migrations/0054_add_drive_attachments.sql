-- ============================================================================
-- 첨부파일 저장소를 Supabase Storage에서 회사 공용 구글드라이브(서비스 계정)로
-- 전환한다(2026-09-02, 사용자 확인 — Supabase 스토리지 용량 초과 대응).
-- 자료메일발송이 이미 쓰는 서비스 계정(GOOGLE_SERVICE_ACCOUNT_EMAIL/PRIVATE_KEY)을
-- 재사용하고, 별도 루트 폴더(GOOGLE_DRIVE_ATTACHMENTS_ROOT_FOLDER_ID) 아래
-- 서비스별 하위 폴더(Work Journal/Memo Board/제조사 관리)에 저장한다.
--
-- 기존 storage_path(Supabase Storage 경로)는 과거 파일 조회용으로 그대로
-- 남겨두고 NOT NULL만 해제한다 — 이미 올라간 파일은 안 건드리고, 새로
-- 올리는 파일부터만 drive_file_id를 쓴다. 두 컬럼 중 하나만 채워진다.
-- ============================================================================

alter table public.vendor_documents alter column storage_path drop not null;
alter table public.vendor_documents add column if not exists drive_file_id text;

alter table public.work_journal_attachments alter column storage_path drop not null;
alter table public.work_journal_attachments add column if not exists drive_file_id text;

alter table public.ad_strategy_memo_attachments alter column storage_path drop not null;
alter table public.ad_strategy_memo_attachments add column if not exists drive_file_id text;
