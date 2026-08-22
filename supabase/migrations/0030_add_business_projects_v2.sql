-- ============================================================================
-- 비즈니스2 — 노션 미러링(business_projects)을 대체할, 이 시스템이 직접 소유하는
-- 사업진행 관리 테이블.
--
-- 기존 business_projects는 Notion을 파이프라인이 매일 통째로 미러링(노션에 없는
-- 행은 삭제)하는 읽기 전용 사본이라, 여기서 직접 CRUD를 얹으면 다음 동기화 때
-- 지워진다. 그래서 기존 메뉴/테이블/파이프라인은 그대로 두고, 이 테이블을 새
-- "비즈니스2" 메뉴 전용으로 완전히 분리해 처음부터 이 앱이 원본이 되도록 한다
-- (노션 연동 없음 — 사용자 확인, 2026-08-23).
--
-- 제품 카탈로그/협력사 관리(0028)와 동일하게 팀 전체가 함께 쓰는 데이터라
-- authenticated 세션이면 누구나 CRUD 가능하게 한다.
-- ============================================================================

create table if not exists public.business_projects_v2 (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  stage text,
  status text not null default '시작 전',
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
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_business_projects_v2_stage on public.business_projects_v2 (stage);
create index if not exists idx_business_projects_v2_status on public.business_projects_v2 (status);

alter table public.business_projects_v2 enable row level security;

create policy "authenticated can select business projects v2"
  on public.business_projects_v2 for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert business projects v2"
  on public.business_projects_v2 for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated can update business projects v2"
  on public.business_projects_v2 for update
  using (auth.role() = 'authenticated');

create policy "authenticated can delete business projects v2"
  on public.business_projects_v2 for delete
  using (auth.role() = 'authenticated');
