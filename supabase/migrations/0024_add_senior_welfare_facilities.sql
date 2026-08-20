-- ============================================================================
-- 시니어복지시설 — 전국마을회관및경로당표준데이터(공공데이터포털, tn_pubr_public_vill_hall_sen_cent_api)
-- 중 시설유형이 "경로당"인 항목만(마을회관·마을회관및경로당 결합형 제외, API 요청 시점에
-- flctTyp=경로당으로 서버 필터링).
--
-- 참고 데이터라 이력 누적이 필요 없어 매 동기화마다 통째로 교체한다(upsert가 아니라
-- delete-all-then-insert). 전국 약 3.5만 개소 규모. 다른 모니터링 데이터와 동일하게
-- 읽기 전용(authenticated는 SELECT만, 쓰기는 service_role만).
-- ============================================================================

create table if not exists public.senior_welfare_facilities (
  id uuid primary key default gen_random_uuid(),
  facility_name text not null,
  facility_type text,
  province_name text,
  road_address text,
  lot_address text,
  latitude double precision,
  longitude double precision,
  business_status text,
  phone_number text,
  managing_org_name text,
  providing_inst_name text,
  reference_date date,
  synced_at timestamptz not null default now()
);

create index if not exists idx_senior_welfare_facilities_province on public.senior_welfare_facilities (province_name);

alter table public.senior_welfare_facilities enable row level security;

create policy "authenticated can select senior welfare facilities"
  on public.senior_welfare_facilities for select
  using (auth.role() = 'authenticated');
