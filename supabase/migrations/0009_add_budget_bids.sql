-- ============================================================================
-- 교육청 예산·사업 모니터링 — 나라장터 입찰공고
--
-- 조달청 나라장터 입찰공고정보서비스(공식, data.go.kr)에서 사업명·예산금액·발주기관을
-- 수집한다. 다른 모니터링 데이터와 동일하게 읽기 전용(authenticated는 SELECT만,
-- 쓰기는 service_role만). (bid_no, bid_ord) 조합이 공고 단위 고유키다(재공고 시
-- bid_ord가 올라간다).
-- ============================================================================

create table if not exists public.budget_bids (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  business_type text not null check (business_type in ('cnstwk', 'servc', 'thng')),
  bid_no text not null,
  bid_ord text not null default '000',
  title text not null,
  notice_inst text,
  demand_inst text,
  budget_amount numeric(16, 0),
  presmpt_price numeric(16, 0),
  notice_date timestamptz,
  opening_date timestamptz,
  detail_url text,
  collected_at date not null default current_date,
  created_at timestamptz not null default now(),
  unique (bid_no, bid_ord)
);

create index if not exists idx_budget_bids_notice_date on public.budget_bids (notice_date desc);
create index if not exists idx_budget_bids_keyword on public.budget_bids (keyword);

alter table public.budget_bids enable row level security;

create policy "authenticated can select budget bids"
  on public.budget_bids for select
  using (auth.role() = 'authenticated');
