-- ============================================================================
-- AI HUB(2026-09-06) — 사이드바 새 그룹. 세 메뉴:
--   AI Tools  : AI 관련 링크 모음(팀원 누구나 등록, ad_strategy_memos와 비슷한
--               가벼운 CRUD — 댓글·첨부파일 없음).
--   AI Review : Meeting Notes와 완전히 같은 구현(마크다운 업로드/붙여넣기 +
--               렌더링 + 목차 + 댓글) — 미팅 전용 필드(참석자/장소)만 없음.
--   AI Issue  : 매일 아침 자동으로 채워지는 "AI 이슈가 되는 소식" 피드
--               (news_articles처럼 authenticated는 읽기 전용, 쓰기는 service_role
--               — Vercel Cron이 admin 클라이언트로 채운다. 사람이 직접 쓰는
--               INSERT 정책 자체가 없음).
-- ============================================================================

create table if not exists public.ai_tools (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  author_email text not null,
  title text not null,
  url text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_tools_created_at on public.ai_tools (created_at desc);

alter table public.ai_tools enable row level security;

create policy "authenticated can select ai tools"
  on public.ai_tools for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert own ai tools"
  on public.ai_tools for insert
  with check (auth.role() = 'authenticated' and author_id = auth.uid());

create policy "author or admin can update ai tools"
  on public.ai_tools for update
  using (auth.role() = 'authenticated' and (author_id = auth.uid() or public.is_admin(auth.uid())));

create policy "author or admin can delete ai tools"
  on public.ai_tools for delete
  using (auth.role() = 'authenticated' and (author_id = auth.uid() or public.is_admin(auth.uid())));

create table if not exists public.ai_reviews (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  author_email text not null,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_reviews_created_at on public.ai_reviews (created_at desc);

alter table public.ai_reviews enable row level security;

create policy "authenticated can select ai reviews"
  on public.ai_reviews for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert own ai reviews"
  on public.ai_reviews for insert
  with check (auth.role() = 'authenticated' and author_id = auth.uid());

create policy "author or admin can update ai reviews"
  on public.ai_reviews for update
  using (auth.role() = 'authenticated' and (author_id = auth.uid() or public.is_admin(auth.uid())));

create policy "author or admin can delete ai reviews"
  on public.ai_reviews for delete
  using (auth.role() = 'authenticated' and (author_id = auth.uid() or public.is_admin(auth.uid())));

create table if not exists public.ai_review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.ai_reviews (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_email text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_review_comments_review on public.ai_review_comments (review_id, created_at);

alter table public.ai_review_comments enable row level security;

create policy "authenticated can select ai review comments"
  on public.ai_review_comments for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert own ai review comments"
  on public.ai_review_comments for insert
  with check (auth.role() = 'authenticated' and author_id = auth.uid());

-- 개별 댓글 삭제 UI는 없다 — 리뷰 삭제 시 cascade가 RLS에 막히지 않게 하려는 용도.
create policy "authenticated can delete ai review comments"
  on public.ai_review_comments for delete
  using (auth.role() = 'authenticated');

create table if not exists public.ai_issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  link text not null unique,
  description text,
  summary text,
  source_query text,
  published_at timestamptz,
  issue_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_issues_issue_date on public.ai_issues (issue_date desc, created_at desc);

alter table public.ai_issues enable row level security;

create policy "authenticated can select ai issues"
  on public.ai_issues for select
  using (auth.role() = 'authenticated');

-- AI Review 등록 시 알림 피드에도 남기려면 type 체크 제약에 'ai_review'를
-- 추가해야 한다(0056에서 마지막으로 갱신된 제약을 확장).
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check check (
    type in (
      'event', 'business', 'youtube', 'budget_low', 'memo', 'budget_scrap', 'prespec_scrap',
      'news_scrap', 'cooperation', 'marketing', 'quotation', 'meeting_note', 'ai_review'
    )
  );
