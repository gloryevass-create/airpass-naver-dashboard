-- ============================================================================
-- 계정 전체 일별 광고 성과지표(노출수/클릭수/전환수/지출액) + 비즈머니 잔액
--
-- 네이버 검색광고 공식 통계 API(/stats)에 캠페인 ID들을 콤마로 묶어 요청하면
-- 계정 전체를 합산한 일별 데이터가 그대로 나온다. 비즈머니 잔액은 별도
-- 공식 API(/billing/bizmoney)로 매일 스냅샷 형태로 함께 저장한다(하루 1회 수집이므로
-- 그 날짜의 남은 잔액 스냅샷일 뿐, 일중 변동을 추적하지는 않음).
-- ============================================================================

create table if not exists public.ad_account_daily_stats (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  imp_cnt integer not null default 0,
  clk_cnt integer not null default 0,
  ccnt integer not null default 0,
  sales_amt numeric(14, 2) not null default 0,
  ctr numeric(6, 2),
  cpc numeric(10, 2),
  bizmoney numeric(14, 2),
  created_at timestamptz not null default now()
);

create index if not exists idx_aads_date on public.ad_account_daily_stats (date desc);

alter table public.ad_account_daily_stats enable row level security;

create policy "authenticated can select"
  on public.ad_account_daily_stats for select
  using (auth.role() = 'authenticated');
