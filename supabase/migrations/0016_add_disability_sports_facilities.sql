-- ============================================================================
-- 장애인체육시설 — 대한장애인체육회_장애인전용체육시설(공공데이터포털, 공식 API)
--
-- 청소년관련기관/장애인관련기관과 동일한 성격의 참고 데이터 — 이력 누적이
-- 필요 없어 매 동기화마다 통째로 교체한다(upsert가 아니라 delete-all-then-insert).
-- 이 API에도 시설유형 필드가 없어(전부 "장애인전용체육시설") 시설유형별 통계는
-- 만들지 않는다(장애인단체와 동일한 판단, 2026-08-18).
-- 다른 모니터링 데이터와 동일하게 읽기 전용(authenticated는 SELECT만, 쓰기는
-- service_role만).
-- ============================================================================

create table if not exists public.disability_sports_facilities (
  id uuid primary key default gen_random_uuid(),
  facility_name text not null,
  province_name text,
  district_name text,
  operating_body text,
  phone_number text,
  homepage_url text,
  has_voucher_program boolean,
  has_bandabi_facility boolean,
  synced_at timestamptz not null default now()
);

create index if not exists idx_disability_sports_province on public.disability_sports_facilities (province_name);
create index if not exists idx_disability_sports_name on public.disability_sports_facilities (facility_name);

alter table public.disability_sports_facilities enable row level security;

create policy "authenticated can select disability sports facilities"
  on public.disability_sports_facilities for select
  using (auth.role() = 'authenticated');
