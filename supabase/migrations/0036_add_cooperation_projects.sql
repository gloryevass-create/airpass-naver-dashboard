-- ============================================================================
-- 협업 — 노션 "협업" 데이터베이스(NEW 전략기획 > 협업)를 대체할, 이 시스템이
-- 직접 소유하는 협업 프로젝트 관리 테이블.
--
-- 비즈니스2(0030)/팀일정2(0035)와 동일한 패턴: 노션 연동 없이 이 앱이 원본이
-- 되도록 처음부터 별도 테이블로 만든다. 초기 데이터는 원본 노션 DB에서
-- 1회성으로 옮겨온다(사용자 확인, 2026-08-23).
--
-- 팀 전체가 함께 쓰는 데이터라 authenticated 세션이면 누구나 CRUD 가능하게
-- 한다(product_catalog/business_projects_v2/team_events_v2와 동일한 정책 형태).
-- ============================================================================

create table if not exists public.cooperation_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text,
  relation_type text,
  work_type text,
  status text not null default '시작 전',
  project_start_date timestamptz,
  project_end_date timestamptz,
  project_date_is_datetime boolean not null default false,
  main_assignees text[] not null default '{}',
  sub_assignees text[] not null default '{}',
  content text,
  ai_keywords text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cooperation_projects_relation_type on public.cooperation_projects (relation_type);
create index if not exists idx_cooperation_projects_status on public.cooperation_projects (status);

alter table public.cooperation_projects enable row level security;

create policy "authenticated can select cooperation projects"
  on public.cooperation_projects for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert cooperation projects"
  on public.cooperation_projects for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated can update cooperation projects"
  on public.cooperation_projects for update
  using (auth.role() = 'authenticated');

create policy "authenticated can delete cooperation projects"
  on public.cooperation_projects for delete
  using (auth.role() = 'authenticated');
