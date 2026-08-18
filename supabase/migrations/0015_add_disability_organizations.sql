-- ============================================================================
-- 장애인관련기관 — 전국장애인단체표준데이터(공공데이터포털, 보건복지부 공식 API
-- tn_pubr_public_disabled_orgs_api)
--
-- 청소년관련기관(youth_facilities)과 동일한 성격의 참고 데이터 — 이력 누적이
-- 필요 없어 매 동기화마다 통째로 교체한다(upsert가 아니라 delete-all-then-insert).
-- 이 API에는 시설유형 필드가 없어(전부 "단체") 시설유형별 통계는 만들지 않는다
-- (사용자 확인, 2026-08-18).
-- 다른 모니터링 데이터와 동일하게 읽기 전용(authenticated는 SELECT만, 쓰기는
-- service_role만).
-- ============================================================================

create table if not exists public.disability_organizations (
  id uuid primary key default gen_random_uuid(),
  group_name text not null,
  province_name text,
  district_name text,
  road_address text,
  lot_address text,
  foundation_date date,
  member_count integer,
  phone_number text,
  representative_name text,
  reference_date date,
  provider_org_code text,
  provider_org_name text,
  synced_at timestamptz not null default now()
);

create index if not exists idx_disability_orgs_province on public.disability_organizations (province_name);
create index if not exists idx_disability_orgs_name on public.disability_organizations (group_name);

alter table public.disability_organizations enable row level security;

create policy "authenticated can select disability organizations"
  on public.disability_organizations for select
  using (auth.role() = 'authenticated');
