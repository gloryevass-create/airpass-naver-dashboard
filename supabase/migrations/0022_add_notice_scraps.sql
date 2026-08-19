-- ============================================================================
-- 스크랩 — 조달입찰공고(budget_bids)/조달사전규격(prespec_notices) 중 사용자가 직접
-- 선택해 저장해 두는 목록. 파이프라인은 이 테이블을 전혀 건드리지 않는다(대시보드
-- 사용자가 직접 읽고 쓰는 상호작용 전용 테이블) — 다른 테이블과 달리 authenticated
-- 사용자가 자기 소유 행에 한해 INSERT/DELETE/SELECT까지 직접 할 수 있다.
-- notice_id는 budget_bids.id 또는 prespec_notices.id를 가리키지만, 두 테이블 중
-- 어느 쪽을 참조하는지 notice_type으로만 구분하고 FK는 걸지 않는다(교차 테이블 FK를
-- 피하기 위한 단순화 — 두 원본 테이블 모두 delete 없이 upsert만 하므로 고아 행 위험이
-- 사실상 없다).
-- ============================================================================

create table if not exists public.notice_scraps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  notice_type text not null check (notice_type in ('budget', 'prespec')),
  notice_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, notice_type, notice_id)
);

create index if not exists idx_notice_scraps_user on public.notice_scraps (user_id, notice_type);

alter table public.notice_scraps enable row level security;

create policy "users can select own scraps"
  on public.notice_scraps for select
  using (auth.uid() = user_id);

create policy "users can insert own scraps"
  on public.notice_scraps for insert
  with check (auth.uid() = user_id);

create policy "users can delete own scraps"
  on public.notice_scraps for delete
  using (auth.uid() = user_id);
