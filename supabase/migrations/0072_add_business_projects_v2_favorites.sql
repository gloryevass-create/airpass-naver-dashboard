-- ============================================================================
-- SI Business(business_projects_v2) — 즐겨찾기.
-- 제품 카탈로그(0034)와 완전히 같은 패턴: 사업 목록 자체는 팀 전체가 공유하지만
-- 즐겨찾기는 로그인한 본인 것만 켜고 끈다(사용자 확인, 2026-09-12 — Business
-- 칸반·리스트 두 화면 모두에 적용).
-- ============================================================================

create table if not exists public.business_projects_v2_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.business_projects_v2 (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, project_id)
);

alter table public.business_projects_v2_favorites enable row level security;

create policy "authenticated can select own business project favorites"
  on public.business_projects_v2_favorites for select
  using (auth.role() = 'authenticated' and user_id = auth.uid());

create policy "authenticated can insert own business project favorites"
  on public.business_projects_v2_favorites for insert
  with check (auth.role() = 'authenticated' and user_id = auth.uid());

create policy "authenticated can delete own business project favorites"
  on public.business_projects_v2_favorites for delete
  using (auth.role() = 'authenticated' and user_id = auth.uid());
