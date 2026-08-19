-- ============================================================================
-- 사전규격 — 조달청 나라장터 사전규격정보서비스(공식, HrcspSsstndrdInfoService)
--
-- 입찰공고(budget_bids)보다 앞선 단계에서 발주기관이 규격을 미리 공개하는 단계를
-- 모니터링한다. budget_bids와 동일한 monitor_keywords(track='budget') 키워드를
-- 재사용한다 — 같은 영업 대응 목적이라 키워드 목록을 따로 관리할 필요가 없다.
-- pre_spec_reg_no(사전규격등록번호)가 자연키라 upsert(대체 delete-all 아님).
-- 다른 모니터링 데이터와 동일하게 authenticated는 SELECT만, 쓰기는 service_role만.
-- ============================================================================

create table if not exists public.prespec_notices (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  business_type text not null check (business_type in ('cnstwk', 'servc', 'thng')),
  pre_spec_reg_no text not null unique,
  title text not null,
  ref_no text,
  notice_inst text,
  demand_inst text,
  budget_amount numeric,
  registered_at timestamptz,
  opinion_close_at timestamptz,
  official_name text,
  official_tel text,
  spec_doc_urls text[] not null default '{}',
  bid_notice_nos text[] not null default '{}',
  collected_at timestamptz not null default now()
);

create index if not exists idx_prespec_notices_registered_at on public.prespec_notices (registered_at);

alter table public.prespec_notices enable row level security;

create policy "authenticated can select prespec notices"
  on public.prespec_notices for select
  using (auth.role() = 'authenticated');
