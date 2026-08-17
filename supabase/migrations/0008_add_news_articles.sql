-- ============================================================================
-- 뉴스 모니터링 — 교육청 사업·정책 관련 뉴스
--
-- 에듀테크/AI/교육감/교육청/교육부 등 영업 전략에 직접 영향을 줄 수 있는 뉴스를
-- 네이버 뉴스 검색 공식 API(NAVER API HUB) 기반으로 수집한다. 다른 모니터링
-- 데이터와 동일하게 읽기 전용(authenticated는 SELECT만, 쓰기는 service_role만).
-- ============================================================================

create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  title text not null,
  link text not null unique,
  description text,
  published_at timestamptz,
  collected_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_news_published on public.news_articles (published_at desc);
create index if not exists idx_news_keyword on public.news_articles (keyword);

alter table public.news_articles enable row level security;

create policy "authenticated can select news"
  on public.news_articles for select
  using (auth.role() = 'authenticated');
