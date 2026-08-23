-- ============================================================================
-- 마케팅업무 — 노션 "마케팅" 데이터베이스(NEW 전략기획 > 마케팅)를 대체할, 이
-- 시스템이 직접 소유하는 마케팅 업무 관리 테이블.
--
-- 협업(0036~0037)과 동일한 패턴: 노션 연동 없이 이 앱이 원본이 되도록 처음부터
-- 별도 테이블로 만든다. 초기 데이터는 원본 노션 DB에서 1회성으로 옮겨온다
-- (사용자 확인, 2026-08-23). 댓글·히스토리도 협업과 동일하게 처음부터 포함한다.
--
-- 팀 전체가 함께 쓰는 데이터라 authenticated 세션이면 누구나 CRUD 가능하게
-- 한다(product_catalog/business_projects_v2/cooperation_projects와 동일한 정책 형태).
-- ============================================================================

create table if not exists public.marketing_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  category text,
  work_type text,
  stage text,
  status text not null default '시작 전',
  due_date timestamptz,
  due_date_end timestamptz,
  due_date_is_datetime boolean not null default false,
  assignees text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_marketing_tasks_category on public.marketing_tasks (category);
create index if not exists idx_marketing_tasks_status on public.marketing_tasks (status);

alter table public.marketing_tasks enable row level security;

create policy "authenticated can select marketing tasks"
  on public.marketing_tasks for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert marketing tasks"
  on public.marketing_tasks for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated can update marketing tasks"
  on public.marketing_tasks for update
  using (auth.role() = 'authenticated');

create policy "authenticated can delete marketing tasks"
  on public.marketing_tasks for delete
  using (auth.role() = 'authenticated');

create table if not exists public.marketing_tasks_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.marketing_tasks (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_email text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_marketing_tasks_comments_task
  on public.marketing_tasks_comments (task_id, created_at);

alter table public.marketing_tasks_comments enable row level security;

create policy "authenticated can select marketing task comments"
  on public.marketing_tasks_comments for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert own marketing task comments"
  on public.marketing_tasks_comments for insert
  with check (auth.role() = 'authenticated' and author_id = auth.uid());

create policy "authenticated can delete own marketing task comments"
  on public.marketing_tasks_comments for delete
  using (auth.role() = 'authenticated' and author_id = auth.uid());

create table if not exists public.marketing_tasks_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.marketing_tasks (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_email text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_marketing_tasks_history_task
  on public.marketing_tasks_history (task_id, created_at);

alter table public.marketing_tasks_history enable row level security;

create policy "authenticated can select marketing task history"
  on public.marketing_tasks_history for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert marketing task history"
  on public.marketing_tasks_history for insert
  with check (auth.role() = 'authenticated' and author_id = auth.uid());

create policy "authenticated can update own marketing task history"
  on public.marketing_tasks_history for update
  using (auth.role() = 'authenticated' and author_id = auth.uid());
