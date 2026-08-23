-- ============================================================================
-- 팀일정2 — 노션 미러링(team_events)을 대체할, 이 시스템이 직접 소유하는
-- 팀 일정 관리 테이블. SI Business(business_projects_v2, 0030)와 동일한 이유로
-- 완전히 분리된 새 메뉴로 만든다: 기존 team_events는 파이프라인이 매일 통째로
-- 미러링(노션에 없는 행 삭제)하는 읽기 전용 사본이라, 여기서 직접 CRUD를 얹으면
-- 다음 동기화 때 지워진다. 기존 메뉴/테이블/파이프라인은 그대로 두고 완전히
-- 새로운 "팀일정2" 메뉴 전용으로 이 테이블을 쓴다(노션 연동 없음).
--
-- 제품 카탈로그/SI Business와 동일하게 팀 전체가 함께 쓰는 데이터라 authenticated
-- 세션이면 누구나 CRUD 가능하게 한다.
-- ============================================================================

create table if not exists public.team_events_v2 (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date_start timestamptz not null,
  date_end timestamptz,
  is_datetime boolean not null default true,
  category text,
  tags text[] not null default '{}',
  target text,
  location text,
  content text,
  assignees text[] not null default '{}',
  attendees text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_team_events_v2_date_start on public.team_events_v2 (date_start);

alter table public.team_events_v2 enable row level security;

create policy "authenticated can select team events v2"
  on public.team_events_v2 for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert team events v2"
  on public.team_events_v2 for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated can update team events v2"
  on public.team_events_v2 for update
  using (auth.role() = 'authenticated');

create policy "authenticated can delete team events v2"
  on public.team_events_v2 for delete
  using (auth.role() = 'authenticated');
