-- ============================================================================
-- 제품 카탈로그 — 즐겨찾기·개인별 순서 변경 (참고 저장소 WHIZZUP 스타일).
-- 처음 제품 카탈로그를 만들 때는 "우리 프로젝트에 대응 개념이 없는 부가 기능"이라
-- 제외했으나(0028 주석 참고), 이후 사용자가 이번엔 포함해서 구현해 달라고 요청
-- (사용자 확인, 2026-08-24). 팀 전체가 보는 제품 목록 자체는 그대로 공유하되,
-- 즐겨찾기·순서는 사용자마다 다르게 보여야 하므로 로그인한 본인 것만 접근 가능하게 한다.
-- ============================================================================

create table if not exists public.product_catalog_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.product_catalog (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.product_catalog_favorites enable row level security;

create policy "authenticated can select own product favorites"
  on public.product_catalog_favorites for select
  using (auth.role() = 'authenticated' and user_id = auth.uid());

create policy "authenticated can insert own product favorites"
  on public.product_catalog_favorites for insert
  with check (auth.role() = 'authenticated' and user_id = auth.uid());

create policy "authenticated can delete own product favorites"
  on public.product_catalog_favorites for delete
  using (auth.role() = 'authenticated' and user_id = auth.uid());

-- 사용자별 전체 정렬 순서를 제품 ID 배열 하나로 저장한다(행별 sort_order 컬럼 대신) —
-- 위/아래 화살표로 한 칸 옮길 때마다 배열 전체를 다시 저장하는 방식이 스키마가 가장 단순하다.
create table if not exists public.product_catalog_user_order (
  user_id uuid primary key references auth.users (id) on delete cascade,
  product_ids uuid[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.product_catalog_user_order enable row level security;

create policy "authenticated can select own product order"
  on public.product_catalog_user_order for select
  using (auth.role() = 'authenticated' and user_id = auth.uid());

create policy "authenticated can insert own product order"
  on public.product_catalog_user_order for insert
  with check (auth.role() = 'authenticated' and user_id = auth.uid());

create policy "authenticated can update own product order"
  on public.product_catalog_user_order for update
  using (auth.role() = 'authenticated' and user_id = auth.uid());
