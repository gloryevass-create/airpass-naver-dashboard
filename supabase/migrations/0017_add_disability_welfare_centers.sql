-- ============================================================================
-- 장애인편의시설(장애인복지관류 공공시설) — 전국장애인편의시설표준데이터
-- (공공데이터포털, 한국사회보장정보원 공식 API getDisConvFaclList)
--
-- 원본 API는 전국 18만 건(편의시설이 설치된 건물 전체 — 다세대주택·상가 등 포함)이라
-- 매일 전체 재수집이 비현실적이고 "장애인이 이용하는 시설"과 성격도 다르다. 그래서
-- 시설명에 "장애인"이 포함된 결과만 조회한 뒤(faclNm 검색 파라미터), 그중 다시
-- "복지관"이 포함된 이름만 걸러 장애인복지관류 공공시설로 범위를 좁힌다
-- (사용자 확인, 2026-08-18).
--
-- 참고 데이터라 이력 누적이 필요 없어 매 동기화마다 통째로 교체한다
-- (upsert가 아니라 delete-all-then-insert). 다른 모니터링 데이터와 동일하게
-- 읽기 전용(authenticated는 SELECT만, 쓰기는 service_role만).
-- ============================================================================

create table if not exists public.disability_welfare_centers (
  id uuid primary key default gen_random_uuid(),
  facility_name text not null,
  facility_type text,
  province_name text,
  road_address text,
  latitude numeric,
  longitude numeric,
  operating_status text,
  establishment_date date,
  welfare_facility_id text,
  synced_at timestamptz not null default now()
);

create index if not exists idx_disability_welfare_province on public.disability_welfare_centers (province_name);
create index if not exists idx_disability_welfare_name on public.disability_welfare_centers (facility_name);

alter table public.disability_welfare_centers enable row level security;

create policy "authenticated can select disability welfare centers"
  on public.disability_welfare_centers for select
  using (auth.role() = 'authenticated');
