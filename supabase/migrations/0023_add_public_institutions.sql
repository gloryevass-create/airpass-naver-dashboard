-- ============================================================================
-- 공공기관정보 — 행정안전부_공공기관 웹,모바일웹 사이트 정보(공공데이터포털, odcloud.kr
-- 공식 API, namespace 15050540/v1)
--
-- 참고 데이터라 이력 누적이 필요 없어 매 동기화마다 통째로 교체한다(upsert가 아니라
-- delete-all-then-insert). 전국 591개 기관 규모라 매일 전체 재수집에 문제없다(1회 호출).
-- 다른 모니터링 데이터와 동일하게 읽기 전용(authenticated는 SELECT만, 쓰기는
-- service_role만).
-- ============================================================================

create table if not exists public.public_institutions (
  id uuid primary key default gen_random_uuid(),
  site_name text not null,
  institution_type text,
  institution_category text,
  detail_category text,
  site_type text,
  url text,
  synced_at timestamptz not null default now()
);

create index if not exists idx_public_institutions_type on public.public_institutions (institution_type);
create index if not exists idx_public_institutions_category on public.public_institutions (institution_category);

alter table public.public_institutions enable row level security;

create policy "authenticated can select public institutions"
  on public.public_institutions for select
  using (auth.role() = 'authenticated');
