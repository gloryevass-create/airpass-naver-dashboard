-- ============================================================================
-- 자료메일발송 개인별 SMTP 계정(2026-09-13) — 사용자가 회원정보 수정 화면에서
-- 본인 회사 메일 계정(사용자명/비밀번호)을 등록해두면 자료메일발송이 그
-- 계정으로 보내고, 등록 안 해뒀으면 지금처럼 공용 계정(MATERIAL_EMAIL_SMTP_*
-- env)으로 보낸다. 호스트/포트는 계속 공용 값을 그대로 쓴다(같은 회사 메일
-- 서버, 로그인만 개인별 — 사용자 확인).
--
-- google_calendar_connections(0050)와 같은 이유로 admin(service_role)
-- 클라이언트를 거치지 않고 RLS로 본인 행 CRUD를 바로 허용한다 — profiles.role과
-- 달리 이 테이블은 자기 행을 자기가 마음대로 바꿔도 권한상승 위험이 없다
-- (연결/해제/재연결 전부 본인 것만 건드림).
--
-- 비밀번호는 평문 저장 — 기존 MATERIAL_EMAIL_SMTP_PASSWORD(env)와
-- google_calendar_connections.refresh_token(테이블) 둘 다 평문 저장 전례가
-- 있고, self-row RLS라 본인과 서버 코드(세션 클라이언트로 본인 행만 조회) 외
-- 에는 다른 일반 사용자도 admin도 조회할 수 없다.
-- ============================================================================

create table if not exists public.material_email_smtp_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  smtp_user text not null,
  smtp_password text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.material_email_smtp_accounts enable row level security;

create policy "select own material email smtp account"
  on public.material_email_smtp_accounts for select
  using (user_id = auth.uid());

create policy "insert own material email smtp account"
  on public.material_email_smtp_accounts for insert
  with check (user_id = auth.uid());

create policy "update own material email smtp account"
  on public.material_email_smtp_accounts for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "delete own material email smtp account"
  on public.material_email_smtp_accounts for delete
  using (user_id = auth.uid());
