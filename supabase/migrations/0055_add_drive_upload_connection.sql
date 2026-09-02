-- ============================================================================
-- 첨부파일(Work Journal/Memo Board/제조사 관리) 구글드라이브 업로드용 "회사 공용"
-- OAuth 연결(2026-09-03). 0054에서 서비스 계정으로 시도했으나 서비스 계정은
-- storageQuotaExceeded로 파일 생성(쓰기) 자체가 막혀 있어(구글 정책 — 서비스
-- 계정은 자체 저장용량이 없다) 실제 사람 계정(airpass.ai@gmail.com)의 OAuth
-- 인증으로 전환한다 — 업로드 용량은 그 계정의 개인 구글 드라이브 용량을 쓴다.
--
-- google_calendar_connections(사용자 1명당 1행)와 달리 이건 회사 전체가
-- 공유하는 연결 하나뿐이라 싱글턴 테이블로 만든다(id는 항상 true인 boolean PK로
-- 강제 — 두 번째 행을 못 넣게 막는 흔한 패턴). RLS를 켜고 정책을 하나도 안 둬서
-- anon/authenticated 키로는 select/insert 자체가 전부 막힌다 — refresh_token이
-- 담긴 시스템 자격증명이라 service_role(관리자 클라이언트)로만 접근해야 한다.
-- ============================================================================

create table if not exists public.google_drive_upload_connection (
  id boolean primary key default true,
  google_email text not null,
  refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,
  connected_by uuid references auth.users (id) on delete set null,
  connected_at timestamptz not null default now(),
  constraint google_drive_upload_connection_singleton check (id)
);

alter table public.google_drive_upload_connection enable row level security;
