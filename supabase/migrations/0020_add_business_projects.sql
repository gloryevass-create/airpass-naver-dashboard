-- ============================================================================
-- 비즈니스 — Notion "사업진행 현황" 데이터베이스 미러링
--
-- 팀 노션(Airpass전략기획 워크스페이스)의 사업진행 현황 데이터베이스를 Notion API로
-- 읽어와 동기화한다. 원본은 계속 Notion — 이 테이블은 읽기 전용 사본이다(team_events와
-- 동일한 패턴: notion_page_id가 자연키, 매번 upsert 후 오늘 동기화에 없는 페이지는
-- 삭제해 Notion 쪽 삭제를 그대로 반영한다). 다른 모니터링 데이터와 동일하게
-- authenticated는 SELECT만, 쓰기는 service_role만.
-- ============================================================================

create table if not exists public.business_projects (
  id uuid primary key default gen_random_uuid(),
  notion_page_id text not null unique,
  title text not null,
  stage text,
  status text,
  org_name text,
  participation_type text,
  work_type text,
  result text,
  amount numeric,
  progress_rate numeric,
  submission_date timestamptz,
  submission_date_is_datetime boolean not null default false,
  submission_method text,
  presentation_date timestamptz,
  presentation_date_is_datetime boolean not null default false,
  construction_start date,
  construction_end date,
  construction_content text,
  assignees text[] not null default '{}',
  created_by text,
  notion_created_at timestamptz,
  notion_url text not null,
  synced_at timestamptz not null default now()
);

create index if not exists idx_business_projects_stage on public.business_projects (stage);
create index if not exists idx_business_projects_status on public.business_projects (status);

alter table public.business_projects enable row level security;

create policy "authenticated can select business projects"
  on public.business_projects for select
  using (auth.role() = 'authenticated');
