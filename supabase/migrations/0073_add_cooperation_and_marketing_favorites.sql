-- ============================================================================
-- Cooperation(cooperation_projects) / Marketing(marketing_tasks) — 즐겨찾기.
-- SI Business(0072)와 완전히 같은 패턴 — 목록 자체는 팀 전체가 공유하지만
-- 즐겨찾기는 로그인한 본인 것만 켜고 끈다(사용자 확인, 2026-09-12 — Business
-- 칸반·리스트에 이어 Cooperation·Marketing에도 동일하게 적용).
-- ============================================================================

create table if not exists public.cooperation_projects_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.cooperation_projects (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, project_id)
);

alter table public.cooperation_projects_favorites enable row level security;

create policy "authenticated can select own cooperation project favorites"
  on public.cooperation_projects_favorites for select
  using (auth.role() = 'authenticated' and user_id = auth.uid());

create policy "authenticated can insert own cooperation project favorites"
  on public.cooperation_projects_favorites for insert
  with check (auth.role() = 'authenticated' and user_id = auth.uid());

create policy "authenticated can delete own cooperation project favorites"
  on public.cooperation_projects_favorites for delete
  using (auth.role() = 'authenticated' and user_id = auth.uid());

create table if not exists public.marketing_tasks_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id uuid not null references public.marketing_tasks (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, task_id)
);

alter table public.marketing_tasks_favorites enable row level security;

create policy "authenticated can select own marketing task favorites"
  on public.marketing_tasks_favorites for select
  using (auth.role() = 'authenticated' and user_id = auth.uid());

create policy "authenticated can insert own marketing task favorites"
  on public.marketing_tasks_favorites for insert
  with check (auth.role() = 'authenticated' and user_id = auth.uid());

create policy "authenticated can delete own marketing task favorites"
  on public.marketing_tasks_favorites for delete
  using (auth.role() = 'authenticated' and user_id = auth.uid());
