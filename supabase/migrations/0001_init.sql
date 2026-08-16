-- ============================================================================
-- 에어패스 네이버 마케팅 모니터링 — 초기 스키마
--
-- 이 파일이 스키마의 단일 출처(source of truth)다.
-- 프로젝트 2(모니터링 에이전트)는 이 구조를 그대로 참조해 upsert하며,
-- 스키마를 변경할 때는 이 파일(과 필요하면 후속 0002_*.sql)만 수정한다.
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. profiles — 로그인 사용자 프로필 (auth.users 1:1)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "select own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "admins can select all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. keywords — 에어패스 검색광고 계정에서 자동 동기화되는 키워드
create table if not exists public.keywords (
  id uuid primary key default gen_random_uuid(),
  naver_keyword_id text not null unique,
  keyword text not null,
  campaign_id text,
  adgroup_id text,
  status text not null default 'ELIGIBLE',
  is_excluded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_keywords_status on public.keywords (status, is_excluded);

-- 3. keyword_daily_metrics — 키워드별 일별 노출순위·CPC·검색량
create table if not exists public.keyword_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  keyword_id uuid not null references public.keywords (id) on delete cascade,
  monthly_search_pc integer,
  monthly_search_mobile integer,
  avg_cpc numeric(12, 2),
  competition_level text,
  our_rank integer,
  created_at timestamptz not null default now(),
  unique (date, keyword_id)
);

create index if not exists idx_kdm_date on public.keyword_daily_metrics (date);

-- 4. competitors — 모니터링 대상 경쟁사 (수동 등록, 5~10곳)
create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  blog_id text,
  created_at timestamptz not null default now()
);

-- 5. ad_spend_estimates — 경쟁사 월 예상 광고비 추정
create table if not exists public.ad_spend_estimates (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  keyword_id uuid not null references public.keywords (id) on delete cascade,
  estimated_monthly_spend numeric(14, 2) not null,
  calc_basis jsonb, -- 산출 근거(순위·CPC·가정 클릭률·운영일수 등) — 환각 차단·각주 표기용
  created_at timestamptz not null default now(),
  unique (date, competitor_id, keyword_id)
);

create index if not exists idx_ase_date on public.ad_spend_estimates (date);

-- 6. blog_posts — 경쟁사 블로그 게시물 원본
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  url text not null unique,
  title text,
  published_at date,
  collected_at date not null default current_date
);

-- 7. blog_sov_daily — 키워드별 경쟁사 블로그 노출 점유율
create table if not exists public.blog_sov_daily (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  keyword_id uuid not null references public.keywords (id) on delete cascade,
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  share_pct numeric(5, 2) not null,
  unique (date, keyword_id, competitor_id)
);

create index if not exists idx_sov_date on public.blog_sov_daily (date);

-- 8. posting_cadence — 경쟁사 블로그 포스팅 주기
create table if not exists public.posting_cadence (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  avg_interval_days numeric(6, 2),
  last_post_at date,
  post_count_30d integer,
  unique (date, competitor_id)
);

create index if not exists idx_cadence_date on public.posting_cadence (date);

-- 9. pipeline_runs — 파이프라인 상태 파일의 DB 버전
create table if not exists public.pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  track text not null check (track in ('ad', 'blog')),
  status text not null check (status in ('success', 'partial', 'failed')),
  message text,
  created_at timestamptz not null default now(),
  unique (date, track)
);

-- 10. daily_reports — 일간/주간/월간 자연어 리포트
create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  report_type text not null check (report_type in ('daily', 'weekly', 'monthly')),
  track text not null check (track in ('ad', 'blog', 'combined')),
  title text not null,
  content_md text not null,
  source_refs jsonb, -- 리포트 안에서 인용한 데이터 출처 — 환각 차단용
  created_at timestamptz not null default now(),
  unique (date, report_type, track)
);

create index if not exists idx_reports_date on public.daily_reports (date desc);

-- 11. alerts — 이상치 탐지 결과
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  category text not null,
  message text not null,
  evidence_ref text,
  created_at timestamptz not null default now()
);

create index if not exists idx_alerts_date on public.alerts (date desc, severity desc);

-- 12. RLS — 모니터링 데이터 테이블: 로그인 사용자는 SELECT만, 쓰기는 service_role만
do $$
declare
  t text;
begin
  foreach t in array array[
    'keywords', 'keyword_daily_metrics', 'competitors', 'ad_spend_estimates',
    'blog_posts', 'blog_sov_daily', 'posting_cadence', 'pipeline_runs',
    'daily_reports', 'alerts'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format(
      'create policy "authenticated can select" on public.%I for select using (auth.role() = ''authenticated'');',
      t
    );
  end loop;
end $$;
