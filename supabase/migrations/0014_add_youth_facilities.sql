-- ============================================================================
-- 청소년관련기관DB — 전국청소년수련시설 현황(공공데이터포털, 여성가족부/한국청소년활동진흥원
-- "청소년수련시설정보서비스" getTeenTrftListV2)
--
-- 참고 데이터라 이력 누적이 필요 없다 — 매 동기화마다 전체를 다시 받아 통째로
-- 교체한다(다른 모니터링 테이블과 달리 upsert가 아니라 delete-all-then-insert).
-- 다른 모니터링 데이터와 동일하게 읽기 전용(authenticated는 SELECT만, 쓰기는
-- service_role만).
-- ============================================================================

create table if not exists public.youth_facilities (
  id uuid primary key default gen_random_uuid(),
  facility_name text not null,
  representative_name text,
  operating_body text,
  operation_mode text,
  foundation_subject text,
  foundation_org_detail text,
  installation_type text,
  facility_type text,
  province_name text,
  district_name text,
  road_address text,
  lot_address text,
  latitude numeric,
  longitude numeric,
  homepage_url text,
  phone_number text,
  fax_number text,
  email text,
  operating_hours text,
  holiday_info text,
  has_parking boolean,
  capacity_count integer,
  overnight_capacity_count integer,
  stay_capacity_count integer,
  companion_capacity_count integer,
  first_registered_date date,
  reference_date date,
  is_exposed boolean,
  remarks text,
  synced_at timestamptz not null default now()
);

create index if not exists idx_youth_facilities_province on public.youth_facilities (province_name);
create index if not exists idx_youth_facilities_name on public.youth_facilities (facility_name);

alter table public.youth_facilities enable row level security;

create policy "authenticated can select youth facilities"
  on public.youth_facilities for select
  using (auth.role() = 'authenticated');
