-- ============================================================================
-- SI Business(business_projects_v2) 프로젝트별 댓글 — 광고전략메모(0005)의
-- ad_strategy_memo_comments와 동일한 패턴. 로그인한 팀원 누구나 프로젝트 상세에
-- 의견을 남길 수 있다.
-- ============================================================================

create table if not exists public.business_projects_v2_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.business_projects_v2 (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_email text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_business_projects_v2_comments_project
  on public.business_projects_v2_comments (project_id, created_at);

alter table public.business_projects_v2_comments enable row level security;

create policy "authenticated can select business project comments"
  on public.business_projects_v2_comments for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert own business project comments"
  on public.business_projects_v2_comments for insert
  with check (auth.role() = 'authenticated' and author_id = auth.uid());

create policy "authenticated can delete own business project comments"
  on public.business_projects_v2_comments for delete
  using (auth.role() = 'authenticated' and author_id = auth.uid());
