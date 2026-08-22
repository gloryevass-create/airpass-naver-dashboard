-- ============================================================================
-- SI Business(business_projects_v2) 프로젝트별 히스토리 — 댓글(0031)과 UI는
-- 비슷하지만 목적이 다르다: 댓글은 팀원 의견 교환용이고, 히스토리는 프로젝트
-- 진행 변경사항을 시간순으로 남기는 보관 기록이다. 그래서 삭제 정책을 두지
-- 않는다(등록만 가능 — 기록을 임의로 지울 수 없게 해 히스토리의 신뢰성을 지킨다).
-- ============================================================================

create table if not exists public.business_projects_v2_history (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.business_projects_v2 (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_email text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_business_projects_v2_history_project
  on public.business_projects_v2_history (project_id, created_at);

alter table public.business_projects_v2_history enable row level security;

create policy "authenticated can select business project history"
  on public.business_projects_v2_history for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert business project history"
  on public.business_projects_v2_history for insert
  with check (auth.role() = 'authenticated' and author_id = auth.uid());
