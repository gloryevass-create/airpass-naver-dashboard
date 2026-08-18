-- ============================================================================
-- 팀 일정 캘린더 — Notion "행사 및 스케쥴" 데이터베이스 미러링
--
-- 팀 노션(Airpass전략기획 워크스페이스)의 행사 및 스케쥴 데이터베이스를 Notion API로
-- 읽어와 동기화한다. 원본은 계속 Notion — 이 테이블은 읽기 전용 사본이다(다른
-- 모니터링 데이터와 동일하게 authenticated는 SELECT만, 쓰기는 service_role만).
-- ============================================================================

create table if not exists public.team_events (
  id uuid primary key default gen_random_uuid(),
  notion_page_id text not null unique,
  title text not null,
  date_start timestamptz not null,
  date_end timestamptz,
  is_datetime boolean not null default false,
  category text,
  tags text[] not null default '{}',
  target text,
  location text,
  content text,
  assignees text[] not null default '{}',
  attendees text[] not null default '{}',
  notion_url text not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_team_events_date_start on public.team_events (date_start);

alter table public.team_events enable row level security;

create policy "authenticated can select team events"
  on public.team_events for select
  using (auth.role() = 'authenticated');
