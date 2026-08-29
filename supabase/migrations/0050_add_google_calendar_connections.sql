-- ============================================================================
-- 개인 구글 캘린더 연동(2026-08-29) — 로그인한 사용자가 자기 구글 캘린더를
-- 연결하면, 그 사람이 로그인했을 때만 자기 구글 일정을 캘린더 화면에서 볼 수
-- 있다. 한 사용자당 연결 하나(user_id가 PK) — refresh_token으로 필요할 때마다
-- access_token을 새로 받고, 마지막으로 받은 access_token은 캐시해서 매번 새로
-- 받지 않게 한다.
--
-- profiles.role과 달리 여기는 자기 행을 자기가 마음대로 못 바꿔서 생기는
-- 권한상승 같은 문제가 없다(연결/해제/재연결 전부 본인 것만 건드림) — 그래서
-- profiles처럼 admin 클라이언트를 거치지 않고 RLS로 본인 행 CRUD를 바로 허용한다.
-- ============================================================================

create table if not exists public.google_calendar_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  google_email text not null,
  refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,
  connected_at timestamptz not null default now()
);

alter table public.google_calendar_connections enable row level security;

create policy "select own google calendar connection"
  on public.google_calendar_connections for select
  using (user_id = auth.uid());

create policy "insert own google calendar connection"
  on public.google_calendar_connections for insert
  with check (user_id = auth.uid());

create policy "update own google calendar connection"
  on public.google_calendar_connections for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "delete own google calendar connection"
  on public.google_calendar_connections for delete
  using (user_id = auth.uid());
