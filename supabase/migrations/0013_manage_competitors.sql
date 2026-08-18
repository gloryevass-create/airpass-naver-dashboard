-- ============================================================================
-- 경쟁사 블로그 등록/삭제 관리
--
-- 지금까지는 config/competitors.yaml 정적 파일로 관리했는데, 팀원이 대시보드에서
-- 직접 등록/삭제할 수 있도록 한다. 이후 파이프라인(naver-blog-fetch 등)은 이
-- 테이블(is_active=true 행)을 읽어서 그날 수집할 블로그를 정한다.
--
-- competitors는 blog_posts/blog_sov_daily/posting_cadence/ad_spend_estimates가
-- on delete cascade로 참조하고 있어 하드 삭제하면 그 경쟁사의 누적 이력이 전부
-- 같이 사라진다 — 그래서 실제 삭제 대신 is_active를 끄는 소프트 삭제로 처리한다
-- (대시보드 "삭제" 버튼은 이 컬럼만 false로 바꾼다).
-- ============================================================================

alter table public.competitors add column if not exists is_active boolean not null default true;

-- 대시보드에서 새 경쟁사를 추가할 때 이름 중복을 깔끔하게 막는다(기존엔 unique 제약이
-- 없어 코드에서 "조회 후 없으면 insert"로 우회했는데, 이제 대시보드가 직접 insert하므로
-- DB 제약이 필요하다).
alter table public.competitors add constraint competitors_name_key unique (name);

create policy "authenticated can insert competitors"
  on public.competitors for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated can update competitors"
  on public.competitors for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 기존 config/competitors.yaml에 있던 경쟁사를 그대로 옮겨온다(마이그레이션 전후 수집
-- 대상이 끊기지 않도록). 실제로는 파이프라인이 이미 매일 실행되며 ensureCompetitors로
-- 대부분 존재하겠지만, 신규/재구축 환경에서도 동일하게 시작하도록 명시적으로 남긴다.
insert into public.competitors (name, domain, blog_id) values
  ('이엔씨아이티', 'encit.co.kr', 'encit'),
  ('위즈업', 'whizzup.co.kr', 'whizzup'),
  ('뉴로플레이랩', 'neuroplay.co.kr', 'neuroplay'),
  ('투데이스쿨', null, 'carasystem'),
  ('플레이디딤', 'play-didim.com', null),
  ('에어패스', 'airpass.co.kr', 'airpass-blog')
on conflict (name) do nothing;
