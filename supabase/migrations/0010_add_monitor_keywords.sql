-- ============================================================================
-- 뉴스·예산 모니터링 검색 키워드 관리
--
-- 지금까지는 config/news_keywords.yaml, config/budget_keywords.yaml 정적 파일로
-- 관리했는데, 팀원이 대시보드에서 직접 추가/삭제할 수 있도록 Supabase로 옮긴다.
-- 이후 파이프라인(naver-news-fetch, g2b-budget-fetch)은 이 테이블을 읽어서
-- 그날 검색할 키워드를 정한다 — YAML 파일은 더 이상 쓰지 않는다.
--
-- 광고전략메모 게시판과 같은 이유로 authenticated 쓰기를 허용한다(내부 신뢰된
-- 팀 도구, 관리자 전용으로 좁힐 필요 없음).
-- ============================================================================

create table if not exists public.monitor_keywords (
  id uuid primary key default gen_random_uuid(),
  track text not null check (track in ('news', 'budget')),
  keyword text not null,
  created_at timestamptz not null default now(),
  unique (track, keyword)
);

alter table public.monitor_keywords enable row level security;

create policy "authenticated can select monitor keywords"
  on public.monitor_keywords for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert monitor keywords"
  on public.monitor_keywords for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated can delete monitor keywords"
  on public.monitor_keywords for delete
  using (auth.role() = 'authenticated');

-- 기존 YAML 파일에 있던 키워드를 그대로 옮겨온다(마이그레이션 전후 수집 대상이 끊기지 않도록).
insert into public.monitor_keywords (track, keyword) values
  ('news', '에듀테크'),
  ('news', 'AI 교육'),
  ('news', '교육감'),
  ('news', '교육청 예산'),
  ('news', '교육부'),
  ('news', '교육청 사업'),
  ('news', '교육 법령 개정'),
  ('budget', '그린스마트미래학교'),
  ('budget', '공간재구조화'),
  ('budget', 'VR스포츠실'),
  ('budget', '실감형콘텐츠'),
  ('budget', '메이커스페이스'),
  ('budget', '디지털교과서'),
  ('budget', '스마트교실')
on conflict (track, keyword) do nothing;
