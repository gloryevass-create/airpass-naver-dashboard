-- ============================================================================
-- 특수학교현황 — 교육부 국립특수교육원_특수학교현황(공공데이터포털, odcloud.kr 공식 API)
--
-- 참고 데이터라 이력 누적이 필요 없어 매 동기화마다 통째로 교체한다(upsert가 아니라
-- delete-all-then-insert). 전국 196개교 규모라 매일 전체 재수집에 문제없다(1회 호출).
-- 다른 모니터링 데이터와 동일하게 읽기 전용(authenticated는 SELECT만, 쓰기는
-- service_role만).
-- ============================================================================

create table if not exists public.special_schools (
  id uuid primary key default gen_random_uuid(),
  school_name text not null,
  province_name text,
  foundation_type text,
  disability_domain text,
  principal_name text,
  approval_date date,
  opening_date date,
  principal_office_phone text,
  admin_office_phone text,
  teacher_office_phone text,
  fax_number text,
  zip_code text,
  address text,
  homepage_url text,
  reference_date date,
  synced_at timestamptz not null default now()
);

create index if not exists idx_special_schools_province on public.special_schools (province_name);
create index if not exists idx_special_schools_name on public.special_schools (school_name);

alter table public.special_schools enable row level security;

create policy "authenticated can select special schools"
  on public.special_schools for select
  using (auth.role() = 'authenticated');
