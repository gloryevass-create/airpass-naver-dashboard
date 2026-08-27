-- ============================================================================
-- 견적서 관리 — WHIZZUP 레퍼런스 사이트의 견적서 기능을 참고하되, 리비전 이력·
-- 정산조정·컨소시엄·내부원가/마진 추적·조달채널·구글드라이브 동기화 등
-- WHIZZUP 고유 영업 프로세스는 전부 제외하고 핵심(품목·금액 자동계산·인쇄용
-- 출력)만 옮긴다(사용자 확인, 2026-08-27).
--
-- 품목은 항상 견적서 하나와 통째로 함께 편집되는 종속 데이터라 별도 테이블 대신
-- items jsonb 배열로 저장한다(WHIZZUP의 items_json과 동일한 접근).
-- 다른 메뉴(SI Business 등)와 동일하게 팀 전체가 함께 쓰는 데이터라 authenticated
-- 세션이면 누구나 CRUD 가능하게 한다.
-- ============================================================================

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique,
  customer_name text not null,
  project_title text,
  quote_date date not null default current_date,
  valid_until date,
  manager_name text,
  items jsonb not null default '[]'::jsonb,
  discount_amount numeric not null default 0,
  extra_amount numeric not null default 0,
  subtotal_amount numeric not null default 0,
  supply_amount numeric not null default 0,
  tax_amount numeric not null default 0,
  total_amount numeric not null default 0,
  memo text,
  include_stamp boolean not null default false,
  created_by uuid references auth.users(id),
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_quotations_updated_at on public.quotations (updated_at desc);

alter table public.quotations enable row level security;

create policy "authenticated can select quotations"
  on public.quotations for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert quotations"
  on public.quotations for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated can update quotations"
  on public.quotations for update
  using (auth.role() = 'authenticated');

create policy "authenticated can delete quotations"
  on public.quotations for delete
  using (auth.role() = 'authenticated');

alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check check (
    type in (
      'event', 'business', 'youtube', 'budget_low', 'memo', 'budget_scrap', 'prespec_scrap',
      'news_scrap', 'cooperation', 'marketing', 'quotation'
    )
  );
