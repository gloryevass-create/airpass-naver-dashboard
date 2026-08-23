-- ============================================================================
-- 협업(cooperation_projects) 프로젝트별 댓글·히스토리 — SI Business
-- (business_projects_v2, 0031~0033)와 동일한 패턴을 그대로 따른다.
--
-- 댓글: 로그인한 팀원 누구나 남기고, 본인 댓글은 삭제 가능.
-- 히스토리: 진행 변경사항을 시간순으로 남기는 보관 기록이라 삭제 정책은 두지
-- 않는다(등록만 가능 — 기록의 신뢰성을 지킴). 다만 본인이 남긴 기록은
-- 오탈자·내용을 바로잡을 수 있도록 수정은 허용한다(updated_at으로 수정 여부 구분).
-- ============================================================================

create table if not exists public.cooperation_projects_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.cooperation_projects (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_email text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_cooperation_projects_comments_project
  on public.cooperation_projects_comments (project_id, created_at);

alter table public.cooperation_projects_comments enable row level security;

create policy "authenticated can select cooperation project comments"
  on public.cooperation_projects_comments for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert own cooperation project comments"
  on public.cooperation_projects_comments for insert
  with check (auth.role() = 'authenticated' and author_id = auth.uid());

create policy "authenticated can delete own cooperation project comments"
  on public.cooperation_projects_comments for delete
  using (auth.role() = 'authenticated' and author_id = auth.uid());

create table if not exists public.cooperation_projects_history (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.cooperation_projects (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_email text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cooperation_projects_history_project
  on public.cooperation_projects_history (project_id, created_at);

alter table public.cooperation_projects_history enable row level security;

create policy "authenticated can select cooperation project history"
  on public.cooperation_projects_history for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert cooperation project history"
  on public.cooperation_projects_history for insert
  with check (auth.role() = 'authenticated' and author_id = auth.uid());

create policy "authenticated can update own cooperation project history"
  on public.cooperation_projects_history for update
  using (auth.role() = 'authenticated' and author_id = auth.uid());
